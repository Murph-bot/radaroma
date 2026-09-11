import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseAgentRunRow,
  type AgentRun,
  type AgentRunInput,
} from "@/lib/schemas/agentRun"

export class AgentRunRepository {
  constructor(private client: SupabaseClient) {}

  async create(input: AgentRunInput): Promise<AgentRun> {
    const { data, error } = await this.client
      .from("agent_runs")
      .insert({
        submission_id: input.submissionId ?? null,
        mode: input.mode,
        tool_calls: input.toolCalls ?? null,
        confidence_score: input.confidenceScore ?? null,
        decision: input.decision ?? null,
        reasoning: input.reasoning ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(`agentRuns.create: ${error.message}`)
    return parseAgentRunRow(data)
  }

  async findBySubmission(submissionId: string): Promise<AgentRun[]> {
    const { data, error } = await this.client
      .from("agent_runs")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
    if (error) throw new Error(`agentRuns.findBySubmission: ${error.message}`)
    return (data ?? []).map(parseAgentRunRow)
  }

  async listRecent(limit = 50): Promise<AgentRun[]> {
    const { data, error } = await this.client
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw new Error(`agentRuns.listRecent: ${error.message}`)
    return (data ?? []).map(parseAgentRunRow)
  }
}
