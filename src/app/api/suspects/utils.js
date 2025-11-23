import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const RANDOM_TRAITS = {
  age: [
    "a teenager",
    "a young adult",
    "someone in their 30s",
    "someone in their 40s",
    "someone in their 50s",
    "a senior",
  ],
  build: [
    "slim build",
    "athletic build",
    "average build",
    "stocky build",
    "broad shouldered",
  ],
  hair: [
    "buzz cut",
    "long wavy hair",
    "braided hair",
    "curly hair",
    "short spiky hair",
    "shaved head",
  ],
  facialHair: [
    "clean shaven",
    "stubble beard",
    "full beard",
    "goatee",
    "mustache",
  ],
  accessories: [
    "wearing glasses",
    "wearing a hat",
    "wearing earrings",
    "wearing a scarf",
    "wearing a hood",
  ],
  expression: [
    "neutral expression",
    "serious expression",
    "slight smile",
    "focused gaze",
    "raised eyebrow",
  ],
  setting: [
    "plain background",
    "urban background",
    "dim lighting",
    "bright studio lighting",
    "soft natural lighting",
  ],
};

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  return new OpenAI({ apiKey });
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient(url, serviceKey);
}

function pickRandomTraits() {
  const traits = Object.values(RANDOM_TRAITS)
    .map((options) => options[Math.floor(Math.random() * options.length)])
    .sort(() => Math.random() - 0.5);

  const selectedCount = 3 + Math.floor(Math.random() * 3); // 3-5 traits
  return traits.slice(0, selectedCount);
}

export function buildImagePrompt(basePrompt) {
  const prompt = basePrompt || "Portrait photo of a person";
  const traits = pickRandomTraits();
  return `${prompt}. Include ${traits.join(
    ", "
  )}. Vary appearance noticeably between generations.`;
}
