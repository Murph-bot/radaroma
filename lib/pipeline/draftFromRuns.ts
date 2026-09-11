// Recover the agent's last draftCafeRecord output from stored agent runs —
// used by the admin approve flow.
import { DraftRecordSchema, type DraftRecord } from "@/lib/agent/tools"
import type { AgentRun } from "@/lib/schemas/agentRun"

export function draftFromRuns(runs: AgentRun[]): DraftRecord | null {
  for (const run of runs) {
    if (!Array.isArray(run.toolCalls)) continue
    for (const call of [...run.toolCalls].reverse()) {
      const c = call as { tool?: string; result?: unknown }
      if (c.tool === "draftCafeRecord") {
        const parsed = DraftRecordSchema.safeParse(c.result)
        if (parsed.success) return parsed.data
      }
    }
  }
  return null
}
