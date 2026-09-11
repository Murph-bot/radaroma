// Pure geometry for the radar chart. Component-free so it is unit-testable.
import type { ScoreAxis } from "@/lib/schemas/score"

export const AXIS_LABELS: Record<ScoreAxis, string> = {
  quality: "Quality",
  priceValue: "Value",
  workFriendliness: "Work",
  quietVibe: "Quiet",
  specialtyDepth: "Specialty",
}

export const MAX_SCORE = 5

export interface RadarPoint {
  x: number
  y: number
}

// Angle of axis i in a regular n-gon, starting at 12 o'clock, going clockwise.
export const axisAngle = (index: number, n: number): number =>
  -Math.PI / 2 + (index * 2 * Math.PI) / n

export const pointAt = (
  radius: number,
  angle: number,
  centerX: number,
  centerY: number,
): RadarPoint => ({
  x: centerX + radius * Math.cos(angle),
  y: centerY + radius * Math.sin(angle),
})

// Polygon for a set of scores (each 0..MAX_SCORE), scaled by radius.
export function polygonPoints(
  values: number[],
  radius: number,
  centerX: number,
  centerY: number,
): RadarPoint[] {
  const n = values.length
  return values.map((value, i) =>
    pointAt((Math.max(0, Math.min(MAX_SCORE, value)) / MAX_SCORE) * radius, axisAngle(i, n), centerX, centerY),
  )
}

// Full-radius vertices of the axes (for drawing axis lines and labels).
export function axisPoints(
  n: number,
  radius: number,
  centerX: number,
  centerY: number,
): RadarPoint[] {
  return Array.from({ length: n }, (_, i) =>
    pointAt(radius, axisAngle(i, n), centerX, centerY),
  )
}

// Points of a score ring (for the grid), radius scaled by the ring value.
export function ringPoints(
  ringValue: number,
  n: number,
  radius: number,
  centerX: number,
  centerY: number,
): RadarPoint[] {
  const r = (ringValue / MAX_SCORE) * radius
  return Array.from({ length: n }, (_, i) => pointAt(r, axisAngle(i, n), centerX, centerY))
}

export const toSvgPoints = (points: RadarPoint[]): string =>
  points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
