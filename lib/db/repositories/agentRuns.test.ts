import { beforeEach, describe, expect, it } from "vitest"
import { AgentRunRepository } from "./agentRuns"
import { SubmissionRepository } from "./submissions"
import { createTestDb } from "./test-db"
import type { SqlDb } from "@/lib/db/sql"

describe("AgentRunRepository", () => {
  let db: SqlDb
  let repo: AgentRunRepository

  beforeEach(() => {
    db = createTestDb()
    repo = new AgentRunRepository(db)
  })

  it("create stores the run and parses it back", async () => {
    const run = await repo.create({
      mode: "verify_submission",
      toolCalls: [{ tool: "searchWeb", result: "ok" }],
      confidenceScore: 0.8,
      decision: "auto_verified",
      reasoning: "cafe exists, no duplicates",
    })

    expect(run.mode).toBe("verify_submission")
    expect(run.confidenceScore).toBe(0.8)
    expect(run.decision).toBe("auto_verified")
    expect(run.submissionId).toBeNull()
    // tool_calls is stored as JSON text and parsed back to an array
    expect(run.toolCalls).toEqual([{ tool: "searchWeb", result: "ok" }])
  })

  it("findBySubmission and listRecent work", async () => {
    const submissions = new SubmissionRepository(db)
    const sub = await submissions.create({ submittedName: "Kaya", submittedLocation: "A" })
    await repo.create({ mode: "verify_submission", submissionId: sub.id, decision: "rejected" })
    await repo.create({ mode: "concierge_chat" })

    const forSub = await repo.findBySubmission(sub.id)
    expect(forSub).toHaveLength(1)
    expect(forSub[0].decision).toBe("rejected")

    const recent = await repo.listRecent()
    expect(recent).toHaveLength(2)
  })

  it("stores nulls for optional fields", async () => {
    const run = await repo.create({ mode: "concierge_chat" })
    expect(run.confidenceScore).toBeNull()
    expect(run.decision).toBeNull()
    expect(run.toolCalls).toBeNull()
  })
})
