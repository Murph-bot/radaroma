import { z } from "zod"

export const AGENT_MODES = [
  "verify_submission",
  "concierge_chat",
  "curator_assist",
] as const
export type AgentMode = (typeof AGENT_MODES)[number]

export const AGENT_DECISIONS = [
  "auto_verified",
  "flagged_for_review",
  "rejected",
] as const
export type AgentDecision = (typeof AGENT_DECISIONS)[number]

export const AgentRunSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid().nullable(),
  mode: z.enum(AGENT_MODES),
  toolCalls: z.unknown().nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
  decision: z.enum(AGENT_DECISIONS).nullable(),
  reasoning: z.string().nullable(),
  createdAt: z.string(),
})
export type AgentRun = z.infer<typeof AgentRunSchema>

// Input recorded when an agent run completes.
export const AgentRunInputSchema = z.object({
  submissionId: z.string().uuid().nullable().optional(),
  mode: z.enum(AGENT_MODES),
  toolCalls: z.unknown().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  decision: z.enum(AGENT_DECISIONS).nullable().optional(),
  reasoning: z.string().nullable().optional(),
})
export type AgentRunInput = z.infer<typeof AgentRunInputSchema>

const safeParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const AgentRunRowSchema = z
  .object({
    id: z.string().uuid(),
    submission_id: z.string().uuid().nullable(),
    mode: z.enum(AGENT_MODES),
    tool_calls: z.unknown().nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
    decision: z.enum(AGENT_DECISIONS).nullable(),
    reasoning: z.string().nullable(),
    created_at: z.string(),
  })
  .transform(
    (r): AgentRun => ({
      id: r.id,
      submissionId: r.submission_id,
      mode: r.mode,
      // tool_calls is stored as a JSON string in D1
      toolCalls:
        typeof r.tool_calls === "string" ? safeParseJson(r.tool_calls) : r.tool_calls,
      confidenceScore: r.confidence_score,
      decision: r.decision,
      reasoning: r.reasoning,
      createdAt: r.created_at,
    }),
  )

export const parseAgentRunRow = (row: unknown): AgentRun =>
  AgentRunRowSchema.parse(row)
