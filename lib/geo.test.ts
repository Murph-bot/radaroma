import { describe, expect, it } from "vitest"
import { haversineMeters } from "./geo"

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(37.98, 23.73, 37.98, 23.73)).toBe(0)
  })

  it("approximates 1 degree of latitude (~111.2 km)", () => {
    const d = haversineMeters(0, 0, 1, 0)
    expect(d).toBeGreaterThan(110_000)
    expect(d).toBeLessThan(112_000)
  })

  it("is symmetric", () => {
    const a = haversineMeters(37.9715, 23.7267, 37.9757, 23.734)
    const b = haversineMeters(37.9757, 23.734, 37.9715, 23.7267)
    expect(a).toBeCloseTo(b, 6)
  })

  it("gives a sane distance for two Athens points (~790 m)", () => {
    // Acropolis → Syntagma square
    const d = haversineMeters(37.9715, 23.7267, 37.9757, 23.734)
    expect(d).toBeGreaterThan(600)
    expect(d).toBeLessThan(1_000)
  })
})
