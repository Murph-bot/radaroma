import { beforeEach, describe, expect, it } from "vitest"
import { ScoreRepository } from "./scores"
import { CafeRepository } from "./cafes"
import { createTestDb } from "./test-db"
import type { SqlDb } from "@/lib/db/sql"

const CAFE_ID = "11111111-1111-4111-8111-111111111111"

const scoreInput = {
  quality: 4,
  priceValue: 4,
  workFriendliness: 3,
  quietVibe: 4,
  specialtyDepth: 5,
}

describe("ScoreRepository", () => {
  let db: SqlDb
  let repo: ScoreRepository

  beforeEach(async () => {
    db = createTestDb()
    repo = new ScoreRepository(db)
    const cafes = new CafeRepository(db)
    await cafes.create({
      slug: "taf-coffee",
      name: "Taf Coffee",
      address: "Emmanouil Benaki 7, Athens",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 3,
      source: "owner",
      status: "verified",
      confidenceScore: null,
      verificationNotes: null,
    })
    await db.run("update cafes set id = ? where slug = 'taf-coffee'", [CAFE_ID])
  })

  it("findForCafe returns null when there is no curator score", async () => {
    expect(await repo.findForCafe(CAFE_ID)).toBeNull()
  })

  it("upsertCurator creates and then updates the same row", async () => {
    const created = await repo.upsertCurator(CAFE_ID, scoreInput)
    expect(created.scoredBy).toBe("curator")
    expect(created.quality).toBe(4)

    const updated = await repo.upsertCurator(CAFE_ID, { ...scoreInput, quality: 5 })

    expect(updated.quality).toBe(5)
    const rows = await db.all("select * from cafe_scores where cafe_id = ?", [CAFE_ID])
    expect(rows).toHaveLength(1)
  })

  it("upsertCurator leaves scores unreviewed by default", async () => {
    const created = await repo.upsertCurator(CAFE_ID, scoreInput)
    expect(created.scoresReviewedAt).toBeNull()
  })

  it("findReviewedForCafe(s) exclude drafts and include reviewed rows", async () => {
    await repo.upsertCurator(CAFE_ID, scoreInput)
    expect(await repo.findReviewedForCafe(CAFE_ID)).toBeNull()
    expect((await repo.findReviewedForCafes([CAFE_ID])).size).toBe(0)
    expect((await repo.findForCafes([CAFE_ID])).size).toBe(1)

    await repo.upsertCurator(CAFE_ID, scoreInput, { reviewed: true })
    expect((await repo.findReviewedForCafe(CAFE_ID))?.quality).toBe(4)
    expect((await repo.findReviewedForCafes([CAFE_ID])).get(CAFE_ID)?.quality).toBe(4)
  })

  it("reviewed: true sets scores_reviewed_at; reviewed: false clears it", async () => {
    const reviewed = await repo.upsertCurator(CAFE_ID, scoreInput, { reviewed: true })
    expect(reviewed.scoresReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const edited = await repo.upsertCurator(
      CAFE_ID,
      { ...scoreInput, quality: 2 },
      { reviewed: false },
    )
    expect(edited.quality).toBe(2)
    expect(edited.scoresReviewedAt).toBeNull()
  })

  it("omitting the reviewed option preserves an existing review timestamp", async () => {
    const reviewed = await repo.upsertCurator(CAFE_ID, scoreInput, { reviewed: true })
    const reseeded = await repo.upsertCurator(CAFE_ID, { ...scoreInput, quality: 3 })
    expect(reseeded.quality).toBe(3)
    expect(reseeded.scoresReviewedAt).toBe(reviewed.scoresReviewedAt)
  })

  it("findForCafes returns a Map keyed by cafeId", async () => {
    await repo.upsertCurator(CAFE_ID, scoreInput)
    const otherId = "22222222-2222-4222-8222-222222222222"
    await db.run(
      `insert into cafes (id, slug, name, address, source, status)
       values (?, 'other', 'Other', 'x', 'owner', 'verified')`,
      [otherId],
    )
    await repo.upsertCurator(otherId, { ...scoreInput, quality: 2 })

    const scores = await repo.findForCafes([CAFE_ID, otherId])

    expect(scores.size).toBe(2)
    expect(scores.get(CAFE_ID)?.quality).toBe(4)
    expect(scores.get(otherId)?.quality).toBe(2)
    expect(await repo.findForCafes([])).toEqual(new Map())
  })
})
