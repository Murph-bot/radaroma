# Radaroma — Working Agreement

Curated café comparison app for Athens. Build brief: `radaroma-spec.md`.
Megaplan (phase order + verification gates): `docs/megaplan.md`.
Deploy guide (secrets, Access, domain): `docs/deploy.md`.
Production: https://radaroma.sotirios-k-goulas.workers.dev (live since 2026-09-12).

## Local D1 gotcha

If the local DB ever shows stale/empty data after changing `database_id` in
wrangler.jsonc: delete `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`
(regenerable local state), then `npm run db:migrate:local` + `npm run seed`.

## Known state

- LLM live E2E not yet run: user adds the OpenRouter key to `.env.local` + `.dev.vars`
  (local) and `wrangler secret put LLM_API_KEY` (prod); then run the live concierge +
  verify tests. Everything else is mock-tested (FakeLlm).
- Admin on prod needs Cloudflare Access setup (docs/deploy.md) + an `invited_emails` row.
- Seed scores in `data/seed/cafes.athens.json` are drafts awaiting user review.

## Commands

- Dev server: `npm run dev` (Next 16, Turbopack; D1 binding via OpenNext dev injection)
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Tests: `npm test` (Vitest; repository tests run real SQLite via better-sqlite3)
- Build: `npm run build`
- Local Worker preview: `npm run preview` (opennextjs-cloudflare preview)
- Deploy: `npm run deploy` (wrangler deploy)
- DB migrations: `npm run db:migrate:local` / `npm run db:migrate:remote`
- DB smoke test (local D1): `npm run smoke:db`
- Seed DB: `npm run seed` (idempotent upsert of `data/seed/`)

## Verification gate (required after every task/phase)

1. `npm run lint` + `npx tsc --noEmit` + `npm test` green
2. Runtime proof on the real surface (dev server, wrangler preview, or prod URL)
3. Conventional commit (`feat:` / `fix:` / `chore:`), no attribution trailer
4. Report to user: what changed, evidence, next steps, blocking inputs

## Environment (`.env.local`; prod via `wrangler secret put`)

- `LLM_API_KEY` (OpenRouter), `LLM_MODEL` (default `openai/gpt-4o`), `LLM_BASE_URL` (default OpenRouter)
- `APP_URL` — canonical site URL
- The database is Cloudflare D1 — no env vars, arrives as the `DB` binding (wrangler.jsonc)

## Stack & decisions (see docs/megaplan.md for rationale)

- Next.js 16 App Router at root `app/`, Tailwind, TypeScript
- Cloudflare D1 (SQLite) via the `SqlDb` interface in `lib/db/sql.ts`: D1 adapter for prod, better-sqlite3 for tests/scripts. Repositories in `lib/db/repositories/` are the ONLY database access path (no RLS in D1 — visibility is enforced in code: public reads filter `status='verified'`, submissions always insert as `'new'`)
- LLM: `openai` SDK pointed at OpenRouter; hand-rolled tool loop in `lib/agent/`
- Deploy: Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext); `@opennextjs/cloudflare` and `wrangler` are pinned exact — check peer deps before upgrading Next
- Admin auth (Phase 7): Cloudflare Access (email OTP) on `/admin` + `invited_emails` allowlist checked in app code
- Radar chart: custom SVG component, no chart library
- Ranking: one pure function `lib/ranking.ts` shared by UI sliders and agent tool
