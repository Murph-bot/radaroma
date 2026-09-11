import { AgentRunRepository } from "@/lib/db/repositories/agentRuns"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { SubmissionRepository } from "@/lib/db/repositories/submissions"
import { getDb } from "@/lib/db/sql"
import { draftFromRuns } from "@/lib/pipeline/draftFromRuns"
import type { DraftRecord } from "@/lib/agent/tools"
import type { AgentRun } from "@/lib/schemas/agentRun"
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore } from "@/lib/schemas/score"
import type { Submission } from "@/lib/schemas/submission"

export interface AdminDashboardData {
  flagged: { submission: Submission; draft: DraftRecord | null; reasoning: string | null }[]
  cafes: { cafe: Cafe; score: CafeScore | null }[]
  runs: AgentRun[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const db = await getDb()
  const submissions = new SubmissionRepository(db)
  const runsRepo = new AgentRunRepository(db)

  const flaggedSubs = await submissions.findByStatus("flagged")
  const flagged = await Promise.all(
    flaggedSubs.map(async (submission) => {
      const runs = await runsRepo.findBySubmission(submission.id)
      return {
        submission,
        draft: draftFromRuns(runs),
        reasoning: runs[0]?.reasoning ?? null,
      }
    }),
  )

  const cafes = await new CafeRepository(db).findVerified()
  const scoreMap = await new ScoreRepository(db).findForCafes(cafes.map((c) => c.id))
  const runs = await runsRepo.listRecent(20)

  return {
    flagged,
    cafes: cafes.map((cafe) => ({ cafe, score: scoreMap.get(cafe.id) ?? null })),
    runs,
  }
}
