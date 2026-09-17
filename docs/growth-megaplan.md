---
product: Radaroma
kind: growth-megaplan
created: 2026-09-17
source: Archidamos suggestions 1–26 + AGENTS.md known state
status: approved-2026-09-17 (Phase A gated on Devin mode + ACU per job)
stack_note: Sequence as verifiable phases; each phase ends in a prove-it gate before the next.
---

# Radaroma — Growth Megaplan (post-v1)

Phased plan to grow Radaroma from a shipped Attica café radar into an Athens habit: denser curated data, bilingual depth, shareable discovery, harder agents, safer ops.

This is **not** a rewrite of `docs/megaplan.md` (build-from-spec). That plan got you to production. This plan assumes current known state in `AGENTS.md` and sequences the 26 growth items as verifiable units.

## Context (ground truth)

**Live today**
- EN: https://radaroma.com · EL: https://radaroma.gr (host-based i18n, typed `el`/`en` in `lib/i18n.ts`)
- Radar + mood presets + compare + concierge + submit + Access admin
- D1 + OpenNext Workers; LLM via OpenRouter (`deepseek/deepseek-v4-flash-0731`)
- Indie-only curation rule; ~20 seeded cafés; **seed scores still draft pending curator review**
- Verify agent + DuckDuckGo HTML fallback when Tavily unset
- Private backup mirror: `Murph-bot/radaroma-gr`

**Product premise (do not violate)**
- Curated weighted comparison, not star-aggregators
- One ranking function for UI + agent
- Public submissions welcome; nothing live without verify + human path
- Independent specialty only — no chains

## pstack moves this plan uses

| Principle | How it shows up |
|---|---|
| Sequence verifiable units | Phases A→H; each ends with lint/tsc/test + runtime proof + commit + short report |
| Prove it works | Gates hit real URLs / real D1 / real agent paths — not "build passed" alone |
| Subtract before add | Prefer content+ops truth over new surface area early |
| Build the lever | Nomination/verify scripts, eval set, sync backup — not one-off manual heroics |
| Never block on the human (tech) | Technical forks decided here; product resonance questions collected before execution |
| Experience first | Share cards, neighborhood landings, Greek blurbs beat abstract "platform" work |
| Model the domain | Scores review state, neighborhood entity, share payloads, submission lifecycle made explicit |
| Boundary discipline | Zod at API edges; repos remain sole DB path; Access JWT never skipped |

## Scope

**In:** items 1–26 mapped below.

**Out (unless you later expand):** multi-city, public star ratings, busyness widgets, full accounts/auth for visitors, offline-first PWA caching, native apps.

**Execution rule:** Do not start a phase until the previous gate is green *and* you have answered the blocking human inputs for that phase.

## Item → phase map (all 26)

| # | Item | Phase |
|---|---|---|
| 1 | Curator score review | A |
| 2 | Coverage density (Attica) | A |
| 3 | Greek café content (`notes_el` / blurbs) | A |
| 4 | Tavily / real search | D |
| 5 | Shareable compare + OG | C |
| 6 | Saved moods / "my Athens" | E |
| 7 | Neighborhood pages | C |
| 8 | Open now / walkable | E |
| 9 | Submit → status tracking | E |
| 10 | Editorial spine | F |
| 11 | Mobile perf | G |
| 12 | PWA polish (shortcuts) | G |
| 13 | A11y pass | G |
| 14 | "Why this score" drawer | G |
| 15 | Stronger verify (denylist, geo) | D |
| 16 | Concierge eval set | D |
| 17 | Rate limits + abuse | B |
| 18 | Admin ops (bulk, queue, merge) | H |
| 19 | Analytics that matter | B (skeleton) → F (use) |
| 20 | SEO Greek queries | C |
| 21 | Share images / Maps pack | C |
| 22 | Indie shop partners | F |
| 23 | `.com` / `.gr` string parity discipline | continuous (gate on every phase) |
| 24 | Finish `.gr` DNS / host story | B |
| 25 | Backup hygiene (mirror + D1 snapshot) | B |
| 26 | Staging worker | B |

---

## Phase A — Truth layer (trust is the product)

**Goal:** Scores and coverage feel honest; Greek visitors get local content depth.

### A1 — Curator score review (item 1)
- Admin UX (or scripted checklist) to walk every seed café axis; mark `scores_reviewed_at` (or equivalent) when done.
- Diff draft vs approved scores; regenerate any derived blurbs/chips if they depend on scores.
- **Gate:** 100% of live verified cafés have curator-approved scores; spot-check 5 radars on prod match admin values.

