import { describe, expect, it } from "vitest"
import { DEFAULT_WEIGHTS, rankCafes, type Weights } from "./ranking"
import { MOODS, moodWeights, type MoodId } from "./moods"
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore } from "@/lib/schemas/score"

const cafe = (id: string, name: string): Cafe => ({
  id,
  slug: id,
  name,
  address: "x",
  lat: null,
  lng: null,
  neighborhood: "Test",
  priceTier: 2,
  source: "owner",
  status: "verified",
  confidenceScore: null,
  verificationNotes: null,
})

const score = (id: string, values: Partial<CafeScore> = {}): CafeScore => ({
  cafeId: id,
  scoredBy: "curator",
  quality: 3,
  priceValue: 3,
  workFriendliness: 3,
  quietVibe: 3,
  specialtyDepth: 3,
  ...values,
})

describe("MOODS", () => {
  it("exposes four public moods in a stable order", () => {
    expect(MOODS.map((m) => m.id)).toEqual(["laptopDay", "talk", "filterNerd", "goodCheap"])
  })

  it("never uses default-equal weights (a mood must steer)", () => {
    for (const mood of MOODS) {
      expect(mood.weights).not.toEqual(DEFAULT_WEIGHTS)
    }
  })
})

describe("moodWeights", () => {
  it("returns a full Weights object for each id", () => {
    const ids: MoodId[] = ["laptopDay", "talk", "filterNerd", "goodCheap"]
    for (const id of ids) {
      const w: Weights = moodWeights(id)
      expect(w.workFriendliness).toBeTypeOf("number")
    }
  })

  it("laptopDay ranks a quiet work café above a loud specialty bar", () => {
    const work = cafe("work", "Work Room")
    const loud = cafe("loud", "Loud Bar")
    const scores = new Map([
      ["work", score("work", { workFriendliness: 5, quietVibe: 5, specialtyDepth: 2, quality: 3, priceValue: 3 })],
      ["loud", score("loud", { workFriendliness: 1, quietVibe: 1, specialtyDepth: 5, quality: 5, priceValue: 3 })],
    ])
    const order = rankCafes([work, loud], scores, moodWeights("laptopDay"))
    expect(order[0].cafe.slug).toBe("work")
  })

  it("filterNerd ranks the specialty bar first", () => {
    const work = cafe("work", "Work Room")
    const loud = cafe("loud", "Loud Bar")
    const scores = new Map([
      ["work", score("work", { workFriendliness: 5, quietVibe: 5, specialtyDepth: 2, quality: 3, priceValue: 3 })],
      ["loud", score("loud", { workFriendliness: 1, quietVibe: 1, specialtyDepth: 5, quality: 5, priceValue: 3 })],
    ])
    const order = rankCafes([work, loud], scores, moodWeights("filterNerd"))
    expect(order[0].cafe.slug).toBe("loud")
  })
})
