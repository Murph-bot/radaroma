// Admin gate: Cloudflare Access (edge) authenticates, the invited_emails
// allowlist authorizes. Identity comes from the signed Access JWT
// (Cf-Access-Jwt-Assertion header or CF_Authorization cookie) — never the
// bare cf-access-authenticated-user-email header, which is client-forgeable
// on any hostname/path not covered by the Access app (e.g. the workers.dev
// fallback). Locally, ADMIN_EMAIL stands in for Access.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose"
import { getDb } from "@/lib/db/sql"

export interface AdminSession {
  email: string
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

// Module-level so the Access certs are fetched once per worker isolate,
// not once per request.
let jwks: JWTVerifyGetKey | null = null
const accessJwks = (teamDomain: string): JWTVerifyGetKey =>
  (jwks ??= createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`)))

const accessCookie = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=")
    if (eq > 0 && part.slice(0, eq).trim() === "CF_Authorization") {
      return part.slice(eq + 1).trim()
    }
  }
  return null
}

// Returns the JWT's email claim when CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD
// are configured and the token verifies; null otherwise. When they are not
// configured (e.g. prod before setup) nothing is trusted — fail closed.
async function emailFromAccessJwt(headers: Headers): Promise<string | null> {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN
  const aud = process.env.CF_ACCESS_AUD
  if (!teamDomain || !aud) return null

  const token =
    headers.get("cf-access-jwt-assertion") ?? accessCookie(headers.get("cookie"))
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, accessJwks(teamDomain), {
      issuer: teamDomain,
      audience: aud,
    })
    return typeof payload.email === "string" ? normalizeEmail(payload.email) : null
  } catch {
    return null
  }
}

export async function getAdminEmail(headers: Headers): Promise<string | null> {
  const accessEmail = await emailFromAccessJwt(headers)
  if (accessEmail) return accessEmail
  // Local dev without Access: ADMIN_EMAIL + RADAROMA_DEV_ADMIN=1.
  // The flag is explicit so this path can never silently become a prod
  // auth bypass (the allowlist check still applies either way).
  const devEmail = process.env.ADMIN_EMAIL
  const devAllowed =
    process.env.NODE_ENV !== "production" || process.env.RADAROMA_DEV_ADMIN === "1"
  if (devEmail && devAllowed) return normalizeEmail(devEmail)
  return null
}

export async function requireAdmin(headers: Headers): Promise<AdminSession | null> {
  const email = await getAdminEmail(headers)
  if (!email) return null
  const db = await getDb()
  const row = await db.get("select email from invited_emails where email = ?", [email])
  return row ? { email } : null
}
