import { z } from "zod"
import { AgentRunRepository } from "@/lib/db/repositories/agentRuns"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import type { SqlDb } from "@/lib/db/sql"
import {
  AGENT_TOOLS,
  DraftRecordSchema,
  toolDefinitionsFor,
  type AgentTool,
  type AgentToolName,
  type DraftRecord,
} from "./tools"
import { conciergeSystemPrompt } from "./prompts/concierge"
import { VERIFY_SYSTEM_PROMPT, verifyUserPrompt } from "./prompts/verify"
import { CURATOR_ASSIST_SYSTEM_PROMPT, curatorAssistUserPrompt } from "./prompts/curatorAssist"
import type { AgentMode } from "@/lib/schemas/agentRun"
import type { ChatMessage, JsonSchemaSpec, LlmPort } from "./types"

export interface AgentDeps {
  llm: LlmPort
  db: SqlDb
  searchApiKey?: string
  maxToolRounds?: number
}

const MAX_TOOL_ROUNDS = 6

export const AUTO_VERIFY_THRESHOLD = 0.75
export const DUPLICATE_RADIUS_M = 200

// Extract a JSON object from model output: plain JSON, fenced JSON, or JSON
// embedded in prose (first balanced {...} span).
export function extractJson(text: string | null): unknown | null {
  if (!text) return null
  const stripped = text.replace(/```json|```/gi, "").trim()
  try {
    return JSON.parse(stripped)
  } catch {
    // fall through to span extraction
  }
  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(stripped.slice(start, end + 1))
  } catch {
    return null
  }
}

interface LoopResult {
  content: string | null
  toolLog: unknown[]
}

async function runToolLoop(
  deps: AgentDeps,
  opts: {
    system: string
    userMessages: ChatMessage[]
    toolNames: AgentToolName[]
    finalJsonSchema?: JsonSchemaSpec
  },
): Promise<LoopResult> {
  const { llm, db, searchApiKey, maxToolRounds = MAX_TOOL_ROUNDS } = deps
  const tools: AgentTool[] = opts.toolNames.map((n) => AGENT_TOOLS[n])
  const messages: ChatMessage[] = [
    { role: "system", content: opts.system },
    ...opts.userMessages,
  ]
  const toolLog: unknown[] = []

  for (let round = 0; round < maxToolRounds; round += 1) {
    const resp = await llm.complete({
      system: opts.system,
      messages,
      tools: toolDefinitionsFor(opts.toolNames),
    })

    if (resp.toolCalls.length === 0) {
      return { content: resp.content, toolLog }
    }

    messages.push({ role: "assistant", content: resp.content, toolCalls: resp.toolCalls })

    for (const tc of resp.toolCalls) {
      const tool = tools.find((t) => t.name === tc.name)
      let resultContent: string
      if (!tool) {
        resultContent = JSON.stringify({ error: `unknown tool: ${tc.name}` })
      } else {
        let args: unknown
        try {
          args = JSON.parse(tc.arguments)
        } catch {
          resultContent = JSON.stringify({ error: "invalid JSON arguments" })
          messages.push({ role: "tool", content: resultContent, toolCallId: tc.id })
          toolLog.push({ tool: tc.name, error: "invalid JSON arguments" })
          continue
        }
        const parsed = tool.inputSchema.safeParse(args)
        if (!parsed.success) {
          resultContent = JSON.stringify({
            error: `invalid arguments: ${z.prettifyError(parsed.error)}`,
          })
        } else {
          try {
            resultContent = JSON.stringify(await tool.execute(parsed.data, { db, searchApiKey }))
          } catch (e) {
            resultContent = JSON.stringify({
              error: e instanceof Error ? e.message : "tool execution failed",
            })
          }
        }
        let parsedResult: unknown
        try {
          parsedResult = JSON.parse(resultContent)
        } catch {
          parsedResult = resultContent
        }
        toolLog.push({ tool: tc.name, arguments: args, result: parsedResult })
      }
      messages.push({ role: "tool", content: resultContent, toolCallId: tc.id })
    }
  }

  // Tool rounds exhausted — force a final answer pass with no tools offered,
  // so the model must produce a verdict instead of investigating forever.
  const final = await deps.llm.complete({
    system: opts.system,
    messages,
    ...(opts.finalJsonSchema ? { jsonSchema: opts.finalJsonSchema } : {}),
  })
  return { content: final.content, toolLog }
}

async function logRun(
  deps: AgentDeps,
  opts: {
    mode: AgentMode
    submissionId?: string
    toolLog: unknown[]
    confidenceScore?: number | null
    decision?: string | null
    reasoning?: string | null
  },
): Promise<void> {
  await new AgentRunRepository(deps.db).create({
    mode: opts.mode,
    submissionId: opts.submissionId ?? null,
    toolCalls: opts.toolLog,
    confidenceScore: opts.confidenceScore ?? null,
    decision: (opts.decision as "auto_verified" | "flagged_for_review" | "rejected") ?? null,
    reasoning: opts.reasoning ?? null,
  })
}

// --- Mode 1: verify_submission -------------------------------------------

const VerifyOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  decision: z.enum(["auto_verified", "flagged_for_review", "rejected"]),
  reasoning: z.string().optional().default(""),
  // Nullable: a flagged/rejected verdict may legitimately carry no draft.
  record: DraftRecordSchema.nullable().optional().default(null),
})

// Provider-enforced verdict shape for tool-free verdict calls. Derived from
// the Zod schema so the wire contract can't drift from the parser.
const VERDICT_SCHEMA_SPEC = (() => {
  const full = z.toJSONSchema(VerifyOutputSchema) as Record<string, unknown>
  delete full.$schema
  return { name: "verify_verdict", schema: full }
})()

