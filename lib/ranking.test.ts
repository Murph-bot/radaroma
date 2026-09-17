import { describe, expect, it } from "vitest"
import {
  DEFAULT_WEIGHTS,
  formatMatchLabel,
  isCustomWeights,
  isReviewed,
  rankCafes,
  weightedScore,
  type Weights,
} from "./ranking"
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
  scoresReviewedAt: "2026-09-01T00:00:00.000Z",
  ...values,
})

describe("weightedScore", () => {
  it("equals the plain average with default weights", () => {
    const s = score("a", { quality: 5, priceValue: 1, workFriendliness: 3, quietVibe: 4, specialtyDepth: 2 })
    expect(weightedScore(s, DEFAULT_WEIGHTS)).toBe(3)
  })

  it("shifts toward heavily weighted axes", () => {
    const s = score("a", { quality: 5, priceValue: 1, workFriendliness: 1, quietVibe: 1, specialtyDepth: 1 })
    const weights: Weights = { ...DEFAULT_WEIGHTS, quality: 10 }
    // (10*5 + 1 + 1 + 1 + 1) / 14
    expect(weightedScore(s, weights)).toBeCloseTo((50 + 4) / 14, 10)
  })

  it("returns 0 when all weights are zero", () => {
    const zero: Weights = { quality: 0, priceValue: 0, workFriendliness: 0, quietVibe: 0, specialtyDepth: 0 }
    expect(weightedScore(score("a"), zero)).toBe(0)
  })
})

describe("rankCafes", () => {
  const cafes = [cafe("a", "Alpha"), cafe("b", "Beta"), cafe("c", "Gamma"), cafe("d", "Delta")]

  it("ignores draft (unreviewed) scores so they cannot steer the public rank", () => {
    const scores = new Map<string, CafeScore>([
      ["a", score("a", { quality: 5, priceValue: 5, workFriendliness: 5, quietVibe: 5, specialtyDepth: 5, scoresReviewedAt: null })],
      ["b", score("b", { quality: 2 })],
    ])
    const ranked = rankCafes([cafes[0], cafes[1]], scores)
    expect(ranked.map((r) => r.cafe.id)).toEqual(["b", "a"])
    expect(ranked[1].score).toBeNull()
    expect(ranked[1].rankScore).toBeNull()
  })

  it("isReviewed is false for null, missing, and draft scores", () => {
    expect(isReviewed(null)).toBe(false)
    expect(isReviewed(undefined)).toBe(false)
    expect(isReviewed(score("a", { scoresReviewedAt: null }))).toBe(false)
    expect(isReviewed(score("a"))).toBe(true)
  })

  it("orders by weighted score descending", () => {
    const scores = new Map([
      ["a", score("a", { quality: 5, priceValue: 5, workFriendliness: 5, quietVibe: 5, specialtyDepth: 5 })],
      ["b", score("b", { quality: 1, priceValue: 1, workFriendliness: 1, quietVibe: 1, specialtyDepth: 1 })],
      ["c", score("c", { quality: 3, priceValue: 3, workFriendliness: 3, quietVibe: 3, specialtyDepth: 3 })],
    ])
    const ranked = rankCafes(cafes, scores)
    expect(ranked.map((r) => r.cafe.slug)).toEqual(["a", "c", "b", "d"])
  })

  it("sorts cafés without scores last, alphabetically", () => {
    const scores = new Map([["a", score("a")]])
    const ranked = rankCafes(cafes, scores)
    expect(ranked[0].cafe.slug).toBe("a")
    expect(ranked.slice(1).map((r) => r.cafe.slug)).toEqual(["b", "d", "c"])
  })

  it("breaks ties by name", () => {
    const scores = new Map([
      ["a", score("a")],
      ["b", score("b")],
    ])
    const ranked = rankCafes([cafe("b", "Beta"), cafe("a", "Alpha")], scores)
    expect(ranked.map((r) => r.cafe.slug)).toEqual(["a", "b"])
  })

  it("respects weights in ordering", () => {
    // Alpha excels at quality only; Beta is a steady all-rounder.
    const scores = new Map([
      ["a", score("a", { quality: 5, priceValue: 2, workFriendliness: 2, quietVibe: 2, specialtyDepth: 2 })],
      ["b", score("b", { quality: 3, priceValue: 3, workFriendliness: 3, quietVibe: 3, specialtyDepth: 3 })],
    ])
    const defaultOrder = rankCafes([cafe("a", "Alpha"), cafe("b", "Beta")], scores)
    expect(defaultOrder.map((r) => r.cafe.slug)).toEqual(["b", "a"])

    const qualityOnly: Weights = { ...DEFAULT_WEIGHTS, quality: 5, priceValue: 0.5, workFriendliness: 0.5, quietVibe: 0.5, specialtyDepth: 0.5 }
    const qualityOrder = rankCafes([cafe("a", "Alpha"), cafe("b", "Beta")], scores, qualityOnly)
    expect(qualityOrder.map((r) => r.cafe.slug)).toEqual(["a", "b"])
  })

  it("keeps rankScore on the 1-5 scale", () => {
    const scores = new Map([["a", score("a", { quality: 5, priceValue: 5, workFriendliness: 5, quietVibe: 5, specialtyDepth: 5 })]])
    const ranked = rankCafes([cafe("a", "Alpha")], scores)
    expect(ranked[0].rankScore).toBe(5)
  })
})

describe("formatMatchLabel", () => {
  it("hides the composite at default weights", () => {
    expect(isCustomWeights(DEFAULT_WEIGHTS)).toBe(false)
    expect(formatMatchLabel(4.4, DEFAULT_WEIGHTS)).toBeNull()
  })

  it("labels a steered ranking as a match, not a /5 star", () => {
    const laptop = { ...DEFAULT_WEIGHTS, workFriendliness: 2, quietVibe: 2 }
    expect(isCustomWeights(laptop)).toBe(true)
    expect(formatMatchLabel(4.351, laptop)).toBe("match 4.4")
    expect(formatMatchLabel(4.351, laptop)).not.toMatch(/\/\s*5/)
  })

  it("returns null when there is no score", () => {
    const laptop = { ...DEFAULT_WEIGHTS, workFriendliness: 2 }
    expect(formatMatchLabel(null, laptop)).toBeNull()
  })
})

describe("SCORE_AXES", () => {
  it("does not drift from the schema axis list", async () => {
    const { SCORE_AXES: rankingAxes } = await import("./ranking")
    const { SCORE_AXES: schemaAxes } = await import("@/lib/schemas/score")
    expect([...rankingAxes]).toEqual([...schemaAxes])
  })
})
