import { randomUUID } from "node:crypto"
import {
  parseAgentRunRow,
  type AgentRun,
  type AgentRunInput,
} from "@/lib/schemas/agentRun"
import { nowIso, type SqlDb } from "@/lib/db/sql"

export class AgentRunRepository {
  constructor(private db: SqlDb) {}

  async create(input: AgentRunInput): Promise<AgentRun> {
    const id = randomUUID()
    await this.db.run(
      `insert into agent_runs (
        id, submission_id, mode, tool_calls, confidence_score, decision, reasoning, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.submissionId ?? null,
        input.mode,
        input.toolCalls !== undefined ? JSON.stringify(input.toolCalls) : null,
        input.confidenceScore ?? null,
        input.decision ?? null,
        input.reasoning ?? null,
        nowIso(),
      ],
    )
    const created = await this.findById(id)
    if (!created) throw new Error("agentRuns.create: insert did not return a row")
    return created
  }

  async findById(id: string): Promise<AgentRun | null> {
    const row = await this.db.get("select * from agent_runs where id = ?", [id])
    return row ? parseAgentRunRow(row) : null
  }

  async findBySubmission(submissionId: string): Promise<AgentRun[]> {
    const rows = await this.db.all(
      "select * from agent_runs where submission_id = ? order by created_at desc",
      [submissionId],
    )
    return rows.map(parseAgentRunRow)
  }

  async listRecent(limit = 50): Promise<AgentRun[]> {
    const rows = await this.db.all(
      "select * from agent_runs order by created_at desc limit ?",
      [limit],
    )
    return rows.map(parseAgentRunRow)
  }
}
