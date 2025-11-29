#!/usr/bin/env node
/*
 * Helper script to exercise the composite scoring API.
 *
 * Usage:
 *   npm run score -- <path-to-original> <path-to-drawing> [endpoint]
 *
 * Endpoint defaults to http://localhost:3000/api/score and can also be
 * overridden via SCORE_ENDPOINT env var.
 */

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { Blob } = require("node:buffer");

async function main() {
  const [, , originalPath, drawingPath, cliEndpoint] = process.argv;

  if (!originalPath || !drawingPath) {
    console.error(
      "Usage: npm run score -- <path-to-original> <path-to-drawing> [endpoint]"
    );
    process.exit(1);
  }

  const endpoint =
    cliEndpoint ||
    process.env.SCORE_ENDPOINT ||
    "http://localhost:3000/api/score";

  const readImage = (filePath) => {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${resolved}`);
    }
    return {
      buffer: fs.readFileSync(resolved),
      name: path.basename(resolved),
    };
  };

  const original = readImage(originalPath);
  const drawing = readImage(drawingPath);

  const formData = new FormData();
  formData.append("originalImage", new Blob([original.buffer]), original.name);
  formData.append("userDrawing", new Blob([drawing.buffer]), drawing.name);

  console.log(`Sending request to ${endpoint}...`);
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request failed (${response.status}): ${errorText || "Unknown error"}`
    );
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.log(text);
    return;
  }

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
