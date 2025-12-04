// import { randomUUID } from "crypto";
// import axios from "axios";

// import { buildImagePrompt, getOpenAIClient, getSupabase } from "./utils";

// const AUTO_REVERT_TO_DB = process.env.AUTO_REVERT_TO_DB;

// const PREFER_ARCHIVE_FIRST = process.env.SUSPECT_ARCHIVE_FIRST !== "false";
// const REFRESH_ARCHIVE_IN_BACKGROUND =
//   process.env.SUSPECT_ARCHIVE_REFRESH !== "false";

// const GENERATE_IMAGE_PROMPT = process.env.SUSPECT_PROMPT;
// const DESCRIBE_IMAGE_PROMPT = process.env.SUSPECT_PROMPT;
// const BUCKET = process.env.SUSPECT_BUCKET;
// const PAIRS_FOLDER = "pairs";
// const OPENAI_MODEL = process.env.SUSPECT_CAPTION_MODEL || "gpt-4o-mini";
// const OPENAI_SYSTEM_PROMPT =
//   "You are participating in a fictional, imaginative world-building game. You will receive an image of a fictional character. Your task is to creatively describe this character's facial features in rich, artistic detail. Focus on visual traits only: facial structure, eyes, nose, mouth, skin tone, hair style and color, notable marks, textures, or other distinctive details. Write the description as detailed bullet points, at least 6 to 8 sentences total.  Do not categorize the bullet points with the facial feature that it describes, nor with any other form of categorization. Your description will be used by artists to visualize and illustrate the character, so ensure it is vivid and evocative.";

// const FLUX_TEXT_TO_IMAGE_URL =
//   process.env.FLUX_IMAGE_API_URL ||
//   "https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/text2image";
// const FLUX_TEXT_TO_IMAGE_HOST =
//   process.env.FLUX_IMAGE_API_HOST ||
//   "ai-text-to-image-generator-flux-free-api.p.rapidapi.com";
// const FLUX_TEXT_TO_IMAGE_STYLE_ID = process.env.FLUX_IMAGE_STYLE_ID || "10";
// const FLUX_TEXT_TO_IMAGE_SIZE = process.env.FLUX_IMAGE_SIZE || "2-3";

// // async function requestFluxImage(apiKey, url) {
// //   const response = await fetch(url, {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       "X-RapidAPI-Key": apiKey,
// //       "X-RapidAPI-Host": FLUX_TEXT_TO_IMAGE_HOST,
// //     },
// //     body: JSON.stringify({
// //       prompt: buildImagePrompt(GENERATE_IMAGE_PROMPT),
// //       style_id: FLUX_TEXT_TO_IMAGE_STYLE_ID,
// //       size: FLUX_TEXT_TO_IMAGE_SIZE,
// //     }),
// //   });

// //   if (!response.ok) {
// //     let message = `Image generation failed with status ${response.status}`;
// //     try {
// //       const details = await response.json();
// //       const detailMessage =
// //         details?.error?.message ||
// //         details?.message ||
// //         details?.error ||
// //         details?.status;
// //       if (detailMessage) {
// //         message += `: ${detailMessage}`;
// //       }
// //     } catch (err) {
// //       try {
// //         const text = await response.text();
// //         if (text) {
// //           message += `: ${text}`;
// //         }
// //       } catch (_) {
// //         // ignore text parse errors
// //       }
// //     }

// export async function requestFluxImage() {
//   const prompt = buildImagePrompt(GENERATE_IMAGE_PROMPT);

//   const url =
//     "https://ai-text-to-image-generator-flux-free.p.rapidapi.com/prompt";
//   // const url =
//   //   "https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaaaaaaaaaaiimagegenerator/quick.php";

//   const payload = {
//     prompt: buildImagePrompt(GENERATE_IMAGE_PROMPT),
//     style_id: FLUX_TEXT_TO_IMAGE_STYLE_ID,
//     size: FLUX_TEXT_TO_IMAGE_SIZE,
//   };

