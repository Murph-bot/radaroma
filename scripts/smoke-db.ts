// Smoke test for the data layer against the LOCAL D1 database — the same
// SQLite file `npm run preview` serves. Creates + deletes its own rows.
// Prereq: `npm run db:migrate:local`
// Run: npm run smoke:db
import { openLocalD1 } from "./local-d1"
import { CafeRepository } from "../lib/db/repositories/cafes"
import { SubmissionRepository } from "../lib/db/repositories/submissions"

async function main() {
  const db = openLocalD1()
  const cafes = new CafeRepository(db)
  const submissions = new SubmissionRepository(db)

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
  console.log("1. created draft cafe:", created.slug)

  const verifiedList = await cafes.findVerified()
  if (verifiedList.some((c) => c.slug === slug)) {
    throw new Error("VISIBILITY GAP: draft cafe leaked into findVerified()")
  }
  console.log("2. draft cafe not visible via the public read path")

  await cafes.markVerified(created.id)
  const bySlug = await cafes.findBySlug(slug)
  if (!bySlug || bySlug.status !== "verified") {
    throw new Error("markVerified did not make the cafe verified")
  }
  console.log("3. cafe verified and readable")

  const sub = await submissions.create({
    submittedName: "Smoke Test Submission",
    submittedLocation: "Athens",
  })
  if (sub.status !== "new") throw new Error(`expected status 'new', got ${sub.status}`)
  console.log("4. public submission stored as status:", sub.status)

  await db.run("delete from cafes where id = ?", [created.id])
  await db.run("delete from submissions where id = ?", [sub.id])
  console.log("5. cleanup done")

  console.log("SMOKE DB OK — data layer verified against local D1")
}

main().catch((err) => {
  console.error("SMOKE DB FAILED:", err)
  process.exit(1)
})
