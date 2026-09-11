# Pour Compass — Working Agreement

Curated café comparison app for Athens. Build brief: `pour-compass-spec.md`.
Megaplan (phase order + verification gates): `docs/megaplan.md`.

## Commands

- Dev server: `npm run dev` (Next 16, Turbopack)
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Tests: `npm test` (Vitest)
- Build: `npm run build`
- Local Worker preview: `npm run preview` (opennextjs-cloudflare preview)
- Deploy: `npm run deploy` (wrangler deploy)
- Seed DB: `npm run seed` (idempotent upsert of `data/seed/`)

## Verification gate (required after every task/phase)

1. `npm run lint` + `npx tsc --noEmit` + `npm test` green
2. Runtime proof on the real surface (dev server, wrangler preview, or prod URL)
3. Conventional commit (`feat:` / `fix:` / `chore:`), no attribution trailer
4. Report to user: what changed, evidence, next steps, blocking inputs

## Environment (`.env.local`; prod via `wrangler secret put`)

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, inlined at build
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (admin paths)
- `LLM_API_KEY` (OpenRouter), `LLM_MODEL` (default `openai/gpt-4o`), `LLM_BASE_URL` (default OpenRouter)
- `APP_URL` — canonical site URL

## Stack & decisions (see docs/megaplan.md for rationale)

- Next.js 16 App Router at root `app/`, Tailwind, TypeScript
- Supabase (Postgres + Auth email OTP) via supabase-js, thin repositories in `lib/db/repositories/`, Zod at every boundary
- LLM: `openai` SDK pointed at OpenRouter; hand-rolled tool loop in `lib/agent/`
- Deploy: Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext); `@opennextjs/cloudflare` and `wrangler` are pinned exact — check peer deps before upgrading Next
- Radar chart: custom SVG component, no chart library
- Ranking: one pure function `lib/ranking.ts` shared by UI sliders and agent tool