//   try {
//     const res = await axios.post(url, payload, {
//       headers: {
//         "x-rapidapi-key": process.env.RAPIDAPI_KEY,
//         "x-rapidapi-host":
//           "ai-text-to-image-generator-flux-free.p.rapidapi.com",
//         "Content-Type": "application/json",
//       },
//       responseType: "arraybuffer", // API returns binary image
//     });

//     return {
//       ok: true,
//       prompt,
//       imageBuffer: Buffer.from(res.data),
//     };
//   } catch (err) {
//     console.error("Flux API Error:", err?.response?.data || err);
//     return {
//       ok: false,
//       error: err.message,
//       details: err?.response?.data,
//     };
//   }
// }

// // const error = new Error(message);
// // error.status = response.status;
// // throw error;

// //   return response.json();
// // }

// async function generateFaceImage() {
//   const apiKey = process.env.RAPIDAPI_KEY;
//   if (!apiKey) {
//     throw new Error("Missing RAPIDAPI_KEY environment variable");
//   }

//   // const normalizedDefault = FLUX_TEXT_TO_IMAGE_URL.replace(/\/$/, "");
//   // const candidateUrls = [
//   //   normalizedDefault,
//   //   `${normalizedDefault}/text2image`,
//   //   normalizedDefault.replace(/\/text2image$/, ""),
//   //   normalizedDefault.replace(/\/text2image$/, "/text-to-image"),
//   // ].filter((value, index, self) => value && self.indexOf(value) === index);

//   // let payload;
//   // let lastError;

//   // for (const url of candidateUrls) {
//   //   try {
//   //     payload = await requestFluxImage(apiKey, url);
//   //     break;
//   //   } catch (err) {
//   //     lastError = err;
//   //     if (err?.status !== 404) {
//   //       break;
//   //     }
//   //   }
//   // }

//   // if (!payload && lastError) {
//   //   throw lastError;
//   // }

//   // const imageCandidate = [
//   //   payload?.image,
//   //   payload?.image_base64,
//   //   payload?.imageUrl,
//   //   payload?.image_url,
//   //   payload?.url,
//   //   payload?.result,
//   //   payload?.data?.image,
//   //   payload?.data?.image_base64,
//   //   payload?.data?.imageUrl,
//   //   payload?.data?.image_url,
//   //   payload?.data?.[0]?.image,
//   //   payload?.data?.[0]?.image_base64,
//   //   payload?.data?.[0]?.url,
//   //   payload?.output?.[0],
//   // ].find((candidate) => typeof candidate === "string" && candidate.trim());

//   // if (!imageCandidate) {
//   //   throw new Error("Text-to-image response did not include image data");
//   // }

//   // if (imageCandidate.startsWith("http")) {
//   //   const imageResponse = await fetch(imageCandidate);
//   //   if (!imageResponse.ok) {
//   //     throw new Error(
//   //       `Failed to download generated image: ${imageResponse.status}`
//   //     );
//   //   }
//   //   return Buffer.from(await imageResponse.arrayBuffer());
//   // }

//   // const base64String = imageCandidate.includes("base64,")
//   //   ? imageCandidate.split("base64,").pop()
//   //   : imageCandidate;

//   // return Buffer.from(base64String, "base64");

//   const { ok, imageBuffer, error, details } = await requestFluxImage();
//   if (!ok) {
//     let message = "Image generation failed";
//     if (error) {
//       message += `: ${error}`;
//     }
//     if (details) {
//       message += ` - ${JSON.stringify(details)}`;
//     }
//     throw new Error(message);
//   }

//   return imageBuffer;
// }

