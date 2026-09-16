# Deploy guide — Radaroma on Cloudflare Workers

## One-time setup (done)

- D1 database `radaroma` created (`wrangler d1 create`) — id in `wrangler.jsonc`
- Remote migrations applied (`npm run db:migrate:remote`)
- Wrangler authenticated (OAuth, `wrangler whoami`)

## Deploy

```bash
npm run deploy          # opennextjs-cloudflare deploy (build + wrangler deploy)
```

Secrets (server-only, one-time):

```bash
npx wrangler secret put LLM_API_KEY      # your OpenRouter key
npx wrangler secret put APP_URL          # https://your-domain
# NEVER set ADMIN_EMAIL / POUR_COMPASS_DEV_ADMIN in production
```

Public env (inlined at build time, set when building): `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`
(Cloudflare Web Analytics site token, optional).

## Custom domain (done for radaroma.com)

`radaroma.com` and `www.radaroma.com` are attached to the `radaroma` worker via the
`routes` array in `wrangler.jsonc` (`"custom_domain": true`). `wrangler deploy` applies
them and Cloudflare auto-creates the DNS records (the zone is on Cloudflare Registrar
in the same account). HTTPS is automatic — certs can take a few minutes after the
first deploy. The `workers.dev` URL stays enabled as a fallback.

Pending: `radaroma.gr` — bought but nameservers are not yet delegated to Cloudflare.
Once the zone is active, add another route entry and redeploy.

Alternative to `routes`: Workers & Pages → `radaroma` → Settings → Domains & Routes →
Add custom domain in the dashboard.

## Admin access (Cloudflare Access, ~3 min)

1. Zero Trust → Access → Applications → Add an application (Self-hosted).
2. Domain: `https://your-domain/admin*` — choose **Email OTP** as the login method (free up to 50 users).
3. Add your email as a user/policy.
4. Seed the allowlist in the app DB (remote):

```bash
# or run the insert in the D1 console
npx wrangler d1 execute radaroma --remote --command "insert into invited_emails (email, invited_by, role) values ('you@example.com', 'deploy', 'owner') on conflict (email) do nothing"
```

Access passes `Cf-Access-Authenticated-User-Email` to the worker; the app also checks the
`invited_emails` allowlist. Both must match.

## Seed data (remote)

```bash
npm run seed                              # applies to local D1 + writes scripts/seed-cafes.sql
npx wrangler d1 execute radaroma --remote --file=scripts/seed-cafes.sql
```

## Rate limiting

In-app: D1-backed sliding window on both agent endpoints (5 verify/min, 20 chat/min per IP).
For stricter protection add a WAF custom rule in the dashboard:
Rule: `(http.request.uri.path contains "/api/agent")` → Rate limit 30 req/10s per IP, action Block.

## Notes & constraints

- Free-tier Workers: ~10 ms CPU per request. The agent loop is mostly I/O (LLM fetches) but
  complex verify runs may be tight — upgrade to Workers Paid ($5/mo) if submissions stall.
- The concierge returns 503 until `LLM_API_KEY` is set — that's by design.
- Vinext (Cloudflare's newer Next adapter) can be evaluated later as a drop-in; OpenNext 1.20.6
  is pinned and tested.
- Upgrade Next.js carefully: `@opennextjs/cloudflare` peer-depends on the Next version.
