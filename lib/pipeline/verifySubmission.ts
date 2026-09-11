// The public-submission pipeline: insert submission -> run the verify agent
// -> route by outcome. Testable with a FakeLlm + test DB; the API route is
// just a thin shell around this.
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { SubmissionRepository } from "@/lib/db/repositories/submissions"
import { slugify, uniqueSlug } from "@/lib/slug"
import type { SubmissionInput } from "@/lib/schemas/submission"
import type { AgentDeps, VerifyOutcome } from "@/lib/agent/run"
import { runVerify } from "@/lib/agent/run"

export type VerifySubmissionResult =
  | { status: "verified"; cafeSlug: string; submissionId: string }
  | { status: "flagged"; submissionId: string; reasoning: string | null }
  | { status: "rejected"; submissionId: string; reasoning: string | null }

// Fail-open: any pipeline error becomes "flagged" so a human curator
// reviews it — a submission is never silently dropped.
export async function verifySubmission(
  deps: AgentDeps,
  input: SubmissionInput,
): Promise<VerifySubmissionResult> {
  const submissions = new SubmissionRepository(deps.db)
  const cafes = new CafeRepository(deps.db)
  const scores = new ScoreRepository(deps.db)

  const submission = await submissions.create(input)
  await submissions.updateStatus(submission.id, "agent_reviewing")

  let outcome: VerifyOutcome
  try {
    outcome = await runVerify(deps, {
      name: input.submittedName,
      location: input.submittedLocation,
      note: input.submitterNote,
      submissionId: submission.id,
    })
  } catch (e) {
    const reasoning = `pipeline error: ${e instanceof Error ? e.message : "unknown"}`
    await submissions.updateStatus(submission.id, "flagged")
    return { status: "flagged", submissionId: submission.id, reasoning }
  }

  if (outcome.decision === "auto_verified" && outcome.record) {
    const record = outcome.record
    // Unique slug against existing cafés.
    const base = slugify(record.name) || "cafe"
    const taken = new Set<string>()
    let slug = base
    while (await cafes.findBySlug(slug)) {
      taken.add(slug)
      slug = uniqueSlug(base, taken)
    }

    const cafe = await cafes.create({
      slug,
      name: record.name,
      address: record.address,
      lat: record.lat,
      lng: record.lng,
      neighborhood: record.neighborhood,
      priceTier: record.priceTier,
      source: "public_submission",
      status: "verified",
      confidenceScore: outcome.confidence,
      verificationNotes: outcome.reasoning,
    })
    await scores.upsertCurator(cafe.id, record.scores)
    await submissions.updateStatus(submission.id, "promoted", cafe.id)
    return { status: "verified", cafeSlug: cafe.slug, submissionId: submission.id }
  }

  if (outcome.decision === "rejected") {
    await submissions.updateStatus(submission.id, "rejected")
    return { status: "rejected", submissionId: submission.id, reasoning: outcome.reasoning }
  }

  await submissions.updateStatus(submission.id, "flagged")
  return { status: "flagged", submissionId: submission.id, reasoning: outcome.reasoning }
}
