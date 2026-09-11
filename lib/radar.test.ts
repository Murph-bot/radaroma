import { describe, expect, it } from "vitest"
import {
  axisAngle,
  axisPoints,
  MAX_SCORE,
  polygonPoints,
  ringPoints,
  toSvgPoints,
} from "./radar"

const CX = 100
const CY = 100
const R = 80

describe("axisAngle", () => {
  it("starts at 12 o'clock", () => {
    expect(axisAngle(0, 5)).toBe(-Math.PI / 2)
  })

  it("spaces axes evenly", () => {
    expect(axisAngle(1, 5)).toBeCloseTo(-Math.PI / 2 + (2 * Math.PI) / 5)
  })
})

describe("polygonPoints", () => {
  it("maps max scores to full radius", () => {
    const pts = polygonPoints([MAX_SCORE, MAX_SCORE, MAX_SCORE, MAX_SCORE, MAX_SCORE], R, CX, CY)
    for (const p of pts) {
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeCloseTo(R, 5)
    }
  })

  it("maps min scores to one-fifth radius", () => {
    const pts = polygonPoints([1, 1, 1, 1, 1], R, CX, CY)
    for (const p of pts) {
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeCloseTo(R / 5, 5)
    }
  })

  it("clamps out-of-range values", () => {
    const pts = polygonPoints([9, -3, 3, 3, 3], R, CX, CY)
    expect(Math.hypot(pts[0].x - CX, pts[0].y - CY)).toBeCloseTo(R, 5)
    expect(Math.hypot(pts[1].x - CX, pts[1].y - CY)).toBeCloseTo(0, 5)
  })

  it("first vertex is at the top", () => {
    const pts = polygonPoints([3, 3, 3, 3, 3], R, CX, CY)
    expect(pts[0].x).toBeCloseTo(CX, 5)
    expect(pts[0].y).toBeCloseTo(CY - (3 / MAX_SCORE) * R, 5)
  })
})

describe("axisPoints / ringPoints", () => {
  it("axis vertices sit at full radius", () => {
    for (const p of axisPoints(5, R, CX, CY)) {
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeCloseTo(R, 5)
    }
  })

  it("ring points sit at the ring's scaled radius", () => {
    for (const p of ringPoints(3, 5, R, CX, CY)) {
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeCloseTo((3 / MAX_SCORE) * R, 5)
    }
  })
})

describe("toSvgPoints", () => {
  it("formats as x,y pairs", () => {
    expect(toSvgPoints([{ x: 1.5, y: 2.25 }])).toBe("1.50,2.25")
  })
})
