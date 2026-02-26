# Kai Fitness

Personal fitness tracking hub — workout sessions, exercise progression, PR tracking.

## Local Setup

```bash
npm install
npm run dev
# Open http://localhost:3000 (password required)
```

## Env Vars

| Variable | Required | Description |
|----------|----------|-------------|
| `FITNESS_PASSWORD` | Yes | Dashboard access password |
| `KV_REST_API_URL` | Yes | Vercel KV / Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Yes | Vercel KV / Upstash Redis REST token |

## Importing Workouts

From Apple Notes:

```bash
FITNESS_PASSWORD=fitness2026 IMPORT_URL=https://kai-fitness.vercel.app node scripts/fitness-import.js
```

## Deploy

```bash
vercel --prod
```

## Cron

OpenClaw cron runs `scripts/fitness-import.js` to pull workout notes from Apple Notes and POST to `/api/fitness/import`.
