import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const TEXT_TO_IMAGE_MODEL = "SG161222/Realistic_Vision_V6.0_B1_noVAE";
const IMAGE_CAPTION_MODEL = "Salesforce/blip-image-captioning-large";
const STATIC_PROMPT =
  "hyper realistic, front facing police sketch of an adult human face, upper shoulders, neutral lighting, photography";
const BUCKET = "suspects";
const PAIRS_FOLDER = "pairs";

const hfHeaders = () => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY environment variable");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
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
    `https://api-inference.huggingface.co/models/${TEXT_TO_IMAGE_MODEL}`,
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
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${IMAGE_CAPTION_MODEL}`,
    {
      method: "POST",
      headers: {
        ...hfHeaders(),
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    }
  );

  if (!response.ok) {
    let message = `Description generation failed with status ${response.status}`;
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

  const result = await response.json();
  const text =
    result?.[0]?.generated_text ||
    result?.[0]?.caption ||
    "A neutral-looking person";
  return text.trim();
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

  const { error: imageError } = await supabase.storage.from(BUCKET).upload(imagePath, imageBuffer, {
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
  const { data: files, error } = await supabase.storage.from(BUCKET).list(PAIRS_FOLDER, {
    limit: 1000,
  });

  if (error) {
    throw error;
  }

  const metadataFiles = files?.filter((file) => file.name.endsWith(".json")) ?? [];
  if (!metadataFiles.length) {
    return null;
  }

  const randomFile = metadataFiles[Math.floor(Math.random() * metadataFiles.length)];
  return downloadPairFromFile(supabase, randomFile.name);
}

async function listStoredPairs(supabase, limit) {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(PAIRS_FOLDER, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw error;
  }

  const metadataFiles = (files ?? []).filter((file) => file.name.endsWith(".json"));
  const selected = metadataFiles.slice(0, limit);

  const pairs = await Promise.all(selected.map((file) => downloadPairFromFile(supabase, file.name)));
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

    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;

  try {
    const pairs = await listStoredPairs(supabase, limit);
    return Response.json({ success: true, data: pairs });
  } catch (error) {
    console.error("Failed to fetch stored suspects", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
