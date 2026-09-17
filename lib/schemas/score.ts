import { z } from "zod"

export const SCORE_AXES = [
  "quality",
  "priceValue",
  "workFriendliness",
  "quietVibe",
  "specialtyDepth",
] as const
export type ScoreAxis = (typeof SCORE_AXES)[number]

export const CafeScoreSchema = z.object({
  cafeId: z.string().uuid(),
  scoredBy: z.enum(["curator", "public_avg"]),
  quality: z.number().min(1).max(5),
  priceValue: z.number().min(1).max(5),
  workFriendliness: z.number().min(1).max(5),
  quietVibe: z.number().min(1).max(5),
  specialtyDepth: z.number().min(1).max(5),
  // ISO timestamp of curator review completion; null = draft.
  scoresReviewedAt: z.string().nullable(),
})
export type CafeScore = z.infer<typeof CafeScoreSchema>

// Snake_case DB row → domain, parsed at the repository boundary.
export const CafeScoreRowSchema = z
  .object({
    cafe_id: z.string().uuid(),
    scored_by: z.enum(["curator", "public_avg"]),
    quality: z.number().min(1).max(5),
    price_value: z.number().min(1).max(5),
    work_friendliness: z.number().min(1).max(5),
    quiet_vibe: z.number().min(1).max(5),
    specialty_depth: z.number().min(1).max(5),
    scores_reviewed_at: z.string().nullable(),
  })
  .transform(
    (r): CafeScore => ({
      cafeId: r.cafe_id,
      scoredBy: r.scored_by,
      quality: r.quality,
      priceValue: r.price_value,
      workFriendliness: r.work_friendliness,
      quietVibe: r.quiet_vibe,
      specialtyDepth: r.specialty_depth,
      scoresReviewedAt: r.scores_reviewed_at,
    }),
  )

export const parseCafeScoreRow = (row: unknown): CafeScore =>
  CafeScoreRowSchema.parse(row)

// Zod schema for the per-axis scores a curator submits (no cafeId/scoredBy).
export const ScoreInputSchema = CafeScoreSchema.pick({
  quality: true,
  priceValue: true,
  workFriendliness: true,
  quietVibe: true,
  specialtyDepth: true,
})
export type ScoreInput = z.infer<typeof ScoreInputSchema>

// Admin save payload: scores plus an optional flag that marks the review complete.
export const ScoreSaveSchema = ScoreInputSchema.extend({
  markReviewed: z.boolean().optional(),
})
export type ScoreSave = z.infer<typeof ScoreSaveSchema>
