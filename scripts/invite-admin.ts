// Add an email to the invited_emails allowlist (local D1).
// Remote: run the equivalent SQL via the dashboard or
//   wrangler d1 execute pour-compass --remote --command "insert ..."
// Usage: npm run invite -- you@example.com
import { openLocalD1 } from "./local-d1"

async function main() {
  const email = process.argv[2]
  if (!email || !email.includes("@")) {
    console.error("usage: npm run invite -- you@example.com")
    process.exit(1)
  }

  const db = openLocalD1()
  const normalized = email.trim().toLowerCase()
  await db.run(
    "insert into invited_emails (email, invited_by, role) values (?, 'cli', 'owner') on conflict (email) do nothing",
    [normalized],
  )
  console.log(`invited ${normalized} (local D1)`)
}

main().catch((err) => {
  console.error("INVITE FAILED:", err)
  process.exit(1)
})
