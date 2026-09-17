import { describe, expect, it } from "vitest"
import { bestForChips } from "./bestFor"
import type { CafeScore } from "@/lib/schemas/score"

const base: CafeScore = {
  cafeId: "00000000-0000-0000-0000-000000000001",
  scoredBy: "curator",
  quality: 3,
  priceValue: 3,
  workFriendliness: 3,
  quietVibe: 3,
  specialtyDepth: 3,
  scoresReviewedAt: null,
}

describe("bestForChips", () => {
  it("emits chips for axes scoring 4 or 5, in axis order", () => {
    expect(bestForChips({ ...base, workFriendliness: 5, quietVibe: 4, specialtyDepth: 2 })).toEqual([
      "laptop",
      "quiet",
    ])
  })

  it("returns empty when nothing stands out", () => {
    expect(bestForChips(base)).toEqual([])
  })

  it("maps specialty to filter and priceValue to value", () => {
    expect(bestForChips({ ...base, priceValue: 5, specialtyDepth: 5 })).toEqual(["value", "filter"])
  })
})
