import { describe, expect, it } from "vitest"
import { slugify, uniqueSlug } from "./slug"

describe("slugify", () => {
  it("kebab-cases names", () => {
    expect(slugify("TAF Coffee")).toBe("taf-coffee")
    expect(slugify("Little Tree Books & Coffee")).toBe("little-tree-books-and-coffee")
  })

  it("strips diacritics", () => {
    expect(slugify("Café Ávissinia")).toBe("cafe-avissinia")
  })

  it("handles edge cases", () => {
    expect(slugify("  Café   !! ")).toBe("cafe")
    expect(slugify("123")).toBe("123")
    expect(slugify("")).toBe("")
  })
})

describe("uniqueSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueSlug("taf-coffee", new Set(["other"]))).toBe("taf-coffee")
  })

  it("appends counters when taken", () => {
    const taken = new Set(["taf-coffee", "taf-coffee-2"])
    expect(uniqueSlug("taf-coffee", taken)).toBe("taf-coffee-3")
  })
})
