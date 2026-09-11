# Pour Compass — Build Spec (v1)

> Use this document as the build brief when working with Cursor / Claude Code.
> Build phase-by-phase in order — each phase should be a working, testable state
> before moving to the next. Don't skip ahead.

**Project name: Pour Compass.**

---

## 1. Vision

A curated, weighted comparison of local cafés — not another star-rating aggregator.
Visitors can re-rank the list by what *they* care about (quiet vs. social, price-value,
specialty coffee depth, wifi/work-friendliness), see each café as a radar chart instead
of a single number, and chat with a built-in AI concierge that recommends from the
real dataset. Public submissions are welcomed from day one, but nothing goes live
without the agent verifying the café is real and not a duplicate.

Launches shared with friends first. No separate "public version" is built later —
the same system just opens up.

---

## 2. Tech stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Matches your existing stack from the bridge club site — no new learning curve for the plumbing |
| Styling | Tailwind CSS | Fast to iterate, no design-system overhead for a solo build |
| Backend/DB | Supabase (Postgres + Auth + Storage) | Free tier, same pattern you already trust; realtime not needed here — busy-ness widget was a *different* idea, not part of this build |
| Validation | Zod | Types check at compile time; Zod checks at runtime — catches bad data coming from the agent or public form before it hits the UI |
| Agent/LLM | Provider-agnostic client wrapper (default: Anthropic API) | You bring your own key; swapping providers later means changing one file, not the whole app |
| Deploy | Vercel | Free tier, zero-config with Next.js |

---

## 3. Data model

### 3.1 Schema (Postgres / Supabase)

```sql
-- cafes: the core, publicly-visible entity
create table cafes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  neighborhood text,
  price_tier smallint check (price_tier between 1 and 4),
  source text not null check (source in ('owner','public_submission')),
  status text not null default 'draft'
    check (status in ('draft','verified','flagged','rejected')),
  confidence_score numeric,      -- agent's verification confidence, 0–1
  verification_notes text,       -- agent's short human-readable summary
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

-- cafe_scores: curator score and future public-average score kept separate
create table cafe_scores (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade,
  scored_by text not null check (scored_by in ('curator','public_avg')),
  quality numeric check (quality between 1 and 5),
  price_value numeric check (price_value between 1 and 5),
  work_friendliness numeric check (work_friendliness between 1 and 5),
  quiet_vibe numeric check (quiet_vibe between 1 and 5),
  specialty_depth numeric check (specialty_depth between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (cafe_id, scored_by)
);

-- submissions: raw public intake, before promotion to `cafes`
create table submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_name text not null,
  submitted_location text not null,   -- address or maps URL, freeform
  submitter_note text,
  status text not null default 'new'
    check (status in ('new','agent_reviewing','verified','flagged','rejected','promoted')),
  promoted_cafe_id uuid references cafes(id),
  created_at timestamptz not null default now()
);

-- agent_runs: audit trail of every agent decision — builds trust and debuggability
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  mode text not null
    check (mode in ('verify_submission','concierge_chat','curator_assist')),
  tool_calls jsonb,          -- log of which tools were invoked + their results
  confidence_score numeric,
  decision text,             -- 'auto_verified' | 'flagged_for_review' | 'rejected'
  reasoning text,
  created_at timestamptz not null default now()
);

-- invited_emails: allowlist for ADMIN access only (not for browsing/submitting)
create table invited_emails (
  email text primary key,
  invited_by text,
  role text not null default 'curator' check (role in ('owner','curator')),
  created_at timestamptz not null default now()
);
```

### 3.2 Domain types (TypeScript + Zod)

Keep DB rows (`snake_case`) separate from domain types (`camelCase`) via a thin
repository layer — this is the same pattern your Warranty Vault spec already uses.

```ts
import { z } from "zod";

export const CafeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  neighborhood: z.string().nullable(),
  priceTier: z.number().int().min(1).max(4),
  source: z.enum(["owner", "public_submission"]),
  status: z.enum(["draft", "verified", "flagged", "rejected"]),
  confidenceScore: z.number().min(0).max(1).nullable(),
  verificationNotes: z.string().nullable(),
});
export type Cafe = z.infer<typeof CafeSchema>;

export const CafeScoreSchema = z.object({
  cafeId: z.string().uuid(),
  scoredBy: z.enum(["curator", "public_avg"]),
  quality: z.number().min(1).max(5),
  priceValue: z.number().min(1).max(5),
  workFriendliness: z.number().min(1).max(5),
  quietVibe: z.number().min(1).max(5),
  specialtyDepth: z.number().min(1).max(5),
});
export type CafeScore = z.infer<typeof CafeScoreSchema>;
```

---

## 4. Agent design — "Café Concierge"

