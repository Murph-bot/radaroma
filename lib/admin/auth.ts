// Admin gate: Cloudflare Access (edge) authenticates, the invited_emails
// allowlist authorizes. Locally, ADMIN_EMAIL stands in for Access.
import { getDb } from "@/lib/db/sql"

export interface AdminSession {
  email: string
}

export async function getAdminEmail(headers: Headers): Promise<string | null> {
  // Cloudflare Access injects this header when /admin is behind an Access app
  const accessEmail = headers.get("cf-access-authenticated-user-email")
  if (accessEmail) return accessEmail.toLowerCase()
  // Local dev without Access: ADMIN_EMAIL + POUR_COMPASS_DEV_ADMIN=1.
  // The flag is explicit so this path can never silently become a prod
  // auth bypass (the allowlist check still applies either way).
  const devEmail = process.env.ADMIN_EMAIL
  const devAllowed =
    process.env.NODE_ENV !== "production" || process.env.POUR_COMPASS_DEV_ADMIN === "1"
  if (devEmail && devAllowed) return devEmail.toLowerCase()
  return null
}

export async function requireAdmin(headers: Headers): Promise<AdminSession | null> {
  const email = await getAdminEmail(headers)
  if (!email) return null
  const db = await getDb()
  const row = await db.get("select email from invited_emails where email = ?", [email])
  return row ? { email } : null
}