// async function describeFace(imageBuffer) {
//   // const apiKey = process.env.OPENAI_API_KEY;
//   // if (!apiKey) {
//   //   throw new Error("Missing OPENAI_API_KEY environment variable");
//   // }
//   // const base64Image = imageBuffer.toString("base64");
//   const openai = getOpenAIClient();
//   const base64Image = imageBuffer.toString("base64");
//   const completion = await openai.chat.completions.create({
//     // const body = {
//     model: OPENAI_MODEL,
//     temperature: 0.4,
//     max_tokens: 200,
//     messages: [
//       {
//         role: "system",
//         content: OPENAI_SYSTEM_PROMPT,
//       },
//       {
//         role: "user",
//         content: [
//           {
//             type: "text",

//             // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //

//             text: DESCRIBE_IMAGE_PROMPT,
//           },
//           {
//             type: "image_url",
//             image_url: {
//               url: `data:image/png;base64,${base64Image}`,
//               detail: "high",
//             },
//           },
//         ],
//       },
//     ],
//   });

//   const messageContent = completion?.choices?.[0]?.message?.content;
//   let text = "";
//   if (typeof messageContent === "string") {
//     text = messageContent;
//   } else if (Array.isArray(messageContent)) {
//     text = messageContent
//       .map((part) => part?.text || part?.content || "")
//       .join(" ");
//   } else if (messageContent?.text) {
//     text = messageContent.text;
//   }

//   text = text?.trim();

//   if (!text) {
//     throw new Error("OpenAI response did not include a description");
//   }

//   return text;
// }

// async function generateAndStorePair(supabase) {
//   const imageBuffer = await generateFaceImage();
//   const description = await describeFace(imageBuffer);
//   return savePairToStorage(supabase, imageBuffer, description);
// }

// async function savePairToStorage(supabase, imageBuffer, description) {
//   const id = randomUUID();
//   const imagePath = `${PAIRS_FOLDER}/${id}.png`;
//   const metadataPath = `${PAIRS_FOLDER}/${id}.json`;

//   const metadata = {
//     id,
//     description,
//     imagePath,
//     createdAt: new Date().toISOString(),
//   };

//   const { error: imageError } = await supabase.storage
//     .from(BUCKET)
//     .upload(imagePath, imageBuffer, {
//       cacheControl: "3600",
//       contentType: "image/png",
//       upsert: false,
//     });

//   if (imageError) {
//     throw imageError;
//   }

//   const { error: metadataError } = await supabase.storage
//     .from(BUCKET)
//     .upload(metadataPath, JSON.stringify(metadata, null, 2), {
//       cacheControl: "3600",
//       contentType: "application/json",
//       upsert: false,
//     });

//   if (metadataError) {
//     throw metadataError;
//   }

//   const {
//     data: { publicUrl },
//   } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);

//   return {
//     ...metadata,
//     imageUrl: publicUrl,
//     fromArchive: false,
//   };
// }

// async function downloadPairFromFile(supabase, metadataFile) {
//   const path = `${PAIRS_FOLDER}/${metadataFile}`;
//   const { data, error } = await supabase.storage.from(BUCKET).download(path);
//   if (error) {
//     throw error;
//   }

//   const text = await data.text();
//   const metadata = JSON.parse(text);
//   const {
//     data: { publicUrl },
//   } = supabase.storage.from(BUCKET).getPublicUrl(metadata.imagePath);

//   return {
//     ...metadata,
//     imageUrl: publicUrl,
//     fromArchive: true,
//   };
// }

// async function getRandomStoredPair(supabase) {
//   const { data: files, error } = await supabase.storage
//     .from(BUCKET)
//     .list(PAIRS_FOLDER, {
//       limit: 1000,
//     });

//   if (error) {
//     throw error;
//   }

//   const metadataFiles =
//     files?.filter((file) => file.name.endsWith(".json")) ?? [];
//   if (!metadataFiles.length) {
//     return null;
//   }

//   const randomFile =
//     metadataFiles[Math.floor(Math.random() * metadataFiles.length)];
//   return downloadPairFromFile(supabase, randomFile.name);
// }

