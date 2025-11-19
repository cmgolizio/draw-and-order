import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// const TEXT_TO_IMAGE_MODEL = "SG161222/Realistic_Vision_V6.0_B1_noVAE";
const TEXT_TO_IMAGE_MODEL = "black-forest-labs/FLUX.1-dev";
// const TEXT_TO_IMAGE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
// const STATIC_PROMPT =
//   "hyper realistic, front facing police sketch of an adult human face, upper shoulders, neutral lighting, photography";
const STATIC_PROMPT = process.env.SUSPECT_PROMPT;
const BUCKET = process.env.SUSPECT_BUCKET;
const PAIRS_FOLDER = "pairs";
const OPENAI_MODEL = process.env.SUSPECT_CAPTION_MODEL || "gpt-4o-mini";
const OPENAI_SYSTEM_PROMPT =
  process.env.SUSPECT_CAPTION_PROMPT ||
  "You are a police report assistant. Describe suspects succinctly with vivid, factual language focusing on physical characteristics only.";
const OPENAI_ENDPOINT =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

const hfHeaders = () => {
  const accessToken = process.env.HUGGINGFACE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing HUGGINGFACE_ACCESS_TOKEN environment variable");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient(url, serviceKey);
};

async function generateFaceImage() {
  const response = await fetch(
    `${process.env.HUGGINGFACE_URL}${TEXT_TO_IMAGE_MODEL}`,
    {
      method: "POST",
      headers: {
        ...hfHeaders(),
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({ inputs: STATIC_PROMPT }),
    }
  );

  if (!response.ok) {
    let message = `Image generation failed with status ${response.status}`;
    try {
      const details = await response.json();
      if (details?.error) {
        message += `: ${details.error}`;
      }
    } catch (err) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function describeFace(imageBuffer) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const base64Image = imageBuffer.toString("base64");
  const body = {
    model: OPENAI_MODEL,
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: OPENAI_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Study this police sketch and describe the suspect's visible physical characteristics in 1-2 short sentences.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Description generation failed with status ${response.status}`;
    try {
      const details = await response.json();
      if (details?.error?.message) {
        message += `: ${details.error.message}`;
      }
    } catch (err) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const messageContent = payload?.choices?.[0]?.message?.content;
  let text = "";
  if (typeof messageContent === "string") {
    text = messageContent;
  } else if (Array.isArray(messageContent)) {
    text = messageContent
      .map((part) => part?.text || part?.content || "")
      .join(" ");
  } else if (messageContent?.text) {
    text = messageContent.text;
  }

  text = text?.trim();

  if (!text) {
    throw new Error("OpenAI response did not include a description");
  }

  return text;
}

async function savePairToStorage(supabase, imageBuffer, description) {
  const id = randomUUID();
  const imagePath = `${PAIRS_FOLDER}/${id}.png`;
  const metadataPath = `${PAIRS_FOLDER}/${id}.json`;

  const metadata = {
    id,
    description,
    imagePath,
    createdAt: new Date().toISOString(),
  };

  const { error: imageError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, imageBuffer, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: false,
    });

  if (imageError) {
    throw imageError;
  }

  const { error: metadataError } = await supabase.storage
    .from(BUCKET)
    .upload(metadataPath, JSON.stringify(metadata, null, 2), {
      cacheControl: "3600",
      contentType: "application/json",
      upsert: false,
    });

  if (metadataError) {
    throw metadataError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);

  return {
    ...metadata,
    imageUrl: publicUrl,
    fromArchive: false,
  };
}

async function downloadPairFromFile(supabase, metadataFile) {
  const path = `${PAIRS_FOLDER}/${metadataFile}`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    throw error;
  }

  const text = await data.text();
  const metadata = JSON.parse(text);
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(metadata.imagePath);

  return {
    ...metadata,
    imageUrl: publicUrl,
    fromArchive: true,
  };
}

async function getRandomStoredPair(supabase) {
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(PAIRS_FOLDER, {
      limit: 1000,
    });

  if (error) {
    throw error;
  }

  const metadataFiles =
    files?.filter((file) => file.name.endsWith(".json")) ?? [];
  if (!metadataFiles.length) {
    return null;
  }

  const randomFile =
    metadataFiles[Math.floor(Math.random() * metadataFiles.length)];
  return downloadPairFromFile(supabase, randomFile.name);
}

async function listStoredPairs(supabase, limit) {
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(PAIRS_FOLDER, {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw error;
  }

  const metadataFiles = (files ?? []).filter((file) =>
    file.name.endsWith(".json")
  );
  const selected = metadataFiles.slice(0, limit);

  const pairs = await Promise.all(
    selected.map((file) => downloadPairFromFile(supabase, file.name))
  );
  return pairs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function POST() {
  const supabase = getSupabase();
  try {
    const imageBuffer = await generateFaceImage();
    const description = await describeFace(imageBuffer);
    const pair = await savePairToStorage(supabase, imageBuffer, description);

    return Response.json({ success: true, data: pair });
  } catch (error) {
    console.error("Suspect generation failed", error);
    try {
      const fallback = await getRandomStoredPair(supabase);
      if (fallback) {
        return Response.json({
          success: true,
          data: fallback,
          error: error.message,
        });
      }
    } catch (fallbackError) {
      console.error("Fallback suspect lookup failed", fallbackError);
    }

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 12;

  try {
    const pairs = await listStoredPairs(supabase, limit);
    return Response.json({ success: true, data: pairs });
  } catch (error) {
    console.error("Failed to fetch stored suspects", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
