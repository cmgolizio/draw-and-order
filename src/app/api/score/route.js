// import { NextResponse } from "next/server";
// import OpenAI from "openai";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const TRAIT_KEYS = [
//   "faceShape",
//   "skinTone",
//   "hairColor",
//   "hairStyle",
//   "eyeShape",
//   "eyeColor",
//   "eyebrows",
//   "noseShape",
//   "mouthShape",
//   "distinctiveMarks",
// ];

// function cosineSimilarity(a, b) {
//   const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
//   const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
//   const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
//   if (magA === 0 || magB === 0) return 0;
//   return dot / (magA * magB);
// }

// function clampScore(value) {
//   if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
//   return Math.max(0, Math.min(100, value));
// }

// // Convert uploaded file → Buffer
// async function fileToBuffer(file) {
//   const arr = await file.arrayBuffer();
//   return Buffer.from(arr);
// }

// function bufferToBase64(buffer) {
//   return buffer.toString("base64");
// }

// /* ---------------------------------------------
//  * PART 1: Embedding Score
//  * ------------------------------------------- */
// async function getEmbeddingScore(originalBuffer, drawingBuffer) {
//   const toEmbedding = async (inputBuffer) => {
//     const response = await openai.embeddings.create({
//       model: "gpt-visual-embedding",
//       input: [
//         {
//           image: {
//             data: bufferToBase64(inputBuffer),
//           },
//         },
//       ],
//     });

//     return response.data[0]?.embedding || [];
//   };

//   const [origEmbed, drawEmbed] = await Promise.all([
//     toEmbedding(originalBuffer),
//     toEmbedding(drawingBuffer),
//   ]);

//   if (!origEmbed.length || !drawEmbed.length) return 0;
//   const similarity = cosineSimilarity(origEmbed, drawEmbed);
//   return clampScore(similarity * 100);
// }

// /* ---------------------------------------------
//  * PART 2: Trait Scoring
//  * ------------------------------------------- */
// async function getTraitScores(originalBuffer, drawingBuffer) {
//   const prompt = `Compare these two faces category by category. Score each category 0-100 where 100 is identical. Categories: faceShape, skinTone, hairColor, hairStyle, eyeShape, eyeColor, eyebrows, noseShape, mouthShape, distinctiveMarks. Output strictly JSON matching: {"faceShape":0-100,"skinTone":0-100,"hairColor":0-100,"hairStyle":0-100,"eyeShape":0-100,"eyeColor":0-100,"eyebrows":0-100,"noseShape":0-100,"mouthShape":0-100,"distinctiveMarks":0-100}.`;

//   const response = await openai.responses.create({
//     model: "gpt-4o",
//     input: [
//       {
//         role: "user",
//         content: [
//           {
//             type: "input_image",
//             image: { data: bufferToBase64(originalBuffer) },
//           },
//           {
//             type: "input_image",
//             image: { data: bufferToBase64(drawingBuffer) },
//           },
//           { type: "text", text: prompt },
//         ],
//       },
//     ],
//     text: { format: "json_object" },
//   });

//   const raw = response.output[0]?.content?.[0]?.text || "{}";

//   let parsed = {};
//   try {
//     parsed = JSON.parse(raw);
//   } catch (err) {}

//   const breakdown = {};
//   let sum = 0;

//   TRAIT_KEYS.forEach((key) => {
//     const value = clampScore(Number(parsed?.[key] ?? 0));
//     breakdown[key] = value;
//     sum += value;
//   });

//   return {
//     traitScore: sum / TRAIT_KEYS.length,
//     traitBreakdown: breakdown,
//   };
// }

// /* ---------------------------------------------
//  * PART 3: Landmark Geometry Score
//  * ------------------------------------------- */
// async function extractLandmarks(buffer) {
//   const prompt = `Identify normalized facial landmark coordinates (0-1) for these points: eyeLeftOuter [x,y], eyeRightOuter [x,y], noseTip [x,y], mouthLeft [x,y], mouthRight [x,y], jawLeft [x,y], jawRight [x,y]. Return JSON: {"eyeLeft":[x,y],"eyeRight":[x,y],"noseTip":[x,y],"mouthLeft":[x,y],"mouthRight":[x,y],"jawLeft":[x,y],"jawRight":[x,y]}.`;

//   const response = await openai.responses.create({
//     model: "gpt-4o",
//     input: [
//       {
//         role: "user",
//         content: [
//           { type: "input_image", image: { data: bufferToBase64(buffer) } },
//           { type: "text", text: prompt },
//         ],
//       },
//     ],
//     text: { format: "json_object" },
//   });

//   try {
//     return JSON.parse(response.output[0]?.content?.[0]?.text || "{}");
//   } catch {
//     return null;
//   }
// }

// function distance(a, b) {
//   if (!a || !b) return null;
//   const dx = a[0] - b[0];
//   const dy = a[1] - b[1];
//   return Math.sqrt(dx * dx + dy * dy);
// }

// function angle(a, b) {
//   if (!a || !b) return null;
//   return Math.atan2(b[1] - a[1], b[0] - a[0]);
// }