### A2 — Coverage density (item 2)
- Define target: ≥N verified cafés per priority neighborhood (decide N with you).
- Lever: nomination list → verify agent → human approve queue (no silent auto-publish).
- Geographic spread checklist: Exarcheia, Koukaki, Pangrati, Kifisia, Glyfada, Piraeus, Marousi, …
- **Gate:** Coverage report (counts per neighborhood); verify rejects a planted chain; at least one new café promoted via the real pipeline.

### A3 — Greek content depth (item 3)
- Add optional `notes_el` / `blurb_el` (or parallel fields) without breaking EN.
- Translate/adapt curator blurbs for `.gr`; keep café names as proper nouns.
- **Gate:** Typed i18n still green; sample of 10 cafés show Greek blurbs on `.gr` and EN on `.com`.

**Phase A exit:** Athens list feels curated-true in both languages for the covered set.

---

## Phase B — Platform safety (make growth non-fragile)

**Goal:** Safe deploys, backups, abuse resistance, measurement.

### B1 — Host / DNS closure (item 24)
- Confirm `radaroma.gr` / `www` + `.com` / `www` routes, certs, Access coverage for admin on the hosts you care about.
- Document the canonical pair in `docs/deploy.md`.
- **Gate:** HTTP 200 + `lang` correct on all four hosts; admin locked on workers.dev if desired.

### B2 — Staging worker (item 26)
- Separate Worker + D1 (or branch preview) for copy/LLM experiments.
- Deploy path that cannot clobber prod secrets by accident.
- **Gate:** Staging URL runs full browse→compare→concierge smoke without touching prod D1.

### B3 — Backup hygiene (item 25)
- Document `greek-backup` remote push after release.
- Script: remote D1 snapshot/export on a schedule (or documented manual).
- **Gate:** Restore drill once (empty scratch DB ← snapshot) succeeds.

### B4 — Rate limits + abuse (item 17)
- Edge/app limits on concierge + submit + verify; honeypot already exists — extend.
- **Gate:** Synthetic flood returns 429; legit single-user path still works.

### B5 — Analytics skeleton (item 19)
- Event taxonomy only: mood_click, compare_share, concierge_open_cafe, submit_start/success.
- Prefer privacy-friendly (CF + thin server events). No PII.
- **Gate:** Each event fires once in staging; dashboard or log proof.

**Phase B exit:** You can ship aggressively without fearing silent data loss or LLM bill shock.

---

## Phase C — Discovery & share loop

**Goal:** People send Radaroma to friends; Google sends curious Athenians.

### C1 — Compare share + OG (item 5)
- Stable compare URLs; OG image/title that shows the 2–3 cafés; one-tap copy.
- **Gate:** Slack/iMessage unfurl shows useful preview; cold open of shared URL restores selection.

### C2 — Share cards / Maps pack (item 21)
- Export pentagon card PNG/SVG for IG/Stories; optional Maps list export.
- **Gate:** Generated card matches live scores for a fixture café.

### C3 — Neighborhood pages (item 7) + SEO Greek (item 20)
- `/neighborhoods/[slug]` (or EL-friendly routes without breaking host i18n).
- Titles/descriptions for queries like «καφέ για λάπτοπ Εξάρχεια».
- **Gate:** Crawlable pages; Lighthouse SEO basics; at least 3 neighborhoods live with ≥M cafés each.

**Phase C exit:** Share and search are intentional acquisition channels, not afterthoughts.

---

## Phase D — Agent quality

**Goal:** Concierge and verify are trustworthy enough to scale submissions.

### D1 — Tavily / real search (item 4)
- `SEARCH_API_KEY` wired; scrape becomes fallback only.
- **Gate:** Side-by-side verify on 5 known cafés + 2 fakes; search path used when key present.

### D2 — Stronger verify (item 15)
- Chain/franchise denylist tests; Attica geofence; clearer structured verdicts.
- **Gate:** Planted Coffee Island / Mikel rejected; out-of-Attica rejected; indie specialty accepted with notes.

### D3 — Concierge eval set (item 16)
- 20 fixed prompts (10 EL / 10 EN) with expected café ID sets.
- CI or scheduled job; fail on regression beyond threshold.
- **Gate:** Eval runs green on current model; one intentional prompt change flips red then fixed.

**Phase D exit:** Agent changes are measurable; verify is a product feature, not a hope.

---

## Phase E — Retention loops

**Goal:** Return visits without building a heavy account system first.

### E1 — Saved moods (item 6)
- Local-first saved weight presets ("my Athens"); optional later sync.
- **Gate:** Reload persists presets; works offline for the preference itself.

### E2 — Open now / walkable (item 8)
- Hours in schema if missing; Maps deep link; optional geolocation distance sort.
- **Gate:** Fixture with known hours shows correct open/closed in Athens TZ.

### E3 — Submit status tracking (item 9)
- Email or magic link when submission verified/rejected/flagged.
- **Gate:** End-to-end on staging with a test inbox; no email → no silent drop.

