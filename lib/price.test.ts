import { describe, expect, it } from "vitest"
import { priceTierLabel, PRICE_TIER_LABELS } from "./price"

describe("priceTierLabel", () => {
  it("renders Attica prices in euro signs, not dollars", () => {
    expect(priceTierLabel(1)).toBe("€")
    expect(priceTierLabel(2)).toBe("€€")
    expect(priceTierLabel(3)).toBe("€€€")
    expect(priceTierLabel(4)).toBe("€€€€")
  })

  it("returns empty for unknown tiers", () => {
    expect(priceTierLabel(0)).toBe("")
    expect(priceTierLabel(5)).toBe("")
  })

  it("never includes a dollar sign", () => {
    for (const label of PRICE_TIER_LABELS) {
      expect(label).not.toContain("$")
    }
  })
})
