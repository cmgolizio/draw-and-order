# Draw & Order

Think you have what it takes to be a police sketch artist? Each round, an AI
generates a fictional suspect portrait and a witness-style description of it.
You read the description, sketch the suspect on the canvas (the portrait stays
hidden, though you can reveal it or use a silhouette guide), then submit your
drawing to get an AI-powered similarity score.

Planned: per-user score history, a community gallery, and a competitive
leaderboard (the landing page previews these).

## Tech Stack

- Next.js App Router
- React + Konva drawing surface
- Supabase Auth + Storage
- OpenAI: image generation (text-to-image), vision captioning (image-to-text),
  and embeddings for similarity scoring

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other scripts:

- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run score -- <original.png> <drawing.png>` — exercise the scoring API

## Environment Variables

Create a `.env.local` with at least the following:

```bash
# OpenAI — used for suspect generation and scoring.
# If unset, /api/score falls back to a deterministic mock score.
OPENAI_API_KEY=

# Supabase — required for auth, storage, and the suspect archive.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage bucket that holds generated suspect image/description pairs.
SUSPECT_BUCKET=
```

Optional suspect-generation tuning vars are read in
`src/app/api/suspects/route.js` (e.g. `SUSPECT_IMAGE_MODEL`,
`SUSPECT_IMAGE_SIZE`, `SUSPECT_ARCHIVE_FIRST`, `AUTO_REVERT_TO_DB`).
