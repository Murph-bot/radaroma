import { describe, expect, it } from "vitest"
import { curatorBlurb } from "./blurb"

describe("curatorBlurb", () => {
  it("strips draft disclaimers so public pages do not say scores estimate", () => {
    expect(
      curatorBlurb("championship-linked house roaster with brunch, courtyard, and retail; scores estimate"),
    ).toBe("championship-linked house roaster with brunch, courtyard, and retail.")
  })

  it("strips approximate-coords disclaimers", () => {
    expect(
      curatorBlurb("roastery-backed specialty boutique on Kifisia's main avenue; coords approximate; scores estimate"),
    ).toBe("roastery-backed specialty boutique on Kifisia's main avenue.")
  })

  it("returns null for empty or disclaimer-only notes", () => {
    expect(curatorBlurb(null)).toBeNull()
    expect(curatorBlurb("scores estimate")).toBeNull()
    expect(curatorBlurb("; coords approximate; scores estimate")).toBeNull()
  })
})
