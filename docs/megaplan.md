---
agent: devin-local
session: bramble-attempt
created: 2026-09-11T22:02:00Z
---
# Radaroma — Megaplan (build from spec v1)

Phased build of Radaroma, an Athens café comparison app with radar charts, weighted re-ranking, and an OpenRouter-powered AI concierge, deployed to Cloudflare Workers via OpenNext, with a verification gate after every phase.

## Context

`radaroma-spec.md` is the build brief. This megaplan executes it end-to-end with three user-directed deltas:

1. **Deploy**: Vercel → **Cloudflare Workers** via `@opennextjs/cloudflare` (OpenNext). The user has their domain in Cloudflare.
2. **LLM provider**: Anthropic default → **OpenRouter** (OpenAI-compatible endpoint). Key is added later; the client stays provider-agnostic.
3. **Seed data**: **Athens** cafés (15–20), drafted by me from web research, scores reviewed by the user.

Everything else follows the spec. The user's explicit workflow requirement: **verify after every task and every phase** — each phase below ends with a verification gate before moving on.

## Deltas from spec (decisions + rationale)

### UPDATE (Phase 1): Supabase → Cloudflare D1 (SQLite)

Per user request ("make it with SQLite to not require a Supabase project"),
the data layer moved from Supabase Postgres to **Cloudflare D1** — the
SQLite database inside the Cloudflare account the user already has. No new
signups; deploys with `wrangler deploy`.

Consequences, decided up front:

1. **No RLS.** D1 has no row-level security. The security boundary moved
   into app code: repositories in `lib/db/repositories/` are the ONLY
   database access path, public queries hard-filter `status='verified'`,
   and submissions are always inserted as `'new'` by the server route.
   Browsers never touch the DB directly. One less exposed surface, but the
   repository layer is now the single enforcement point — keep it that way.
