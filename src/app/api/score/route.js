import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client. Insert your API key via environment variable OPENAI_API_KEY.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Expected categories for trait comparison
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

// Helper: convert cosine similarity to 0-100 score
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function clampScore(value) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

// Helper: load arrayBuffer from uploaded file
async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// PART 1: Embedding similarity using gpt-visual-embedding
async function getEmbeddingScore(originalBuffer, drawingBuffer) {
  const toEmbedding = async (inputBuffer) => {
    const response = await openai.embeddings.create({
      model: "gpt-visual-embedding",
      input: [
        {
          image: {
            data: inputBuffer,
          },
        },
      ],
    });
    return response.data[0]?.embedding || [];
  };

  const [origEmbed, drawEmbed] = await Promise.all([
    toEmbedding(originalBuffer),
    toEmbedding(drawingBuffer),
  ]);

  if (!origEmbed.length || !drawEmbed.length) return 0;
  const similarity = cosineSimilarity(origEmbed, drawEmbed);
  return clampScore(similarity * 100);
}

// PART 2: Trait-level GPT scoring with vision
async function getTraitScores(originalBuffer, drawingBuffer) {
  const prompt = `Compare these two faces category by category. Score each category 0-100 where 100 is identical. Categories: faceShape, skinTone, hairColor, hairStyle, eyeShape, eyeColor, eyebrows, noseShape, mouthShape, distinctiveMarks. If color is unknown, still provide a best-effort numeric score. Output strictly JSON matching: {"faceShape":0-100,"skinTone":0-100,"hairColor":0-100,"hairStyle":0-100,"eyeShape":0-100,"eyeColor":0-100,"eyebrows":0-100,"noseShape":0-100,"mouthShape":0-100,"distinctiveMarks":0-100}.`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          { type: "input_image", image: { data: originalBuffer } },
          { type: "input_image", image: { data: drawingBuffer } },
          { type: "text", text: prompt },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const rawText = response.output[0]?.content[0]?.text || "{}";
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    parsed = {};
  }

  const breakdown = {};
  let sum = 0;
  TRAIT_KEYS.forEach((key) => {
    const value = clampScore(Number(parsed?.[key] ?? 0));
    breakdown[key] = value;
    sum += value;
  });

  const average =
    breakdown && TRAIT_KEYS.length > 0 ? sum / TRAIT_KEYS.length : 0;
  return { traitScore: average, traitBreakdown: breakdown };
}

// PART 3: Landmark extraction using GPT vision to approximate geometry
async function extractLandmarks(buffer) {
  const prompt = `Identify normalized facial landmark coordinates (0-1) for these points: eyeLeftOuter [x,y], eyeRightOuter [x,y], noseTip [x,y], mouthLeft [x,y], mouthRight [x,y], jawLeft [x,y], jawRight [x,y]. Return JSON: {"eyeLeft":[x,y],"eyeRight":[x,y],"noseTip":[x,y],"mouthLeft":[x,y],"mouthRight":[x,y],"jawLeft":[x,y],"jawRight":[x,y]}. Use best estimates if unclear.`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          { type: "input_image", image: { data: buffer } },
          { type: "text", text: prompt },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const rawText = response.output[0]?.content[0]?.text || "{}";
  try {
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (err) {
    return null;
  }
}

function distance(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return null;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return null;
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

function metricScore(base, target) {
  if (base === null || target === null) return 0;
  const diff = Math.abs(base - target);
  const denom = Math.max(base, target, 1e-6);
  const normalized = Math.min(1, diff / denom);
  return clampScore((1 - normalized) * 100);
}

async function getLandmarkScore(originalBuffer, drawingBuffer) {
  const [origLandmarks, drawLandmarks] = await Promise.all([
    extractLandmarks(originalBuffer),
    extractLandmarks(drawingBuffer),
  ]);

  if (!origLandmarks || !drawLandmarks) return 0;

  const eyeSpacingOrig = distance(
    origLandmarks.eyeLeft,
    origLandmarks.eyeRight
  );
  const eyeSpacingDraw = distance(
    drawLandmarks.eyeLeft,
    drawLandmarks.eyeRight
  );

  const mouthWidthOrig = distance(
    origLandmarks.mouthLeft,
    origLandmarks.mouthRight
  );
  const mouthWidthDraw = distance(
    drawLandmarks.mouthLeft,
    drawLandmarks.mouthRight
  );

  const jawWidthOrig = distance(origLandmarks.jawLeft, origLandmarks.jawRight);
  const jawWidthDraw = distance(drawLandmarks.jawLeft, drawLandmarks.jawRight);

  const angleOrig = angle(origLandmarks.eyeLeft, origLandmarks.eyeRight);
  const angleDraw = angle(drawLandmarks.eyeLeft, drawLandmarks.eyeRight);

  const noseOffsetOrig = distance(origLandmarks.noseTip, [0.5, 0.5]);
  const noseOffsetDraw = distance(drawLandmarks.noseTip, [0.5, 0.5]);

  const scores = [
    metricScore(eyeSpacingOrig, eyeSpacingDraw),
    metricScore(mouthWidthOrig, mouthWidthDraw),
    metricScore(jawWidthOrig, jawWidthDraw),
    metricScore(Math.abs(angleOrig ?? 0), Math.abs(angleDraw ?? 0)),
    metricScore(noseOffsetOrig, noseOffsetDraw),
  ];

  const validScores = scores.filter((s) => Number.isFinite(s));
  if (!validScores.length) return 0;
  return validScores.reduce((sum, val) => sum + val, 0) / validScores.length;
}

// Composite score calculation
function computeFinalScore(embeddingScore, traitScore, landmarkScore) {
  const composite =
    embeddingScore * 0.4 + traitScore * 0.4 + landmarkScore * 0.2;
  return Number(composite.toFixed(1));
}

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

    return NextResponse.json({
      finalScore,
      embeddingScore,
      traitScore: traitData.traitScore,
      landmarkScore,
      traitBreakdown: traitData.traitBreakdown,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Scoring error", error);
    return NextResponse.json(
      { error: "Unable to score images", details: error?.message },
      { status: 500 }
    );
  }
}
