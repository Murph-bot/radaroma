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
# NEVER set ADMIN_EMAIL / RADAROMA_DEV_ADMIN in production
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

## Admin access (Cloudflare Access + JWT verify, ~5 min)

The app verifies the signed Access JWT (`Cf-Access-Jwt-Assertion` / `CF_Authorization`
cookie) against the app's AUD tag — the bare `cf-access-authenticated-user-email`
header is never trusted (forgeable on uncovered paths/hosts). Two env vars wire it up.

1. Zero Trust → Access → Applications → Add an application (Self-hosted).
2. Application domain: `radaroma.com`, and add **both paths**: `admin` and
   `api/admin` (path covers subpaths; `/api/admin/*` is what the dashboard calls).
   Optionally also `www.radaroma.com` with the same paths, or redirect www → apex.
   The `workers.dev` fallback can be added as another hostname on the same app if you
   want admin there too; without it, admin stays locked there (safe).
3. Login method: **One-time PIN** (email OTP, free up to 50 users).
4. Policy: Allow → Include → Emails → your email.
5. Copy the app's **AUD tag** (app → Overview) and your **team domain**
   (Zero Trust → Settings, `<team>.cloudflareaccess.com`), then set them:

```bash
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN   # https://<team>.cloudflareaccess.com
npx wrangler secret put CF_ACCESS_AUD           # app AUD tag
# (not really secret — can also live in wrangler.jsonc "vars")
```

6. Seed the allowlist in the app DB (remote), same email that gets the OTP:

```bash
# or run the insert in the D1 console
npx wrangler d1 execute radaroma --remote --command "insert into invited_emails (email, invited_by, role) values ('you@example.com', 'deploy', 'owner') on conflict (email) do nothing"
```

Verify: `https://radaroma.com/admin` should show the Access OTP screen, then the
dashboard after login. `curl -X POST https://radaroma.com/api/admin/cafes` → 401.

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