One module (`lib/agent/`) with a shared LLM client + tool registry, reused across
three modes via different system prompts and tool subsets. Don't build three
separate agent implementations — that's duplicated plumbing for no reason.

### Tools available to the agent

- `searchWeb(query)` — general web search to find the café's official presence
- `fetchPage(url)` — pull structured content (address, hours, menu mentions)
- `findNearbyCafes(lat, lng, radiusM)` — query existing `cafes` for duplicates
- `draftCafeRecord(fields)` — structured-output tool; proposes a record matching `CafeSchema`
- `queryCafesByWeights(weights)` — read-only ranking query (powers the slider re-ranker and the chat)

### Modes

**1. `verify_submission`** — triggered by the public submit form.
Tools: `searchWeb`, `fetchPage`, `findNearbyCafes`, `draftCafeRecord`.
Flow: confirm the café is real → check for duplicates → draft a record.
- Confidence ≥ 0.75 **and** no duplicate found → auto-promote to `cafes` with
  `status='verified'`. Frontend shows a small "community-submitted, AI-verified"
  badge for transparency — never hide that it wasn't hand-curated.
- Below threshold, or possible duplicate → `status='flagged'`, appears in
  `/admin` with the agent's full reasoning attached.

**2. `concierge_chat`** — the visitor-facing chat widget.
Tools: `queryCafesByWeights` only. Deliberately no web access here — keeps it
fast, cheap, and structurally incapable of recommending a café that isn't
actually in your dataset.

**3. `curator_assist`** — used inside `/admin` when reviewing a flagged
submission or writing up a new curated entry.
Tools: `fetchPage`, `draftCafeRecord`. Turns your raw notes/links into a
draft record instead of starting from a blank form.

---

## 5. Screens

| Route | Purpose |
|---|---|
| `/` | Hero, top cafés, slider-weight teaser, concierge search bar |
| `/cafes` | Full list, filters, radar-chart cards |
| `/cafes/[slug]` | Detail page — radar chart, score breakdown, "ask about this café" mini chat |
| `/compare` | Pick 2–3 cafés, overlaid radar chart |
| `/submit` | Public submission form → triggers `verify_submission` |
| `/admin` | Allowlist-gated. Review flagged submissions, edit curated scores, view `agent_runs` logs |
| `/login` | Magic-link auth (admin only) |

---

## 6. Access model

- **Browsing**: fully open, no login. It's meant to be public eventually — build it that way from day one.
- **Submitting a café**: open, no login. The agent's verification pipeline is the safeguard, not an account wall.
- **Editing / approving / admin**: gated via Supabase Auth (magic link) + the `invited_emails` allowlist. Starts with just you; add trusted friends as co-curators by inserting a row — no code change.

This means "friends first, ready for public" isn't two systems — it's one system
that happens to have low traffic at first.

---

## 7. Folder structure (repository pattern)

```
/app
  /(public)
    page.tsx                # home
    /cafes/page.tsx
    /cafes/[slug]/page.tsx
    /compare/page.tsx
    /submit/page.tsx
  /admin
    page.tsx
    /submissions/page.tsx
  /api
    /agent/concierge/route.ts
    /agent/verify/route.ts
    /agent/curator-assist/route.ts
/lib
  /db
    client.ts
    /repositories
      cafes.ts
      scores.ts
      submissions.ts
  /agent
    client.ts              # provider-agnostic LLM wrapper
    tools.ts
    prompts/
      concierge.ts
      verify.ts
      curatorAssist.ts
  /schemas
    cafe.ts
    score.ts
```

---

## 8. Build phases

- [ ] **Phase 0 — Scaffold**: Next.js + TS + Tailwind + Supabase project, env vars, deploy pipeline to Vercel
- [ ] **Phase 1 — Data layer**: run the schema migration, build repository functions, wire Zod schemas
- [ ] **Phase 2 — Seed curated content**: manually add 15–20 cafés + your scores (no agent yet, no public form yet)
- [ ] **Phase 3 — Public browsing UI**: list, detail page, radar chart component, slider re-ranker, compare view
- [ ] **Phase 4 — Agent core**: LLM client wrapper, tool registry, the three prompt files
- [ ] **Phase 5 — Concierge chat**: wire mode 2 into the homepage/detail widget
- [ ] **Phase 6 — Public submissions**: `/submit` form → `verify_submission` pipeline → confidence routing
- [ ] **Phase 7 — Admin review queue**: `/admin` UI, `curator_assist` mode, agent_runs log viewer
- [ ] **Phase 8 — Polish**: auth gate on `/admin`, basic analytics, error states, deploy

---

## 9. Open items for later (not v1)

- Public-facing reviews/ratings feeding `cafe_scores` with `scored_by = 'public_avg'` — the table already supports this, just isn't populated yet
- Time-of-day busyness data
- PWA offline caching for the café list
