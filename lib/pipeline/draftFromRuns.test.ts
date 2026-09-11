import { describe, expect, it } from "vitest"
import type { AgentRun } from "@/lib/schemas/agentRun"
import { draftFromRuns } from "./draftFromRuns"

const run = (toolCalls: unknown[]): AgentRun => ({
  id: "11111111-1111-4111-8111-111111111111",
  submissionId: null,
  mode: "verify_submission",
  toolCalls,
  confidenceScore: 0.9,
  decision: "auto_verified",
  reasoning: "ok",
  createdAt: "2026-09-12T00:00:00.000Z",
})

const record = {
  name: "Draft Place",
  address: "Street 1",
  priceTier: 2,
  scores: { quality: 4, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 4 },
}

describe("draftFromRuns", () => {
  it("extracts the last valid draftCafeRecord result", () => {
    const runs = [
      run([
        { tool: "draftCafeRecord", result: { ...record, name: "First Draft" } },
        { tool: "searchWeb", result: { error: "no key" } },
        { tool: "draftCafeRecord", result: { ...record, name: "Second Draft" } },
      ]),
    ]
    expect(draftFromRuns(runs)?.name).toBe("Second Draft")
  })

  it("ignores invalid drafts and returns null when none are valid", () => {
    expect(draftFromRuns([run([{ tool: "draftCafeRecord", result: { name: "x" } }])])).toBeNull()
    expect(draftFromRuns([run([{ tool: "searchWeb", result: {} }])])).toBeNull()
    expect(draftFromRuns([])).toBeNull()
  })
})
