import { randomUUID } from "node:crypto"
import {
  parseCafeScoreRow,
  type CafeScore,
  type ScoreInput,
} from "@/lib/schemas/score"
import { nowIso, type SqlDb } from "@/lib/db/sql"

export class ScoreRepository {
  constructor(private db: SqlDb) {}

  async findForCafe(cafeId: string): Promise<CafeScore | null> {
    const row = await this.db.get(
      "select * from cafe_scores where cafe_id = ? and scored_by = 'curator'",
      [cafeId],
    )
    return row ? parseCafeScoreRow(row) : null
  }

  // Public detail page: curator score only once review is complete.
  async findReviewedForCafe(cafeId: string): Promise<CafeScore | null> {
    const row = await this.db.get(
      "select * from cafe_scores where cafe_id = ? and scored_by = 'curator' and scores_reviewed_at is not null",
      [cafeId],
    )
    return row ? parseCafeScoreRow(row) : null
  }

  // Bulk fetch for admin/list pages: returns scores keyed by cafeId.
  async findForCafes(cafeIds: string[]): Promise<Map<string, CafeScore>> {
    return this.bulk(cafeIds, false)
  }

  // Bulk fetch for PUBLIC ranking: drafts (scores_reviewed_at is null) are
  // left out so unreviewed numbers can never steer a public list.
  async findReviewedForCafes(cafeIds: string[]): Promise<Map<string, CafeScore>> {
    return this.bulk(cafeIds, true)
  }

  private async bulk(cafeIds: string[], reviewedOnly: boolean): Promise<Map<string, CafeScore>> {
    if (cafeIds.length === 0) return new Map()
    const placeholders = cafeIds.map(() => "?").join(", ")
    const gate = reviewedOnly ? " and scores_reviewed_at is not null" : ""
    const rows = await this.db.all(
      `select * from cafe_scores where cafe_id in (${placeholders}) and scored_by = 'curator'${gate}`,
      cafeIds,
    )
    return new Map(rows.map((row) => [row.cafe_id as string, parseCafeScoreRow(row)]))
  }

  // Review state on save:
  //   reviewed: true      → set scores_reviewed_at = now (curator approved these numbers)
  //   reviewed: false     → clear it (numbers changed; needs another human pass)
  //   reviewed: undefined → keep whatever is there (seed/pipeline writes never touch review state)
  async upsertCurator(
    cafeId: string,
    input: ScoreInput,
    opts: { reviewed?: boolean } = {},
  ): Promise<CafeScore> {
    const now = nowIso()
    const reviewedAt = opts.reviewed ? now : null
    const reviewedSql =
      opts.reviewed === undefined
        ? "cafe_scores.scores_reviewed_at"
        : "excluded.scores_reviewed_at"
    await this.db.run(
      `insert into cafe_scores (
        id, cafe_id, scored_by, quality, price_value, work_friendliness,
        quiet_vibe, specialty_depth, updated_at, scores_reviewed_at
      ) values (?, ?, 'curator', ?, ?, ?, ?, ?, ?, ?)
      on conflict (cafe_id, scored_by) do update set
        quality = excluded.quality,
        price_value = excluded.price_value,
        work_friendliness = excluded.work_friendliness,
        quiet_vibe = excluded.quiet_vibe,
        specialty_depth = excluded.specialty_depth,
        updated_at = excluded.updated_at,
        scores_reviewed_at = ${reviewedSql}`,
      [
        randomUUID(),
        cafeId,
        input.quality,
        input.priceValue,
        input.workFriendliness,
        input.quietVibe,
        input.specialtyDepth,
        now,
        reviewedAt,
      ],
    )
    const saved = await this.findForCafe(cafeId)
    if (!saved) throw new Error("scores.upsertCurator: row not found after upsert")
    return saved
  }
}
