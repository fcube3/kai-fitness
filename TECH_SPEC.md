# Tech Spec — Kai Fitness

## Architecture

```
┌───────────────────────────────────────┐
│  Next.js App (Vercel)                 │
│                                       │
│  / → redirect to /dashboard           │
│  /dashboard ── client-side charts     │
│  /sessions ── all sessions browser    │
│  /exercises/[name] ── per-exercise    │
│                                       │
│  /api/fitness/data (GET) ── read KV   │
│  /api/fitness/import (POST) ── write  │
│                                       │
│  /login, /auth, /logout ── cookie     │
│  middleware.ts ── password gate       │
└───────────────────────────────────────┘
         │
         ▼
┌──────────────┐        ┌──────────────┐
│  Vercel KV   │        │ Apple Notes  │
│  (Upstash)   │◄───────│ (via script) │
└──────────────┘        └──────────────┘
```

## Data Flow

1. `scripts/fitness-import.js` reads Apple Notes "Workout" folder via osascript
2. Parses notes using workout format (e.g., "Workout B42, 02/24")
3. POSTs parsed sessions to `/api/fitness/import`
4. API merges with existing KV data, derives exercise library
5. Dashboard fetches from `/api/fitness/data`

## KV Schema

| Key | Type | Description |
|-----|------|-------------|
| `fitness:sessions` | JSON array | All workout sessions |
| `fitness:exercises` | JSON array | Exercise name library |
| `fitness:meta` | JSON | Last import timestamp, counts |

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/fitness/data` | Cookie/Header | Fetch all sessions + exercises |
| POST | `/api/fitness/import` | Header (`x-fitness-password` or Bearer) | Import workout sessions |
| POST | `/auth` | None | Form login |
| POST/GET | `/logout` | None | Clear cookie |

## Auth Model

Password-based. Middleware checks `fitness_auth` cookie. API routes check header auth independently.

## Env Vars

| Variable | Required | Default |
|----------|----------|---------|
| `FITNESS_PASSWORD` | Yes | — |
| `KV_REST_API_URL` | Yes | — |
| `KV_REST_API_TOKEN` | Yes | — |

## Known Limitations

- Parser is format-specific — only handles "Workout X##, MM/DD" title format
- No edit/delete UI — data managed via import script
- Charts are client-rendered (can be slow with many sessions)
