// Shared "record -> verified café" step, used by the auto-verify pipeline
// and by the admin approve flow.
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { slugify, uniqueSlug } from "@/lib/slug"
import type { DraftRecord } from "@/lib/agent/tools"
import type { Cafe } from "@/lib/schemas/cafe"
import type { ScoreInput } from "@/lib/schemas/score"
import type { SqlDb } from "@/lib/db/sql"

export async function promoteRecord(
  db: SqlDb,
  input: {
    record: DraftRecord
    source: "owner" | "public_submission"
    confidenceScore: number | null
    verificationNotes: string | null
    scores?: ScoreInput
  },
): Promise<Cafe> {
  const cafes = new CafeRepository(db)
  const scores = new ScoreRepository(db)

  const base = slugify(input.record.name) || "cafe"
  const taken = new Set<string>()
  let slug = base
  while (await cafes.findBySlug(slug)) {
    taken.add(slug)
    slug = uniqueSlug(base, taken)
  }

  const cafe = await cafes.create({
    slug,
    name: input.record.name,
    address: input.record.address,
    lat: input.record.lat,
    lng: input.record.lng,
    neighborhood: input.record.neighborhood,
    priceTier: input.record.priceTier,
    source: input.source,
    status: "verified",
    confidenceScore: input.confidenceScore,
    verificationNotes: input.verificationNotes,
  })
  // LLM/pipeline numbers are drafts: they stay out of public ranking until an
  // admin marks them reviewed.
  await scores.upsertCurator(cafe.id, input.scores ?? input.record.scores, { reviewed: false })
  return cafe
}
