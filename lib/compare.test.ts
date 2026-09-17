import { describe, expect, it } from "vitest"
import { defaultCompareSlugs, farthestPartner, radarDistance, shapeTrio } from "./compare"
import type { RankedCafe } from "./ranking"
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore } from "@/lib/schemas/score"

const ranked = (
  slug: string,
  name: string,
  values: Pick<CafeScore, "quality" | "priceValue" | "workFriendliness" | "quietVibe" | "specialtyDepth">,
): RankedCafe => ({
  cafe: {
    id: slug,
    slug,
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
  } satisfies Cafe,
  score: { cafeId: slug, scoredBy: "curator", scoresReviewedAt: null, ...values },
  rankScore: 3,
})

describe("radarDistance", () => {
  it("is 0 for identical shapes", () => {
    const a = { quality: 3, priceValue: 3, workFriendliness: 3, quietVibe: 3, specialtyDepth: 3 }
    expect(radarDistance(a, a)).toBe(0)
  })
})

describe("defaultCompareSlugs", () => {
  const quiet = ranked("foyer", "Foyer", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })
  const social = ranked("underdog", "Underdog", { quality: 5, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 5 })
  const clone = ranked("clone", "Clone", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })

  it("prefers URL slugs when at least two are valid", () => {
    expect(defaultCompareSlugs([quiet, social], ["underdog", "foyer"])).toEqual(["underdog", "foyer"])
  })

  it("picks the two most different shapes when the URL is empty", () => {
    expect(defaultCompareSlugs([quiet, social, clone], [])).toEqual(["foyer", "underdog"])
  })

  it("ignores cafés without scores", () => {
    const bare: RankedCafe = { cafe: quiet.cafe, score: null, rankScore: null }
    expect(defaultCompareSlugs([bare, quiet, social], [])).toEqual(["foyer", "underdog"])
  })
})

describe("farthestPartner", () => {
  const quiet = ranked("foyer", "Foyer", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })
  const social = ranked("underdog", "Underdog", { quality: 5, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 5 })

  it("returns the most different scored café for a detail deep-link", () => {
    expect(farthestPartner([quiet, social], "foyer")).toBe("underdog")
  })

  it("returns null when the target has no scored counterpart", () => {
    const bare: RankedCafe = { cafe: quiet.cafe, score: null, rankScore: null }
    expect(farthestPartner([bare], "foyer")).toBeNull()
  })
})

describe("shapeTrio", () => {
  const quiet = ranked("foyer", "Foyer", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })
  const social = ranked("underdog", "Underdog", { quality: 5, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 5 })
  const clone = ranked("clone", "Clone", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })
  const wild = ranked("wild", "Wild", { quality: 1, priceValue: 1, workFriendliness: 5, quietVibe: 1, specialtyDepth: 1 })

  it("picks three disagreeing silhouettes deterministically", () => {
    const trio = shapeTrio([quiet, social, clone, wild])
    expect(trio.map((r) => r.cafe.slug)).toEqual(["foyer", "wild", "underdog"])
  })

  it("ignores unscored cafés and caps at three", () => {
    const bare: RankedCafe = { cafe: quiet.cafe, score: null, rankScore: null }
    expect(shapeTrio([bare, quiet, social]).map((r) => r.cafe.slug)).toEqual(["foyer", "underdog"])
  })
})
