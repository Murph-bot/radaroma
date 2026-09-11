// Smoke test for the data layer against the REAL remote Supabase project.
// Requires .env.local with Supabase vars. Creates + deletes its own rows.
// Run: npm run smoke:db
import { loadEnvFile } from "node:process"
import { createAdminClient, createAnonClient } from "../lib/db/client"
import { CafeRepository } from "../lib/db/repositories/cafes"
import { SubmissionRepository } from "../lib/db/repositories/submissions"

try {
  loadEnvFile(".env.local")
} catch {
  // env vars may already be set in the shell
}

async function main() {
  const admin = createAdminClient()
  const anon = createAnonClient()
  const cafes = new CafeRepository(admin)
  const anonCafes = new CafeRepository(anon)
  const submissions = new SubmissionRepository(anon)

  const slug = `smoke-${Date.now()}`
  const created = await cafes.create({
    slug,
    name: "Smoke Test Cafe",
    address: "Smoke Street 1, Athens",
    lat: 37.977,
    lng: 23.733,
    neighborhood: "Smoketown",
    priceTier: 2,
    source: "owner",
    status: "draft",
    confidenceScore: null,
    verificationNotes: null,
  })
  console.log("1. admin created draft cafe:", created.slug)

  const anonDraft = await anonCafes.findBySlug(slug)
  if (anonDraft) throw new Error("RLS LEAK: anon client saw a draft cafe")
  console.log("2. anon client cannot see draft (RLS ok)")

  await cafes.markVerified(created.id)
  const anonVerified = await anonCafes.findBySlug(slug)
  if (!anonVerified) throw new Error("anon client could not read verified cafe")
  console.log("3. anon client reads verified cafe (RLS ok)")

  const sub = await submissions.create({
    submittedName: "Smoke Test Submission",
    submittedLocation: "Athens",
    submitterNote: "smoke",
  })
  if (sub.status !== "new") throw new Error(`expected status 'new', got ${sub.status}`)
  console.log("4. public submission inserted via anon client, status:", sub.status)

  const forged = await anon
    .from("submissions")
    .insert({ submitted_name: "Forged", submitted_location: "Athens", status: "verified" })
  if (!forged.error) {
    throw new Error("RLS GAP: anon insert with status='verified' succeeded")
  }
  console.log("5. forged status insert rejected by RLS")

  await admin.from("cafes").delete().eq("id", created.id)
  await admin.from("submissions").delete().eq("id", sub.id)
  console.log("6. cleanup done")

  console.log("SMOKE DB OK — data layer verified against real Supabase")
}

main().catch((err) => {
  console.error("SMOKE DB FAILED:", err)
  process.exit(1)
})
