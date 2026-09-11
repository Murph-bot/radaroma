import { describe, expect, it } from "vitest"
import { ScoreRepository } from "./scores"
import { mockSupabase } from "./repo-test-utils"

const scoreRow = (overrides: Record<string, unknown> = {}) => ({
  cafe_id: "11111111-1111-4111-8111-111111111111",
  scored_by: "curator",
  quality: 4,
  price_value: 4,
  work_friendliness: 3,
  quiet_vibe: 4,
  specialty_depth: 5,
  ...overrides,
})

describe("ScoreRepository", () => {
  it("findForCafes returns a Map keyed by cafeId", async () => {
    const { client, q, setResult } = mockSupabase()
    const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    setResult({
      data: [
        scoreRow({ cafe_id: idA, quality: 5 }),
        scoreRow({ cafe_id: idB, quality: 3 }),
      ],
      error: null,
    })
    const repo = new ScoreRepository(client)

    const scores = await repo.findForCafes([idA, idB])

    expect(q.in).toHaveBeenCalledWith("cafe_id", [idA, idB])
    expect(q.eq).toHaveBeenCalledWith("scored_by", "curator")
    expect(scores.size).toBe(2)
    expect(scores.get(idA)?.quality).toBe(5)
  })

  it("findForCafes returns an empty Map for no ids", async () => {
    const { client } = mockSupabase()
    const repo = new ScoreRepository(client)
    const scores = await repo.findForCafes([])
    expect(scores.size).toBe(0)
  })

  it("upsertCurator posts the right payload", async () => {
    const { client, q, setResult } = mockSupabase()
    setResult({ data: scoreRow(), error: null })
    const repo = new ScoreRepository(client)

    await repo.upsertCurator("11111111-1111-4111-8111-111111111111", {
      quality: 4,
      priceValue: 4,
      workFriendliness: 3,
      quietVibe: 4,
      specialtyDepth: 5,
    })

    expect(q.upsert).toHaveBeenCalledWith(
      {
        cafe_id: "11111111-1111-4111-8111-111111111111",
        scored_by: "curator",
        quality: 4,
        price_value: 4,
        work_friendliness: 3,
        quiet_vibe: 4,
        specialty_depth: 5,
      },
      { onConflict: "cafe_id,scored_by" },
    )
  })
})
