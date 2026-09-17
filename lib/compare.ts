// Shape distance between cafés — Euclidean over the five score axes.
// Powers the compare page default pair, the detail-page compare deep-link,
// and the homepage "three disagreeing shapes" trio.
import { SCORE_AXES, type CafeScore, type ScoreAxis } from "@/lib/schemas/score"
import type { RankedCafe } from "./ranking"

const MAX_COMPARE = 3

type Scored = RankedCafe & { score: CafeScore }
type AxisValues = Record<ScoreAxis, number>

export function radarDistance(a: AxisValues, b: AxisValues): number {
  let sum = 0
  for (const axis of SCORE_AXES) {
    const d = a[axis] - b[axis]
    sum += d * d
  }
  return Math.sqrt(sum)
}

const scoredOnly = (ranked: RankedCafe[]): Scored[] =>
  ranked.filter((r): r is Scored => r.score !== null)

// The pair of scored cafés whose radar shapes differ most. Ties go to the
// lexicographically greatest sorted (slugA, slugB) tuple — deterministic
// regardless of input order.
function maxDistancePair(list: Scored[]): [Scored, Scored] | null {
  let best: [Scored, Scored] | null = null
  let bestDist = -1
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const d = radarDistance(list[i].score, list[j].score)
      if (d > bestDist) {
        best = [list[i], list[j]]
        bestDist = d
      } else if (d === bestDist && best) {
        const a = [best[0].cafe.slug, best[1].cafe.slug].sort()
        const b = [list[i].cafe.slug, list[j].cafe.slug].sort()
        if (b[0] > a[0] || (b[0] === a[0] && b[1] > a[1])) best = [list[i], list[j]]
      }
    }
  }
  return best
}

// Which cafés the compare page should open with. Explicit ?cafes= slugs win
// when at least two are valid (order kept, capped at 3); otherwise the two
// most different scored shapes, sorted by slug.
export function defaultCompareSlugs(ranked: RankedCafe[], urlSlugs: string[]): string[] {
  const known = new Set(ranked.map((r) => r.cafe.slug))
  const valid = [...new Set(urlSlugs)].filter((s) => known.has(s))
  if (valid.length >= 2) return valid.slice(0, MAX_COMPARE)
  const pair = maxDistancePair(scoredOnly(ranked))
  return pair ? [pair[0].cafe.slug, pair[1].cafe.slug].sort() : []
}

// Detail-page "Compare" target: the scored café most different from this one.
export function farthestPartner(ranked: RankedCafe[], slug: string): string | null {
  const list = scoredOnly(ranked)
  const target = list.find((r) => r.cafe.slug === slug)
  if (!target) return null
  let best: Scored | null = null
  let bestDist = -1
  for (const r of list) {
    if (r.cafe.slug === slug) continue
    const d = radarDistance(target.score, r.score)
    if (d > bestDist) {
      best = r
      bestDist = d
    }
  }
  return best?.cafe.slug ?? null
}

// Three cafés whose shapes disagree most: the max-distance pair plus the
// café farthest from both. Ties keep input order. Used for the homepage
// "three shapes" strip — not a ranking, a showcase of different profiles.
export function shapeTrio(ranked: RankedCafe[]): RankedCafe[] {
  const list = scoredOnly(ranked)
  const pair = maxDistancePair(list)
  if (!pair) return list.slice(0, 1)
  let third: Scored | null = null
  let thirdDist = -1
  for (const r of list) {
    if (r === pair[0] || r === pair[1]) continue
    const d = Math.min(radarDistance(r.score, pair[0].score), radarDistance(r.score, pair[1].score))
    if (d > thirdDist) {
      third = r
      thirdDist = d
    }
  }
  return third ? [pair[0], pair[1], third] : [...pair]
}
