import { z } from "zod"

// Domain type (camelCase) — the shape the rest of the app uses.
export const CafeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  neighborhood: z.string().nullable(),
  priceTier: z.number().int().min(1).max(4),
  source: z.enum(["owner", "public_submission"]),
  status: z.enum(["draft", "verified", "flagged", "rejected"]),
  confidenceScore: z.number().min(0).max(1).nullable(),
  verificationNotes: z.string().nullable(),
})
export type Cafe = z.infer<typeof CafeSchema>

// DB row shape (snake_case) parsed at the repository boundary.
// Non-nullable timestamps are dropped from the domain type on purpose.
export const CafeRowSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    neighborhood: z.string().nullable(),
    price_tier: z.number().int().min(1).max(4),
    source: z.enum(["owner", "public_submission"]),
    status: z.enum(["draft", "verified", "flagged", "rejected"]),
    confidence_score: z.number().min(0).max(1).nullable(),
    verification_notes: z.string().nullable(),
  })
  .transform(
    (r): Cafe => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      neighborhood: r.neighborhood,
      priceTier: r.price_tier,
      source: r.source,
      status: r.status,
      confidenceScore: r.confidence_score,
      verificationNotes: r.verification_notes,
    }),
  )

export const parseCafeRow = (row: unknown): Cafe => CafeRowSchema.parse(row)

// New café record (what the agent or curator proposes): a Cafe without its id.
export const NewCafeSchema = CafeSchema.omit({ id: true })
export type NewCafe = z.infer<typeof NewCafeSchema>

// Editable fields for admin updates.
export const CafePatchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  priceTier: z.number().int().min(1).max(4).optional(),
  status: z.enum(["draft", "verified", "flagged", "rejected"]).optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  verificationNotes: z.string().nullable().optional(),
})
export type CafePatch = z.infer<typeof CafePatchSchema>