**Phase E exit:** Second visit is better than the first; submitters come back.

---

## Phase F — Editorial & partnerships

**Goal:** Narrative + social proof without becoming a media company.

### F1 — Editorial spine (item 10)
- Lightweight "shapes of the week" or neighborhood features — MD/content table, not a CMS empire.
- **Gate:** One issue published EN+EL; linked from home; analytics event fires.

### F2 — Indie partners (item 22)
- 2–3 shops: reciprocal link + featured chip; clear indie criteria.
- **Gate:** Partner pages live; outbound links correct; curation rule documented for partners.

### F3 — Use analytics (item 19 continued)
- Read mood/share/submit funnels monthly; one decision per month from data.
- **Gate:** Written note: one behavior change driven by an event.

**Continuous:** item 23 — every phase PR must keep `el` typed parity; missing Greek key = fail CI.

---

## Phase G — Craft (feel expensive)

**Goal:** Mobile-native quality; accessible; scores explain themselves.

### G1 — Mobile perf (item 11)
- Lighthouse budgets; image/font discipline; reduce main-thread work on home/list.
- **Gate:** Agreed LCP/INP thresholds on mobile throttling for home + café detail.

### G2 — PWA shortcuts (item 12)
- Home-screen shortcuts: Compare, Submit, Concierge.
- **Gate:** Install + shortcut opens correct route on Android and iOS Safari constraints documented.

### G3 — A11y (item 13)
- Keyboard sliders/radar; EL screen-reader strings; focus states.
- **Gate:** Manual a11y checklist + axe clean on key pages.

### G4 — Why this score (item 14)
- Drawer: axis → short curator rationale (data field or generated-then-edited).
- **Gate:** 5 cafés show non-empty rationale for ≥3 axes; no hallucinated admin text in public path without review flag.

---

## Phase H — Admin scale

**Goal:** You can run curation without drowning.

### H1 — Admin ops (item 18)
- Bulk score edit, needs-review queue, duplicate merge UI.
- **Gate:** Merge two dupes preserves scores/history; queue empties a seeded backlog item in <2 min.

---

## Cross-cutting verification gate (every phase)

1. `npm run lint` + `npx tsc --noEmit` + `npm test` green
2. Runtime proof on staging (preferred) or prod URL — real path exercised
3. EN/EL parity: no missing `el` keys; spot-check `.gr` + `.com`
4. Conventional commit; short report: changed / evidence / next / blocking inputs
5. If Devin executes a slice: mode + ACU cap set per job; PR not force-pushed to main

## Suggested sequence (default)

A → B → C → D → E → F → G → H

Rationale: truth before traffic; safety before agent spend; share/SEO before retention polish; craft after the loop exists; admin scale when volume hurts.

**Alternate (if growth-first):** B (thin) → C → A2 → D → … — only if you accept shipping on draft scores longer.

## Risks

- Draft scores shipped while SEO ramps → distrust
- Concierge cost if share goes viral before rate limits
- Greek content debt if UI stays ahead of blurbs
- Staging skipped → Greek/LLM experiments land straight on prod
- Partner deals that blur indie-only rule

## Blocking human inputs (by phase)

- **A:** Score review time; target cafés/neighborhood; who writes/approves Greek blurbs
- **B:** Staging account strategy; backup cadence; analytics tool preference
- **C:** Brand voice for OG/share cards; neighborhood priority list
- **D:** Tavily key; eval prompt ownership
- **E:** Email provider for submit status; hours data source
- **F:** Partner shortlist; editorial cadence
- **G:** Perf budgets; a11y bar
- **H:** Admin workflow preferences

## Non-goals reminder

Do not turn this megaplan into a second product. Subtract features that do not serve: curated Attica comparison → share → return → submit → verify.

## Resonance decisions (locked 2026-09-17)

| Decision | Choice |
|---|---|
| Phase order | **A→H default** (truth → platform → discovery → agents → retention → editorial → craft → admin) |
| Phase A priority | **Score review first**, then coverage (~30 central), then Greek blurbs |
| Coverage ambition | **~30 verified cafés**, core central neighborhoods |
| Retention (6 & 9) | **Local-first saved moods**; submit status via **email magic link later** (no visitor accounts in this megaplan) |
| Platform (B) | **Staging Worker** + **CF Web Analytics / light server events** (no third-party analytics required) |
| Execution shape | Finalize plan → on explicit OK, copy to `docs/growth-megaplan.md` → execute **phase-by-phase with gate OK** (Devin slice only when Sotirios sets mode + ACU) |

Status: **approved 2026-09-17**. Copied to `docs/growth-megaplan.md`. Phase A (score review) starts only when Sotirios sets Devin mode + ACU for that job.