2. **Auth changes.** Supabase magic links are gone. `/admin` is protected by
   **Cloudflare Access** (email OTP, free tier, edge-level) configured once
   in the dashboard, plus the `invited_emails` allowlist checked in app
   code (Access passes the user's email as a header).
3. **Migration dialect.** `migrations/0001_init.sql` is SQLite (TEXT uuids
   generated in app code, ISO-8601 TEXT timestamps, REAL numerics). Applied
   via `wrangler d1 migrations apply --local|--remote`.
4. **Tests got stronger.** Repository tests run real SQLite in-memory
   (better-sqlite3, devDependency) with the same migration SQL as prod.

Local dev: `npm run db:migrate:local` seeds the local D1 state;
`npm run smoke:db` proves the data layer against that real file;
`/api/health/db` proves the Worker → D1 binding chain.



### Deploy: OpenNext on Cloudflare Workers (not Vercel, not Pages, not vinext)
- Cloudflare Pages is legacy for Next.js (Edge runtime only, unsupported features). Rejected.
- **vinext** is Cloudflare's new official default but is young. Rejected for now; re-evaluate as a drop-in at Phase 8.
- **OpenNext** (`@opennextjs/cloudflare`, currently ~1.20.x) is battle-tested since 2024, supports Next.js 16 + Node runtime, ISR/SSG caching, and keeps `next dev` working locally via `initOpenNextCloudflareForDev()`. **Chosen.**
- Pin with `--save-exact` (`@opennextjs/cloudflare` + `wrangler`): OpenNext strictly constrains the Next.js version via peerDependencies.

### Domain attach (user delegated the choice)
Recommendation: **root domain if the user owns a dedicated domain for the product (e.g. pourcompass.com); subdomain if the domain is personal/shared**. This is a one-line config in Phase 8 (`wrangler.jsonc` custom domain). The plan uses a placeholder URL until then; Phase 8 gives exact dashboard steps for both cases.

### LLM client: `openai` SDK pointed at OpenRouter
- OpenRouter exposes `/api/v1/chat/completions` (OpenAI-compatible), supports tool calling and `response_format` (structured output) — both required by the agent.
- `lib/agent/client.ts` wraps `openai` with `baseURL: process.env.LLM_BASE_URL ?? 'https://openrouter.ai/api/v1'`, `apiKey: LLM_API_KEY`, model `LLM_MODEL ?? 'openai/gpt-4o'`. Swapping providers = env vars, one file untouched.
- No agent framework. Hand-rolled tool-calling loop (~60 lines) + tool registry + three prompt files, exactly per spec §4.

### DB access: supabase-js + thin repositories (no ORM)
- Service-role client server-side, anon client browser-side. Prisma rejected (build friction on Workers, spec wants a thin repository layer).
- RLS: public can read `verified` cafés + scores; `submissions` allows INSERT only with `status = 'new'` (CHECK constraint in policy — public cannot forge status); everything else locked; admin operations via service role + `invited_emails` allowlist check.

### Radar chart: custom SVG component (no chart lib)
- The radar chart is the signature UI element. A hand-rolled SVG (pentagon grid + normalized polygon, ~150 lines) gives full design control and avoids a 200KB+ dependency. Recharts rejected: styling fights, overkill for one chart type, compare view needs bespoke overlay anyway.

### Auth: Supabase email OTP (magic link) + `invited_emails` allowlist
- Allowlist check server-side on every admin API call + route guard on `/admin`. Browsing/submitting stays open (spec §6).

### Ranking math: one pure function, two consumers
- `lib/ranking.ts`: `rankCafes(cafes, scores, weights)` = Σ(wᵢ × sᵢ) over the 5 axes, normalized. Used by the UI sliders AND the agent's `queryCafesByWeights` tool. Single source of truth.

### Streaming: deferred
- Concierge v1 is non-streaming with a "thinking" state (friends-and-family launch). Streaming listed as Phase 8 polish. Experience-first applied: polish fewer features well.

## pstack principles applied (name → the choice it drove)

- **sequence-verifiable-units** → the whole plan: every phase ends in a checkable state; no phase starts until the previous gate is green.
- **prove-it-works** → every gate runs the real thing (dev server, real DB roundtrip, real agent call), not just typecheck.
- **foundational-thinking** → schemas/migrations/repositories before any UI; ranking + radar geometry as pure functions before components.
- **model-the-domain** → status enums (cafes, submissions) and agent modes encoded in Zod schemas + shared constants, not scattered string literals; one agent module, three modes via prompt+tool selection.
- **boundary-discipline** → Zod validation at every boundary: public form input, API route input, agent structured output, DB rows → domain types in repositories.
- **type-system-discipline** → snake_case DB rows parsed to camelCase domain types at the repository boundary; illegal states (bad statuses, score > 5) unrepresentable.
- **build-the-lever** → idempotent seed script instead of manual inserts; smoke scripts for DB roundtrips.
- **make-operations-idempotent** → seed upserts by slug; verify pipeline re-runnable; submission status transitions guarded.
- **laziness-protocol / subtract-before-you-add** → no speculative abstractions; admin UI only when Phase 7 needs it; no realtime, no public ratings (spec §9 stays out).
- **experience-first** → custom radar chart, transparent "community-submitted, AI-verified" badge, chat mode structurally incapable of recommending out-of-dataset cafés.
- **never-block-on-the-human** → technical forks decided here; the human is only asked for product data (Athens list/scores, Supabase project creds, OpenRouter key).
- **guard-the-context-window** → during implementation, bulk/repetitive work (seed research, component batches) goes to subagents; summaries stay in the main thread.

## Scope boundaries

**In**: spec §3–§8, with the three deltas above. Testing infra (Vitest unit/integration; Playwright E2E in Phase 8) per pstack TDD for the agent + ranking + repos.

**Out (spec §9)**: public_avg ratings, busyness data, PWA. Also out: streaming chat (deferred), multi-city support, third-party review imports.

**Blocking user inputs** (collected when each phase reaches them): Supabase project URL + keys (Phase 1), Athens café score review (Phase 2), OpenRouter key for live agent tests (Phase 4–6, mock-tested until then).

## Repo layout (final, per spec §7 + additions)

```
/ (repo root, git init'd in Phase 0)
  radaroma-spec.md        # existing spec
  docs/megaplan.md            # this plan, copied in at Phase 0
  AGENTS.md                   # build/test/verify commands for future sessions
  supabase/migrations/0001_init.sql
  data/seed/cafes.athens.json
  scripts/seed-cafes.ts
  app/ (public pages, admin, api per spec)
  lib/db/client.ts, lib/db/repositories/{cafes,scores,submissions,agentRuns}.ts
  lib/schemas/{cafe,score,submission,agentRun}.ts
  lib/agent/{client,tools,run}.ts, lib/agent/prompts/{concierge,verify,curatorAssist}.ts
  lib/ranking.ts
  components/RadarChart.tsx
  wrangler.jsonc, open-next.config.ts
  .env.local.example
```

## Phases

### Phase 0 — Scaffold, git, tooling
- `git init` (repo is not a git repo yet), `.gitignore`, README, `AGENTS.md` (build/test/verify commands), copy this megaplan to `docs/megaplan.md`.
- `create-next-app` (Next 16, TypeScript, Tailwind, App Router at root `app/` to match the spec), then install: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `openai`, `vitest`, and `--save-exact` `@opennextjs/cloudflare` + `wrangler`.
- Wire `wrangler.jsonc`, `open-next.config.ts`, `initOpenNextCloudflareForDev()` in `next.config.ts`. Install supabase CLI (brew) if Docker is available, else migrations go through the dashboard (flag at Phase 1).
- `.env.local.example` documenting every var: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `APP_URL`.
- **Gate**: `npm run build` green; `opennextjs-cloudflare preview` boots the Worker locally and serves the home page (prove-it-works: real artifact); commit.

### Phase 1 — Data layer
- `supabase/migrations/0001_init.sql`: spec §3.1 schema verbatim + indexes (`cafes.status`, `submissions.status`, `cafe_scores.cafe_id`), `updated_at` trigger, RLS policies (public read verified cafés+scores; submissions insert-only with `status='new'` enforced in policy).
- Apply to the remote Supabase project (user creates project + shares URL/keys; if CLI unavailable, apply SQL via dashboard).
- `lib/schemas/`: cafe, score (per spec §3.2), plus submission, agentRun — Zod + inferred types.
- `lib/db/client.ts` (anon browser client + service-role server client) and repositories: cafes, scores, submissions, agentRuns — DB rows parsed through Zod at the boundary.
- Vitest unit tests: schema validation, repository parsing (mocked client), illegal states rejected.
- **Gate**: `npx tsc --noEmit`, `npm test` green; smoke script does a real insert→read→Zod-parse roundtrip against the remote DB; commit.

### Phase 2 — Seed Athens content
- `data/seed/cafes.athens.json`: 15–20 real Athens cafés — name, address, neighborhood, lat/lng (from web research), price tier, curator scores (1–5 on the 5 axes), `source: owner`, `status: verified`, `verification_notes: "curator"`.
- `scripts/seed-cafes.ts`: idempotent upsert by slug (build-the-lever, make-operations-idempotent), ran against remote DB with service role.
- **Gate**: seed run reports rows upserted; homepage-query returns the full sorted list; **user reviews the JSON data file and adjusts scores** (this is their product data); commit.

### Phase 3 — Public browsing UI
- `components/RadarChart.tsx`: custom SVG pentagon grid + normalized polygon + legend; compare mode = 2–3 overlaid polygons. Unit tests for the geometry (normalization, polygon points, axis labels).
- `lib/ranking.ts`: pure weighted-ranking function + tests (weights sum, ties, clamping).
- Home (`/`): hero, top cafés at default weights, slider-teaser, concierge search bar stub.
- `/cafes`: full list, filters (neighborhood, price tier), sort by rank, radar card.
- `/cafes/[slug]`: radar, score breakdown, "ask about this café" mini chat stub.
- `/compare`: pick 2–3, overlaid radar.
- **Gate**: `npm test` green; dev server + browser (gstack/browse) walkthrough with screenshots: list renders real DB data, sliders re-rank, compare overlays correctly; commit.

### Phase 4 — Agent core (TDD)
- `lib/agent/client.ts`: OpenRouter wrapper (chat + tools + response_format), retry/timeout.
- `lib/agent/tools.ts`: registry with the 5 spec tools. `searchWeb`/`fetchPage` implementations: `fetchPage` uses fetch; `searchWeb` uses a search provider only when `SEARCH_API_KEY` is set (Tavily/Exa), else degrades gracefully (submitted URL + nearby-café check still carry verification).
- `lib/agent/run.ts`: mode dispatcher — selects prompt + tool subset per mode, runs the tool loop, Zod-validates structured output, routes by confidence (≥0.75 & no dup → verified; else flagged), writes `agent_runs` rows.
- `lib/agent/prompts/{concierge,verify,curatorAssist}.ts`.
- Vitest with mocked LLM: tool selection per mode, loop termination, structured output validation, confidence routing, audit log rows.
- **Gate**: tests green; if the user has provided the OpenRouter key, one live `verify_submission` smoke test; commit.

### Phase 5 — Concierge chat
- `app/api/agent/concierge/route.ts`: POST { messages, weights? } → Zod-validated → run concierge mode (tools: `queryCafesByWeights` only, no web) → reply. Non-streaming v1.
- Chat widget component on home + detail page ("ask about this café" scoped to that café).
- **Gate**: live conversation end-to-end (mock until key arrives); assert recommendations reference only in-dataset cafés (prove-it-works against real data); UI walkthrough; commit.

### Phase 6 — Public submissions
- `/submit` form: name, location (address or maps URL), note; Zod validation + honeypot field.
- `app/api/agent/verify/route.ts`: insert submission (status `new`) → run `verify_submission` → auto-promote to `cafes` (verified) or flag with reasoning; submission status transitions.
- Submission result page: "being verified" → result (verified + badge, or flagged).
- **Gate**: E2E with real key (or mocks): a fake/duplicate entry gets flagged, a real entry gets verified and appears on `/cafes`; RLS attempt to forge `status` fails; commit.

### Phase 7 — Admin
- `/login`: Supabase email OTP; server-side `invited_emails` allowlist check after sign-in; route guard on `/admin`.
- `/admin`: flagged submissions queue (agent reasoning shown), `curator_assist` (notes/URL → draft record), edit curated scores, `agent_runs` log viewer.
- **Gate**: allowlisted email reaches admin; non-allowlisted email denied; an admin action (approve submission / edit score) writes through and reflects on the public site; commit.

### Phase 8 — Polish + deploy to Cloudflare
- Loading/error/empty states everywhere, metadata/OG, Cloudflare Web Analytics (free, no consent banner).
- Edge rate-limiting rules for the concierge and verify endpoints.
- E2E pass (Playwright): browse → filter → compare → submit → admin journey.
- Deploy: env vars as `wrangler secret put`; `wrangler deploy`; attach custom domain per the recommendation (root if dedicated product domain, else subdomain — exact dashboard steps); re-verify prod URL end-to-end; canary check.
- **Gate**: production URL live, full journey exercised on prod, analytics receiving events, commit + tag.

## Verification gate (every phase, user requirement)

Each phase ends with all four, in order:
1. `npm run lint` + `npx tsc --noEmit` + `npm test` green.
2. Runtime proof on the real surface (dev server, wrangler preview, or prod URL) — the actual feature path exercised, screenshots for UI work.
3. Conventional commit (`feat:`/`fix:`/`chore:` per repo rules, no attribution trailer per user config).
4. Short report to the user: what changed, what was verified (with evidence), what's next, and any blocking inputs they need to supply.

## Risks / open items

- **Supabase credentials** (Phase 1) and **OpenRouter key** (Phase 4) are user-supplied; agent work is mock-tested until then.
- **searchWeb without a search API key** degrades to URL-based verification — acceptable for v1, upgradeable later.
- **OpenNext ↔ Next version pinning**: install exact versions; check peer constraints at scaffold time.
- **Workers runtime limits**: supabase-js + openai SDK are Worker-compatible; keep deps lean (no chart lib, no ORM).
- **vinext** may stabilize during the build; re-evaluate only at Phase 8 as a drop-in, no code depends on it.
- **Seed scores are user data**: Phase 2 ends with the user's review; the JSON file is the artifact they edit.