// async function listStoredPairs(supabase, limit) {
//   const { data: files, error } = await supabase.storage
//     .from(BUCKET)
//     .list(PAIRS_FOLDER, {
//       limit: 1000,
//       sortBy: { column: "created_at", order: "desc" },
//     });

//   if (error) {
//     throw error;
//   }

//   const metadataFiles = (files ?? []).filter((file) =>
//     file.name.endsWith(".json")
//   );
//   const selected = metadataFiles.slice(0, limit);

//   const pairs = await Promise.all(
//     selected.map((file) => downloadPairFromFile(supabase, file.name))
//   );
//   return pairs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// }

// export async function POST() {
//   const supabase = getSupabase();

//   if (PREFER_ARCHIVE_FIRST) {
//     try {
//       const cachedPair = await getRandomStoredPair(supabase);
//       if (cachedPair) {
//         if (REFRESH_ARCHIVE_IN_BACKGROUND) {
//           generateAndStorePair(supabase).catch((refreshError) =>
//             console.error("Background suspect refresh failed", refreshError)
//           );
//         }

//         return Response.json({
//           success: true,
//           data: cachedPair,
//         });
//       }
//     } catch (fallbackError) {
//       console.error("Archive-first suspect lookup failed", fallbackError);
//     }
//   }

//   // Skip the AI calls and automatically pull a suspect from the DB
//   if (AUTO_REVERT_TO_DB === "true") {
//     try {
//       const fallback = await getRandomStoredPair(supabase);
//       if (fallback) {
//         console.log("Pulled suspect from DB");
//         return Response.json({
//           success: true,
//           data: fallback,
//         });
//       }
//     } catch (fallbackError) {
//       console.error("Fallback suspect lookup failed", fallbackError);
//     }
//   }

//   try {
//     const pair = await generateAndStorePair(supabase);
//     // const imageBuffer = await generateFaceImage();
//     // const description = await describeFace(imageBuffer);
//     // const pair = await savePairToStorage(supabase, imageBuffer, description);
//     console.log("Generated new suspect", pair);
//     return Response.json({ success: true, data: pair });
//   } catch (error) {
//     console.error("Suspect generation failed", error);
//     try {
//       const fallback = await getRandomStoredPair(supabase);
//       if (fallback) {
//         return Response.json({
//           success: true,
//           data: fallback,
//           error: error.message,
//         });
//       }
//     } catch (fallbackError) {
//       console.error("Fallback suspect lookup failed", fallbackError);
//     }

//     return Response.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request) {
//   const supabase = getSupabase();
//   const { searchParams } = new URL(request.url);
//   const limitParam = Number(searchParams.get("limit"));
//   const limit =
//     Number.isFinite(limitParam) && limitParam > 0
//       ? Math.min(limitParam, 50)
//       : 12;

//   try {
//     const pairs = await listStoredPairs(supabase, limit);
//     return Response.json({ success: true, data: pairs });
//   } catch (error) {
//     console.error("Failed to fetch stored suspects", error);
//     return Response.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }
import { randomUUID } from "crypto";

import { buildImagePrompt, getOpenAIClient, getSupabase } from "./utils";

const AUTO_REVERT_TO_DB = process.env.AUTO_REVERT_TO_DB;

const OPENAI_IMAGE_SIZE = process.env.SUSPECT_IMAGE_SIZE;
const PREFER_ARCHIVE_FIRST = process.env.SUSPECT_ARCHIVE_FIRST !== "false";
const REFRESH_ARCHIVE_IN_BACKGROUND =
  process.env.SUSPECT_ARCHIVE_REFRESH !== "false";

