import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/auth"
import { AgentRunRepository } from "@/lib/db/repositories/agentRuns"
import { SubmissionRepository } from "@/lib/db/repositories/submissions"
import { getDb } from "@/lib/db/sql"
import { draftFromRuns } from "@/lib/pipeline/draftFromRuns"
import { promoteRecord } from "@/lib/pipeline/promote"
import { ScoreInputSchema } from "@/lib/schemas/score"

const ActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  scores: ScoreInputSchema.optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin(req.headers)
  if (!session) return NextResponse.json({ error: "not authorized" }, { status: 401 })

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const db = await getDb()
  const submissions = new SubmissionRepository(db)
  const submission = await submissions.findById(id)
  if (!submission) return NextResponse.json({ error: "submission not found" }, { status: 404 })

  if (parsed.data.action === "reject") {
    await submissions.updateStatus(id, "rejected")
    return NextResponse.json({ ok: true })
  }

  if (submission.status !== "flagged" && submission.status !== "agent_reviewing") {
    return NextResponse.json(
      { error: `submission is already ${submission.status}` },
      { status: 409 },
    )
  }

  const runs = await new AgentRunRepository(db).findBySubmission(id)
  const record = draftFromRuns(runs)
  if (!record) {
    return NextResponse.json(
      { error: "no draft record from the agent — use curator assist instead" },
      { status: 422 },
    )
  }

  const cafe = await promoteRecord(db, {
    record,
    source: "public_submission",
    confidenceScore: runs[0]?.confidenceScore ?? null,
    verificationNotes: runs[0]?.reasoning ?? "approved by curator",
    scores: parsed.data.scores,
  })
  await submissions.updateStatus(id, "promoted", cafe.id)
  return NextResponse.json({ ok: true, cafeSlug: cafe.slug })
}
