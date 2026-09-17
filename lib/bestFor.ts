// "Best for" chips — inferred from the five curator scores, no new columns.
// An axis at 4+ earns a chip; ids are stable for tests and styling hooks.
import { SCORE_AXES, type CafeScore, type ScoreAxis } from "@/lib/schemas/score"

export type BestForChip = "quality" | "value" | "laptop" | "quiet" | "filter"

const CHIP_FOR_AXIS: Record<ScoreAxis, BestForChip> = {
  quality: "quality",
  priceValue: "value",
  workFriendliness: "laptop",
  quietVibe: "quiet",
  specialtyDepth: "filter",
}

export const BEST_FOR_LABELS: Record<BestForChip, string> = {
  quality: "Top cup",
  value: "Good value",
  laptop: "Laptop-friendly",
  quiet: "Quiet",
  filter: "Filter program",
}

const THRESHOLD = 4

export function bestForChips(score: CafeScore): BestForChip[] {
  return SCORE_AXES.filter((axis) => score[axis] >= THRESHOLD).map((axis) => CHIP_FOR_AXIS[axis])
}
