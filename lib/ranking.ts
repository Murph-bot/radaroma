// Weighted ranking: the single source of truth for "how should the list be
// ordered". Used by the UI sliders AND the agent's queryCafesByWeights tool.
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore, ScoreAxis } from "@/lib/schemas/score"

export type Weights = Record<ScoreAxis, number>

export const SCORE_AXES: ScoreAxis[] = [
  "quality",
  "priceValue",
  "workFriendliness",
  "quietVibe",
  "specialtyDepth",
]

export const DEFAULT_WEIGHTS: Weights = {
  quality: 1,
  priceValue: 1,
  workFriendliness: 1,
  quietVibe: 1,
  specialtyDepth: 1,
}

export interface RankedCafe {
  cafe: Cafe
  score: CafeScore | null
  // Weighted average on the 1-5 scale (null when no score exists).
  rankScore: number | null
}

export function scoreForAxis(score: CafeScore, axis: ScoreAxis): number {
  return score[axis]
}

// Weighted average of the score axes. Clamped to 1-5.
export function weightedScore(score: CafeScore, weights: Weights): number {
  const totalWeight = SCORE_AXES.reduce((sum, axis) => sum + weights[axis], 0)
  if (totalWeight === 0) return 0
  const weighted = SCORE_AXES.reduce((sum, axis) => sum + weights[axis] * score[axis], 0)
  return weighted / totalWeight
}

// Rank a set of cafés against their scores. Cafés without a score sort last,
// ties break alphabetically by name.
export function rankCafes(
  cafes: Cafe[],
  scores: Map<string, CafeScore>,
  weights: Weights = DEFAULT_WEIGHTS,
): RankedCafe[] {
  const ranked: RankedCafe[] = cafes.map((cafe) => {
    const score = scores.get(cafe.id) ?? null
    return {
      cafe,
      score,
      rankScore: score ? weightedScore(score, weights) : null,
    }
  })
  ranked.sort((a, b) => {
    if (a.rankScore === null && b.rankScore === null) return a.cafe.name.localeCompare(b.cafe.name)
    if (a.rankScore === null) return 1
    if (b.rankScore === null) return -1
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore
    return a.cafe.name.localeCompare(b.cafe.name)
  })
  return ranked
}