// function metricScore(base, target) {
//   if (base === null || target === null) return 0;
//   const diff = Math.abs(base - target);
//   const denom = Math.max(base, target, 1e-6);
//   return clampScore((1 - diff / denom) * 100);
// }

// async function getLandmarkScore(originalBuffer, drawingBuffer) {
//   const [orig, draw] = await Promise.all([
//     extractLandmarks(originalBuffer),
//     extractLandmarks(drawingBuffer),
//   ]);

//   if (!orig || !draw) return 0;

//   const metrics = [
//     metricScore(
//       distance(orig.eyeLeft, orig.eyeRight),
//       distance(draw.eyeLeft, draw.eyeRight)
//     ),
//     metricScore(
//       distance(orig.mouthLeft, orig.mouthRight),
//       distance(draw.mouthLeft, draw.mouthRight)
//     ),
//     metricScore(
//       distance(orig.jawLeft, orig.jawRight),
//       distance(draw.jawLeft, draw.jawRight)
//     ),
//     metricScore(
//       Math.abs(angle(orig.eyeLeft, orig.eyeRight)),
//       Math.abs(angle(draw.eyeLeft, draw.eyeRight))
//     ),
//     metricScore(
//       distance(orig.noseTip, [0.5, 0.5]),
//       distance(draw.noseTip, [0.5, 0.5])
//     ),
//   ];

//   const valid = metrics.filter((v) => Number.isFinite(v));
//   return valid.reduce((a, b) => a + b, 0) / valid.length;
// }

// /* ---------------------------------------------
//  * FINAL SCORE
//  * ------------------------------------------- */
// function computeFinalScore(embedding, traits, landmarks) {
//   return Number((embedding * 0.4 + traits * 0.4 + landmarks * 0.2).toFixed(1));
// }

// /* ---------------------------------------------
//  * POST HANDLER (FILES ONLY)
//  * ------------------------------------------- */
// export async function POST(req) {
//   try {
//     const formData = await req.formData();

//     const originalFile = formData.get("originalImage");
//     const drawingFile = formData.get("userDrawing");

//     if (!originalFile || !drawingFile) {
//       return NextResponse.json(
//         { error: "originalImage and userDrawing are required" },
//         { status: 400 }
//       );
//     }

//     const [originalBuffer, drawingBuffer] = await Promise.all([
//       fileToBuffer(originalFile),
//       fileToBuffer(drawingFile),
//     ]);

//     const [embeddingScore, traitData, landmarkScore] = await Promise.all([
//       getEmbeddingScore(originalBuffer, drawingBuffer),
//       getTraitScores(originalBuffer, drawingBuffer),
//       getLandmarkScore(originalBuffer, drawingBuffer),
//     ]);

//     const finalScore = computeFinalScore(
//       embeddingScore,
//       traitData.traitScore,
//       landmarkScore
//     );

//     return NextResponse.json({
//       finalScore,
//       embeddingScore,
//       traitScore: traitData.traitScore,
//       landmarkScore,
//       traitBreakdown: traitData.traitBreakdown,
//       timestamp: Date.now(),
//     });
//   } catch (error) {
//     console.error("Scoring error", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
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

function deterministicScore(originalBuffer, drawingBuffer) {
  const hash = createHash("sha256")
    .update(originalBuffer)
    .update(drawingBuffer)
    .digest();

  const toScore = (offset) =>
    clampScore(Math.round((hash[offset] / 255) * 100));

  const embeddingScore = toScore(0);
  const traitScore = toScore(1);
  const landmarkScore = toScore(2);

  const traitBreakdown = Object.fromEntries(
    TRAIT_KEYS.map((key, index) => [
      key,
      toScore((index % (hash.length - 3)) + 3),
    ])
  );

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

async function getTraitScores(originalBuffer, drawingBuffer) {
  const prompt = `Compare these two faces category by category. Score each category 0-100 where 100 is identical. Categories: faceShape, skinTone, hairColor, hairStyle, eyeShape, eyeColor, eyebrows, noseShape, mouthShape, distinctiveMarks. Output exactly this JSON structure: {"faceShape":0-100,"skinTone":0-100,"hairColor":0-100,"hairStyle":0-100,"eyeShape":0-100,"eyeColor":0-100,"eyebrows":0-100,"noseShape":0-100,"mouthShape":0-100,"distinctiveMarks":0-100}.`;

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
  TRAIT_KEYS.forEach((key) => {
    const v = clampScore(Number(parsed[key] ?? 0));
    breakdown[key] = v;
    sum += v;
  });

  return {
    traitScore: sum / TRAIT_KEYS.length,
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
        deterministicScore(originalBuffer, drawingBuffer)
      );
    }

    try {
      const [embeddingScore, traitData, landmarkScore] = await Promise.all([
        getEmbeddingScore(originalBuffer, drawingBuffer),
        getTraitScores(originalBuffer, drawingBuffer),
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
          timestamp: Date.now(),
        },
        { status: 200 }
      );
    } catch (err) {
      console.error("OpenAI scoring failed, using fallback:", err);
      return NextResponse.json(
        deterministicScore(originalBuffer, drawingBuffer)
      );
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
