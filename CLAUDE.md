# CLAUDE.md — kai-fitness

Personal fitness dashboard for Feng. Tracks workout progression, PRs, and session history imported from Apple Notes.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Storage:** Vercel KV (Upstash Redis)
- **Hosting:** Vercel
- **Auth:** Password cookie (`FITNESS_PASSWORD` env var)

## Key Routes

| Path | Description |
|------|-------------|
| `/dashboard` | Main dashboard — charts, PRs, recent sessions |
| `/sessions` | All sessions browser with search/filter |
| `/exercises/[name]` | Per-exercise progression view |
| `/api/fitness/data` | GET — returns all sessions + exercises from KV |
| `/api/fitness/import` | POST — imports workout sessions into KV |
| `/login`, `/auth`, `/logout` | Password gate |

## Auth

- Middleware (`middleware.ts`) checks `fitness_auth` cookie for page routes
- API routes check `x-fitness-password` header or Bearer token
- Password set via `FITNESS_PASSWORD` env var

## Data Flow

1. `scripts/fitness-import.js` reads Apple Notes "Workout" folder via osascript
2. Parses notes in "Workout B42, 02/24" title format
3. POSTs to `/api/fitness/import`
4. KV stores `fitness:sessions`, `fitness:exercises`, `fitness:meta`
5. Dashboard reads from `/api/fitness/data`

## Env Vars

```
FITNESS_PASSWORD=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Set locally in `.env.local`. Production vars managed in Vercel dashboard.

## Dev Commands

```bash
npm run dev     # local dev server
npm run build   # production build
npm run lint    # eslint
```

## Deployment

Deployed to Vercel. Push to `main` triggers auto-deploy via GitHub integration.
Manual deploy: `vercel deploy --prod`

## Conventions

- Components in `src/components/`
- API routes in `src/app/api/`
- Shared lib (KV helpers, parsers) in `src/lib/`
- Keep pages client-rendered where charts are involved
- No social features, no cardio/nutrition — sole user is Feng

## Notes

- Parser is strict — only handles "Workout X##, MM/DD" title format in Apple Notes
- No edit/delete UI — all data managed via import script
- Charts can be slow with many sessions (known, acceptable for now)
