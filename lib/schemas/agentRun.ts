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

export const AgentRunRowSchema = z
  .object({
    id: z.string().uuid(),
    submission_id: z.string().uuid().nullable(),
    mode: z.enum(AGENT_MODES),
    tool_calls: z.unknown().nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
    decision: z.enum(AGENT_DECISIONS).nullable(),
    reasoning: z.string().nullable(),
  })
  .transform(
    (r): AgentRun => ({
      id: r.id,
      submissionId: r.submission_id,
      mode: r.mode,
      toolCalls: r.tool_calls,
      confidenceScore: r.confidence_score,
      decision: r.decision,
      reasoning: r.reasoning,
    }),
  )

export const parseAgentRunRow = (row: unknown): AgentRun =>
  AgentRunRowSchema.parse(row)
