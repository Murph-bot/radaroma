import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseCafeScoreRow,
  type CafeScore,
  type ScoreInput,
} from "@/lib/schemas/score"

export class ScoreRepository {
  constructor(private client: SupabaseClient) {}

  async findForCafe(cafeId: string): Promise<CafeScore | null> {
    const { data, error } = await this.client
      .from("cafe_scores")
      .select("*")
      .eq("cafe_id", cafeId)
      .eq("scored_by", "curator")
      .maybeSingle()
    if (error) throw new Error(`scores.findForCafe: ${error.message}`)
    return data ? parseCafeScoreRow(data) : null
  }

  // Bulk fetch for list pages: returns scores keyed by cafeId.
  async findForCafes(cafeIds: string[]): Promise<Map<string, CafeScore>> {
    if (cafeIds.length === 0) return new Map()
    const { data, error } = await this.client
      .from("cafe_scores")
      .select("*")
      .in("cafe_id", cafeIds)
      .eq("scored_by", "curator")
    if (error) throw new Error(`scores.findForCafes: ${error.message}`)
    return new Map((data ?? []).map((row) => [row.cafe_id, parseCafeScoreRow(row)]))
  }

  async upsertCurator(cafeId: string, input: ScoreInput): Promise<CafeScore> {
    const { data, error } = await this.client
      .from("cafe_scores")
      .upsert(
        {
          cafe_id: cafeId,
          scored_by: "curator",
          quality: input.quality,
          price_value: input.priceValue,
          work_friendliness: input.workFriendliness,
          quiet_vibe: input.quietVibe,
          specialty_depth: input.specialtyDepth,
        },
        { onConflict: "cafe_id,scored_by" },
      )
      .select()
      .single()
    if (error) throw new Error(`scores.upsertCurator: ${error.message}`)
    return parseCafeScoreRow(data)
  }
}
