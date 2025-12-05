import { createHash } from "node:crypto";

export function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}

export function clampScore(v) {
  return Math.max(0, Math.min(100, v));
}

export async function fileToBuffer(file) {
  const arr = await file.arrayBuffer();
  return Buffer.from(arr);
}

export const bufferToBase64 = (buf) => buf.toString("base64");

const computeFinalScore = (emb, trait, lm) =>
  Number((emb * 0.4 + trait * 0.4 + lm * 0.2).toFixed(1));

export function deterministicScore(originalBuffer, drawingBuffer) {
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
