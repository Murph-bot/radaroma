// Server-side data access for public pages. The repositories are the only
// DB path, and these queries are the only public-facing reads — they hard
// filter to status='verified'.
import { getDb } from "@/lib/db/sql"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { DEFAULT_WEIGHTS, rankCafes, weightedScore, type RankedCafe } from "@/lib/ranking"

export async function getPublicCafes(): Promise<RankedCafe[]> {
  const db = await getDb()
  const cafes = new CafeRepository(db)
  const scores = new ScoreRepository(db)
  const all = await cafes.findVerified()
  const scoreMap = await scores.findForCafes(all.map((c) => c.id))
  return rankCafes(all, scoreMap, DEFAULT_WEIGHTS)
}

export async function getPublicCafe(slug: string): Promise<RankedCafe | null> {
  const db = await getDb()
  const cafes = new CafeRepository(db)
  const scores = new ScoreRepository(db)
  const cafe = await cafes.findBySlug(slug)
  if (!cafe || cafe.status !== "verified") return null
  const score = await scores.findForCafe(cafe.id)
  return {
    cafe,
    score,
    rankScore: score ? weightedScore(score, DEFAULT_WEIGHTS) : null,
  }
}
