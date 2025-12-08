import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

const TRAIT_KEYS = [
  "faceShape",
  "skinTone",
  "hairColor",
  "hairStyle",
  "eyeShape",
  "eyeColor",
  "eyebrows",
  "noseShape",
  "mouthShape",
  "distinctiveMarks",
];

const COLOR_TRAITS = ["skinTone", "hairColor", "eyeColor"];

const getActiveTraitKeys = (scoringMode) =>
  scoringMode === "black-and-white"
    ? TRAIT_KEYS.filter((key) => !COLOR_TRAITS.includes(key))
    : TRAIT_KEYS;

/* -----------------------------------------------------
 * UTILS
 * --------------------------------------------------- */

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}

function clampScore(v) {
  return Math.max(0, Math.min(100, v));
}

async function fileToBuffer(file) {
  const arr = await file.arrayBuffer();
  return Buffer.from(arr);
}

const bufferToBase64 = (buf) => buf.toString("base64");

// function deterministicScore(originalBuffer, drawingBuffer) {
function deterministicScore(
  originalBuffer,
  drawingBuffer,
  traitKeys = TRAIT_KEYS
) {
  const hash = createHash("sha256")
    .update(originalBuffer)
    .update(drawingBuffer)
    .digest();

  const toScore = (offset) =>
    clampScore(Math.round((hash[offset] / 255) * 100));

  const embeddingScore = toScore(0);
  // const traitScore = toScore(1);
  const landmarkScore = toScore(2);

  const traitBreakdown = Object.fromEntries(
    // TRAIT_KEYS.map((key, index) => [
    traitKeys.map((key, index) => [
      key,
      toScore((index % (hash.length - 3)) + 3),
    ])
  );

  const traitScore =
    traitKeys.length > 0
      ? traitKeys.reduce((sum, key) => sum + traitBreakdown[key], 0) /
        traitKeys.length
      : 0;

  const finalScore = computeFinalScore(
    embeddingScore,
    traitScore,
    landmarkScore
  );

  return {
    finalScore,
    embeddingScore,
    traitScore,
    landmarkScore,
    traitBreakdown,
    timestamp: Date.now(),
    mock: true,
  };
}

/* -----------------------------------------------------
 * PART 1 — EMBEDDING SCORE (new working system)
 * --------------------------------------------------- */

async function getEmbeddingScore(originalBuffer, drawingBuffer) {
  // STEP 1 — Convert image → text description
  const describe = async (buffer) => {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: {
                url: `data:image/png;base64,${bufferToBase64(buffer)}`,
              },
            },
            {
              type: "text",
              text: "Describe the face in ~50 words, focusing strictly on visual traits: shape, hair, eyes, nose, mouth, distinct marks, shadows, proportions.",
            },
          ],
        },
      ],
      text: { format: "plain_text" },
    });

    return response.output_text || "";
  };

  const [origText, drawText] = await Promise.all([
    describe(originalBuffer),
    describe(drawingBuffer),
  ]);

  // STEP 2 — Convert descriptions → embeddings
  const embed = async (text) => {
    const resp = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });
    return resp.data[0].embedding;
  };

  const [embedOrig, embedDraw] = await Promise.all([
    embed(origText),
    embed(drawText),
  ]);

  // STEP 3 — Compare embeddings
  const similarity = cosineSimilarity(embedOrig, embedDraw);

  return clampScore(similarity * 100);
}

/* -----------------------------------------------------
 * PART 2 — TRAIT GPT SCORING
 * --------------------------------------------------- */

// async function getTraitScores(originalBuffer, drawingBuffer) {
//   const prompt = `Compare these two faces category by category. Score each category 0-100 where 100 is identical. Categories: faceShape, skinTone, hairColor, hairStyle, eyeShape, eyeColor, eyebrows, noseShape, mouthShape, distinctiveMarks. Output exactly this JSON structure: {"faceShape":0-100,"skinTone":0-100,"hairColor":0-100,"hairStyle":0-100,"eyeShape":0-100,"eyeColor":0-100,"eyebrows":0-100,"noseShape":0-100,"mouthShape":0-100,"distinctiveMarks":0-100}.`;
async function getTraitScores(
  originalBuffer,
  drawingBuffer,
  traitKeys = TRAIT_KEYS
) {
  const prompt = `Compare these two faces category by category. Score each category 0-100 where 100 is identical. Categories: ${traitKeys.join(
    ", "
  )}. Output exactly this JSON structure: {${traitKeys
    .map((key) => `"${key}":0-100`)
    .join(",")}}.`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: {
              url: `data:image/png;base64,${bufferToBase64(originalBuffer)}`,
            },
          },
          {
            type: "input_image",
            image_url: {
              url: `data:image/png;base64,${bufferToBase64(drawingBuffer)}`,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    text: { format: "json_object" },
  });

  let parsed = {};
  try {
    parsed = JSON.parse(response.output[0]?.content?.[0]?.text ?? "{}");
  } catch {}

  const breakdown = {};
  let sum = 0;
  // TRAIT_KEYS.forEach((key) => {
  traitKeys.forEach((key) => {
    const v = clampScore(Number(parsed[key] ?? 0));
    breakdown[key] = v;
    sum += v;
  });

  return {
    // traitScore: sum / TRAIT_KEYS.length,
    traitScore: traitKeys.length > 0 ? sum / traitKeys.length : 0,
    traitBreakdown: breakdown,
  };
}

/* -----------------------------------------------------
 * PART 3 — LANDMARK GEOMETRY SCORE
 * --------------------------------------------------- */

