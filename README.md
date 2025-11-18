# Draw & Order

A Next.js application for sketching suspects and generating AI-powered mugshots with descriptions. It combines a Konva-based drawing canvas, Supabase authentication/storage, and Hugging Face inference APIs.

## Prerequisites

- Node.js 18+
- Supabase project with a storage bucket named `suspects` (public access recommended) and optional `drawings` bucket for manual uploads.
- Hugging Face API key with access to text-to-image and image-captioning models.

## Environment Variables

Create a `.env.local` file with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUGGINGFACE_API_KEY=your_hugging_face_api_key
```

The service role key is only used in Next.js server routes and should never be exposed to the browser.

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the app.

## AI Suspect Workflow

1. On the `/draw` page, click **Draw Suspect**.
2. The app calls `/api/suspects` which:
   - Generates a portrait using Hugging Face Stable Diffusion (static prompt).
   - Captions the face with Salesforce BLIP.
   - Stores the image (`pairs/<id>.png`) and metadata (`pairs/<id>.json`) in the `suspects` bucket.
3. The UI shows the generated image + caption. If inference fails (e.g., no credits), a random stored pair from the bucket is returned instead.
4. Use the **Refresh** button in the Saved suspects panel to fetch the latest pairs (`GET /api/suspects?limit=9`).

## API Routes

- `POST /api/suspects`: Generates and/or fetches a suspect pair. Response shape:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "description": "text",
      "imageUrl": "https://...",
      "fromArchive": false
    }
  }
  ```
  When Hugging Face is unavailable, `fromArchive` will be `true` and `error` will contain the upstream message.
- `GET /api/suspects?limit=9`: Returns the most recent stored pairs pulled from Supabase storage.

## Buckets

Create a Supabase storage bucket called `suspects` with a `pairs/` folder. Give it public read access so the app can display images without signed URLs. The existing drawing upload flow expects another bucket named `drawings`.

## Testing

Run ESLint before committing:

```bash
npm run lint
```

## Tech Stack

- Next.js App Router
- React + Konva drawing surface
- Supabase Auth + Storage
- Hugging Face inference API (text-to-image + BLIP captioning)