const GENERATE_IMAGE_PROMPT = process.env.SUSPECT_PROMPT;
const DESCRIBE_IMAGE_PROMPT = process.env.SUSPECT_PROMPT;
const BUCKET = process.env.SUSPECT_BUCKET;
const PAIRS_FOLDER = "pairs";
const OPENAI_MODEL = process.env.SUSPECT_CAPTION_MODEL || "gpt-4o-mini";
const OPENAI_SYSTEM_PROMPT =
  "You are participating in a fictional, imaginative world-building game. You will receive an image of a fictional character. Your task is to creatively describe this character's facial features in rich, artistic detail. Focus on visual traits only: facial structure, eyes, nose, mouth, skin tone, hair style and color, notable marks, textures, or other distinctive details. Write the description as detailed bullet points, at least 6 to 8 sentences total.  Do not categorize the bullet points with the facial feature that it describes, nor with any other form of categorization. Your description will be used by artists to visualize and illustrate the character, so ensure it is vivid and evocative.";

const OPENAI_IMAGE_ENDPOINT =
  process.env.OPENAI_IMAGE_API_URL ||
  "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODEL = process.env.SUSPECT_IMAGE_MODEL || "gpt-image-1";
const OPENAI_IMAGE_RESPONSE_FORMAT = process.env.SUSPECT_IMAGE_RESPONSE_FORMAT;

async function generateFaceImage() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const body = {
    model: OPENAI_IMAGE_MODEL,
    prompt: buildImagePrompt(GENERATE_IMAGE_PROMPT),
    // size: "1024x1024",
    size: OPENAI_IMAGE_SIZE,
  };

  if (OPENAI_IMAGE_RESPONSE_FORMAT) {
    body.response_format = OPENAI_IMAGE_RESPONSE_FORMAT;
  }

  const response = await fetch(OPENAI_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Image generation failed with status ${response.status}`;
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
  const imageResult = payload?.data?.[0];
  const base64Image = imageResult?.b64_json;

  if (base64Image) {
    return Buffer.from(base64Image, "base64");
  }

  if (imageResult?.url) {
    const imageResponse = await fetch(imageResult.url);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download generated image: ${imageResponse.status}`
      );
    }
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error("OpenAI response did not include image data");
}

async function describeFace(imageBuffer) {
  // const apiKey = process.env.OPENAI_API_KEY;
  // if (!apiKey) {
  //   throw new Error("Missing OPENAI_API_KEY environment variable");
  // }
  // const base64Image = imageBuffer.toString("base64");
  const openai = getOpenAIClient();
  const base64Image = imageBuffer.toString("base64");
  const completion = await openai.chat.completions.create({
    // const body = {
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
            text: DESCRIBE_IMAGE_PROMPT,
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
  });

  const messageContent = completion?.choices?.[0]?.message?.content;
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

async function generateAndStorePair(supabase) {
  const imageBuffer = await generateFaceImage();
  const description = await describeFace(imageBuffer);
  return savePairToStorage(supabase, imageBuffer, description);
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

  if (PREFER_ARCHIVE_FIRST) {
    try {
      const cachedPair = await getRandomStoredPair(supabase);
      if (cachedPair) {
        if (REFRESH_ARCHIVE_IN_BACKGROUND) {
          generateAndStorePair(supabase).catch((refreshError) =>
            console.error("Background suspect refresh failed", refreshError)
          );
        }

        return Response.json({
          success: true,
          data: cachedPair,
        });
      }
    } catch (fallbackError) {
      console.error("Archive-first suspect lookup failed", fallbackError);
    }
  }

  // Skip the AI calls and automatically pull a suspect from the DB
  if (AUTO_REVERT_TO_DB === "true") {
    try {
      const fallback = await getRandomStoredPair(supabase);
      if (fallback) {
        console.log("Pulled suspect from DB");
        return Response.json({
          success: true,
          data: fallback,
        });
      }
    } catch (fallbackError) {
      console.error("Fallback suspect lookup failed", fallbackError);
    }
  }

  try {
    const pair = await generateAndStorePair(supabase);
    // const imageBuffer = await generateFaceImage();
    // const description = await describeFace(imageBuffer);
    // const pair = await savePairToStorage(supabase, imageBuffer, description);
    console.log("Generated new suspect", pair);
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
