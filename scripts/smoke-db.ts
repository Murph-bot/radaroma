// Smoke test for the data layer against the LOCAL D1 database — the same
// SQLite file `npm run preview` serves. Creates + deletes its own rows.
// Prereq: `npm run db:migrate:local`
// Run: npm run smoke:db
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import Database from "better-sqlite3"
import { sqliteDb } from "../lib/db/sql"
import { CafeRepository } from "../lib/db/repositories/cafes"
import { SubmissionRepository } from "../lib/db/repositories/submissions"

// Find the actual D1 database file under .wrangler/state/v3/d1/ — the name
// is a content hash, so we scan for *.sqlite files that aren't miniflare
// metadata or WAL/SHM sidecars.
function findLocalD1Db(): string {
  const base = ".wrangler/state/v3/d1"
  if (!existsSync(base)) return ""
  const walk = (dir: string): string => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        const found = walk(full)
        if (found) return found
      } else if (entry.endsWith(".sqlite") && entry !== "metadata.sqlite") {
        return full
      }
    }
    return ""
  }
  return walk(base)
}

async function main() {
  const dbFile = findLocalD1Db()
  if (!dbFile) {
    throw new Error(
      "local D1 database not found — run `npm run db:migrate:local` first",
    )
  }
  const db = sqliteDb(new Database(dbFile))
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
