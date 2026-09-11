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

  // Bulk fetch for list pages: returns scores keyed by cafeId.
  async findForCafes(cafeIds: string[]): Promise<Map<string, CafeScore>> {
    if (cafeIds.length === 0) return new Map()
    const placeholders = cafeIds.map(() => "?").join(", ")
    const rows = await this.db.all(
      `select * from cafe_scores where cafe_id in (${placeholders}) and scored_by = 'curator'`,
      cafeIds,
    )
    return new Map(rows.map((row) => [row.cafe_id as string, parseCafeScoreRow(row)]))
  }

  async upsertCurator(cafeId: string, input: ScoreInput): Promise<CafeScore> {
    await this.db.run(
      `insert into cafe_scores (
        id, cafe_id, scored_by, quality, price_value, work_friendliness,
        quiet_vibe, specialty_depth, updated_at
      ) values (?, ?, 'curator', ?, ?, ?, ?, ?, ?)
      on conflict (cafe_id, scored_by) do update set
        quality = excluded.quality,
        price_value = excluded.price_value,
        work_friendliness = excluded.work_friendliness,
        quiet_vibe = excluded.quiet_vibe,
        specialty_depth = excluded.specialty_depth,
        updated_at = excluded.updated_at`,
      [
        randomUUID(),
        cafeId,
        input.quality,
        input.priceValue,
        input.workFriendliness,
        input.quietVibe,
        input.specialtyDepth,
        nowIso(),
      ],
    )
    const saved = await this.findForCafe(cafeId)
    if (!saved) throw new Error("scores.upsertCurator: row not found after upsert")
    return saved
  }
}