async function extractLandmarks(buffer) {
  const prompt = `Identify normalized facial landmark coordinates (0-1):
eyeLeft [x,y],
eyeRight [x,y],
noseTip [x,y],
mouthLeft [x,y],
mouthRight [x,y],
jawLeft [x,y],
jawRight [x,y].
Return EXACT JSON: {"eyeLeft":[x,y],"eyeRight":[x,y],"noseTip":[x,y],"mouthLeft":[x,y],"mouthRight":[x,y],"jawLeft":[x,y],"jawRight":[x,y]}.`;

  const resp = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          // { type: "input_image", image: { data: bufferToBase64(buffer) } },
          {
            type: "input_image",
            image_url: {
              url: `data:image/png;base64,${bufferToBase64(buffer)}`,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    text: { format: "json_object" },
  });

  try {
    return JSON.parse(resp.output[0]?.content?.[0]?.text || "{}");
  } catch {
    return null;
  }
}

function dist(a, b) {
  if (!a || !b) return null;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(a, b) {
  if (!a || !b) return null;
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

function metricScore(a, b) {
  if (a === null || b === null) return 0;
  const diff = Math.abs(a - b);
  const denom = Math.max(a, b, 1e-6);
  return clampScore((1 - diff / denom) * 100);
}

async function getLandmarkScore(originalBuffer, drawingBuffer) {
  const [orig, draw] = await Promise.all([
    extractLandmarks(originalBuffer),
    extractLandmarks(drawingBuffer),
  ]);

  if (!orig || !draw) return 0;

  const scores = [
    metricScore(
      dist(orig.eyeLeft, orig.eyeRight),
      dist(draw.eyeLeft, draw.eyeRight)
    ),
    metricScore(
      dist(orig.mouthLeft, orig.mouthRight),
      dist(draw.mouthLeft, draw.mouthRight)
    ),
    metricScore(
      dist(orig.jawLeft, orig.jawRight),
      dist(draw.jawLeft, draw.jawRight)
    ),
    metricScore(
      Math.abs(angle(orig.eyeLeft, orig.eyeRight)),
      Math.abs(angle(draw.eyeLeft, draw.eyeRight))
    ),
    metricScore(dist(orig.noseTip, [0.5, 0.5]), dist(draw.noseTip, [0.5, 0.5])),
  ];

  const valid = scores.filter((v) => Number.isFinite(v));
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/* -----------------------------------------------------
 * FINAL SCORE
 * --------------------------------------------------- */

const computeFinalScore = (emb, trait, lm) =>
  Number((emb * 0.4 + trait * 0.4 + lm * 0.2).toFixed(1));

/* -----------------------------------------------------
 * POST HANDLER — FILES ONLY (Approach A)
 * --------------------------------------------------- */

export async function POST(req) {
  try {
    const formData = await req.formData();

    const originalFile = formData.get("originalImage");
    const drawingFile = formData.get("userDrawing");

    const scoringModeRaw = formData.get("scoringMode");
    const scoringMode =
      scoringModeRaw === "black-and-white" ? "black-and-white" : "color";
    const traitKeys = getActiveTraitKeys(scoringMode);

    if (!originalFile || !drawingFile) {
      return NextResponse.json(
        { error: "originalImage and userDrawing are required" },
        { status: 400 }
      );
    }

    const [originalBuffer, drawingBuffer] = await Promise.all([
      fileToBuffer(originalFile),
      fileToBuffer(drawingFile),
    ]);
    if (!hasOpenAIKey) {
      return NextResponse.json(
        // deterministicScore(originalBuffer, drawingBuffer)
        {
          ...deterministicScore(originalBuffer, drawingBuffer, traitKeys),
          scoringMode,
        }
      );
    }

    try {
      const [embeddingScore, traitData, landmarkScore] = await Promise.all([
        getEmbeddingScore(originalBuffer, drawingBuffer),
        // getTraitScores(originalBuffer, drawingBuffer),
        getTraitScores(originalBuffer, drawingBuffer, traitKeys),
        getLandmarkScore(originalBuffer, drawingBuffer),
      ]);

      const finalScore = computeFinalScore(
        embeddingScore,
        traitData.traitScore,
        landmarkScore
      );

      return NextResponse.json(
        {
          finalScore,
          embeddingScore,
          traitScore: traitData.traitScore,
          landmarkScore,
          traitBreakdown: traitData.traitBreakdown,
          scoringMode,
          timestamp: Date.now(),
        },
        { status: 200 }
      );
      // } catch (err) {
      //   console.error("OpenAI scoring failed, using fallback:", err);
      //   return NextResponse.json(
      //     deterministicScore(originalBuffer, drawingBuffer)
      //   );
      // }
    } catch (err) {
      console.error("OpenAI scoring failed, using fallback:", err);
      return NextResponse.json({
        ...deterministicScore(originalBuffer, drawingBuffer, traitKeys),
        scoringMode,
      });
    }
    // const [embeddingScore, traitData, landmarkScore] = await Promise.all([
    //   getEmbeddingScore(originalBuffer, drawingBuffer),
    //   getTraitScores(originalBuffer, drawingBuffer),
    //   getLandmarkScore(originalBuffer, drawingBuffer),
    // ]);

    // const finalScore = computeFinalScore(
    //   embeddingScore,
    //   traitData.traitScore,
    //   landmarkScore
    // );

    // return NextResponse.json(
    //   {
    //     finalScore,
    //     embeddingScore,
    //     traitScore: traitData.traitScore,
    //     landmarkScore,
    //     traitBreakdown: traitData.traitBreakdown,
    //     timestamp: Date.now(),
    //   },
    //   { status: 200 }
    // );
  } catch (err) {
    console.error("Scoring failed:", err);
    return NextResponse.json(
      { error: "Unable to score images", details: err.message },
      { status: 500 }
    );
  }
}
