import { beforeEach, describe, expect, it } from "vitest"
import { SubmissionRepository } from "./submissions"
import { CafeRepository } from "./cafes"
import { createTestDb } from "./test-db"
import type { SqlDb } from "@/lib/db/sql"

describe("SubmissionRepository", () => {
  let db: SqlDb
  let repo: SubmissionRepository

  beforeEach(() => {
    db = createTestDb()
    repo = new SubmissionRepository(db)
  })

  it("create always stores status 'new' regardless of input", async () => {
    const sub = await repo.create({
      submittedName: "Kaya Coffee",
      submittedLocation: "Athens",
      submitterNote: "great filter coffee",
    })

    expect(sub.status).toBe("new")
    expect(sub.submittedName).toBe("Kaya Coffee")
    expect(sub.submitterNote).toBe("great filter coffee")
    expect(sub.promotedCafeId).toBeNull()
  })

  it("create stores null note when omitted", async () => {
    const sub = await repo.create({
      submittedName: "Kaya Coffee",
      submittedLocation: "Athens",
    })
    expect(sub.submitterNote).toBeNull()
  })

  it("findByStatus and listRecent order newest first", async () => {
    const first = await repo.create({ submittedName: "First", submittedLocation: "A" })
    // Backdate the first so ordering is deterministic
    await db.run("update submissions set created_at = '2020-01-01T00:00:00.000Z' where id = ?", [
      first.id,
    ])
    const second = await repo.create({ submittedName: "Second", submittedLocation: "B" })

    const recent = await repo.listRecent()
    expect(recent.map((s) => s.id)).toEqual([second.id, first.id])
    expect((await repo.findByStatus("new")).map((s) => s.id)).toEqual([second.id, first.id])
    expect(await repo.findByStatus("verified")).toEqual([])
  })

  it("updateStatus transitions and records the promoted cafe", async () => {
    const cafes = new CafeRepository(db)
    const cafe = await cafes.create({
      slug: "promoted",
      name: "Promoted Cafe",
      address: "x",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 2,
      source: "public_submission",
      status: "verified",
      confidenceScore: 0.9,
      verificationNotes: "agent verified",
    })
    const sub = await repo.create({ submittedName: "Promoted", submittedLocation: "x" })

    const updated = await repo.updateStatus(sub.id, "promoted", cafe.id)

    expect(updated.status).toBe("promoted")
    expect(updated.promotedCafeId).toBe(cafe.id)
  })

  it("rejects promotion to a nonexistent cafe (FK)", async () => {
    const sub = await repo.create({ submittedName: "X", submittedLocation: "x" })
    await expect(
      repo.updateStatus(sub.id, "promoted", "00000000-0000-4000-8000-000000000000"),
    ).rejects.toThrow()
  })
})