export interface VerifyOutcome {
  decision: "auto_verified" | "flagged_for_review" | "rejected"
  confidence: number | null
  reasoning: string | null
  record: DraftRecord | null
}

const FLAGGED: VerifyOutcome = {
  decision: "flagged_for_review",
  confidence: null,
  reasoning: "agent output could not be parsed",
  record: null,
}

export async function runVerify(
  deps: AgentDeps,
  input: { name: string; location: string; note?: string; submissionId?: string },
): Promise<VerifyOutcome> {
  const loop = await runToolLoop(deps, {
    system: VERIFY_SYSTEM_PROMPT,
    userMessages: [{ role: "user", content: verifyUserPrompt(input) }],
    toolNames: ["searchWeb", "fetchPage", "findNearbyCafes", "draftCafeRecord"],
    finalJsonSchema: VERDICT_SCHEMA_SPEC,
  })

  const raw = extractJson(loop.content)
  let parsed = raw ? VerifyOutputSchema.safeParse(raw) : null
  let verdictText = loop.content
  if (!parsed?.success) {
    // The investigation finished but the verdict wasn't valid JSON — give the
    // model one corrective pass with provider-enforced JSON output.
    const retry = await deps.llm.complete({
      system: VERIFY_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: verifyUserPrompt(input) },
        ...(loop.content
          ? [{ role: "assistant" as const, content: loop.content }]
          : []),
        {
          role: "user",
          content:
            "Now reply with ONLY the verdict JSON object described above (no fences, no commentary).",
        },
      ],
      jsonSchema: VERDICT_SCHEMA_SPEC,
    })
    verdictText = retry.content
    const retryRaw = extractJson(retry.content)
    parsed = retryRaw ? VerifyOutputSchema.safeParse(retryRaw) : null
  }
  let outcome: VerifyOutcome = parsed?.success
    ? {
        decision: parsed.data.decision,
        confidence: parsed.data.confidence,
        reasoning: parsed.data.reasoning || null,
        record: parsed.data.record,
      }
    : FLAGGED

  // Duplicate backstop: the pipeline checks independently of the agent.
  const record = outcome.record
  if (record && record.lat !== null && record.lng !== null) {
    const nearby = await new CafeRepository(deps.db).findNearby(
      record.lat,
      record.lng,
      DUPLICATE_RADIUS_M,
    )
    if (nearby.length > 0) {
      outcome = {
        ...outcome,
        decision: "flagged_for_review",
        reasoning: `${outcome.reasoning ?? ""} Possible duplicate within ${DUPLICATE_RADIUS_M}m: ${nearby
          .map((c) => c.name)
          .join(", ")}.`.trim(),
      }
    }
  }

  // Confidence gate: auto-verify only above threshold.
  if (
    outcome.decision === "auto_verified" &&
    (outcome.confidence ?? 0) < AUTO_VERIFY_THRESHOLD
  ) {
    outcome = {
      ...outcome,
      decision: "flagged_for_review",
      reasoning: `${outcome.reasoning ?? ""} Confidence ${outcome.confidence} below ${AUTO_VERIFY_THRESHOLD} threshold.`.trim(),
    }
  }

  await logRun(deps, {
    mode: "verify_submission",
    submissionId: input.submissionId,
    // Observability: append the raw verdict text so unparseable outputs are
    // debuggable from agent_runs instead of invisible.
    toolLog: [...loop.toolLog, { finalOutput: verdictText?.slice(0, 2_000) ?? null }],
    confidenceScore: outcome.confidence,
    decision: outcome.decision,
    reasoning: outcome.reasoning,
  })
  return outcome
}

// --- Mode 2: concierge_chat -----------------------------------------------

export interface ConciergeMessage {
  role: "user" | "assistant"
  content: string
}

export async function runConcierge(
  deps: AgentDeps,
  input: { history: ConciergeMessage[]; cafeContext?: string; locale?: "en" | "el" },
): Promise<{ content: string }> {
  const loop = await runToolLoop(deps, {
    system: conciergeSystemPrompt(input.cafeContext, input.locale),
    userMessages: input.history.map((m) => ({ role: m.role, content: m.content })),
    toolNames: ["queryCafesByWeights"],
  })
  await logRun(deps, { mode: "concierge_chat", toolLog: loop.toolLog })
  return {
    content:
      loop.content ||
      "I got tangled up in my notes — give me a moment and try again, or ask me to rank cafés by something specific.",
  }
}

// --- Mode 3: curator_assist -----------------------------------------------

export async function runCuratorAssist(
  deps: AgentDeps,
  input: { notes: string },
): Promise<{ content: string; record: DraftRecord | null }> {
  const loop = await runToolLoop(deps, {
    system: CURATOR_ASSIST_SYSTEM_PROMPT,
    userMessages: [{ role: "user", content: curatorAssistUserPrompt(input.notes) }],
    toolNames: ["fetchPage", "draftCafeRecord"],
  })
  const record = loop.toolLog
    .filter(
      (entry): entry is { tool: "draftCafeRecord"; result: unknown } =>
        (entry as { tool?: string }).tool === "draftCafeRecord",
    )
    .map((entry) => DraftRecordSchema.safeParse(entry.result))
    .reverse()
    .find((r): r is { success: true; data: DraftRecord } => r.success)
  await logRun(deps, {
    mode: "curator_assist",
    toolLog: loop.toolLog,
    reasoning: record ? "draft produced" : "no valid draft produced",
  })
  return { content: loop.content ?? "", record: record?.data ?? null }
}
