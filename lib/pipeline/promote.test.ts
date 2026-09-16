import { beforeEach, describe, expect, it } from "vitest"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { createTestDb } from "@/lib/db/repositories/test-db"
import type { SqlDb } from "@/lib/db/sql"
import { promoteRecord } from "./promote"

const record = {
  name: "New Place",
  address: "Street 1, Athens",
  lat: 37.98,
  lng: 23.73,
  neighborhood: "Exarchia",
  priceTier: 2,
  scores: { quality: 4, priceValue: 4, workFriendliness: 3, quietVibe: 3, specialtyDepth: 4 },
}

describe("promoteRecord", () => {
  let db: SqlDb

  beforeEach(() => {
    db = createTestDb()
  })

  it("creates a verified café with scores and notes", async () => {
    const cafe = await promoteRecord(db, {
      record,
      source: "public_submission",
      confidenceScore: 0.85,
      verificationNotes: "agent verified",
    })

    expect(cafe.slug).toBe("new-place")
    expect(cafe.status).toBe("verified")
    expect(cafe.source).toBe("public_submission")
    expect(cafe.confidenceScore).toBe(0.85)

    const scores = await db.get("select * from cafe_scores where cafe_id = ?", [cafe.id])
    expect(scores?.quality).toBe(4)
    expect(scores?.specialty_depth).toBe(4)
  })

  it("prefers explicit score overrides", async () => {
    const cafe = await promoteRecord(db, {
      record,
      source: "owner",
      confidenceScore: null,
      verificationNotes: "curated",
      scores: { quality: 1, priceValue: 1, workFriendliness: 1, quietVibe: 1, specialtyDepth: 1 },
    })
    const scores = await db.get("select * from cafe_scores where cafe_id = ?", [cafe.id])
    expect(scores?.quality).toBe(1)
  })

  it("derives a unique slug when the name is taken", async () => {
    const cafes = new CafeRepository(db)
    await cafes.create({
      slug: "new-place",
      name: "New Place",
      address: "Old",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 2,
      source: "owner",
      status: "verified",
      confidenceScore: null,
      verificationNotes: null,
    })
    const cafe = await promoteRecord(db, {
      record,
      source: "owner",
      confidenceScore: null,
      verificationNotes: null,
    })
    expect(cafe.slug).toBe("new-place-2")
  })

  it("does not collapse a Greek-only name to the literal slug 'cafe'", async () => {
    const cafe = await promoteRecord(db, {
      record: { ...record, name: "Καφές Λόφος" },
      source: "public_submission",
      confidenceScore: 0.9,
      verificationNotes: "agent verified",
    })
    expect(cafe.slug).not.toBe("cafe")
    expect(cafe.slug).toBe("καφές-λόφος")
  })
})
