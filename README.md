# Radaroma

A curated, weighted comparison of local cafés — not another star-rating aggregator.
Re-rank the list by what you care about, see each café as a radar chart, and chat
with an AI concierge that only recommends cafés actually in the dataset.

- Build brief: [`radaroma-spec.md`](./radaroma-spec.md)
- Build plan: [`docs/megaplan.md`](./docs/megaplan.md)
- Working agreement & commands: [`AGENTS.md`](./AGENTS.md)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) ·
OpenRouter (LLM) · Deployed to Cloudflare Workers via OpenNext.

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + OpenRouter values
npm run dev                        # http://localhost:3000
```

Other commands:

```bash
npm test          # Vitest unit/integration tests
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run preview   # build + run the Worker locally (wrangler)
npm run deploy    # build + deploy to Cloudflare Workers
npm run seed      # idempotent seed of data/seed/ into Supabase
```
