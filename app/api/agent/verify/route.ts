import { NextResponse } from "next/server"
import { z } from "zod"
import { createLlmClient } from "@/lib/agent/client"
import { verifySubmission } from "@/lib/pipeline/verifySubmission"
import { getDb } from "@/lib/db/sql"
import { clientIp, rateLimit, VERIFY_LIMIT_PER_MIN } from "@/lib/rateLimit"
import { SubmissionInputSchema } from "@/lib/schemas/submission"

// Honeypot: bots fill hidden fields. Silently accept so they don't learn.
const VerifyRequestSchema = SubmissionInputSchema.extend({
  website: z.string().max(500).optional(), // honeypot
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const parsed = VerifyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", details: z.prettifyError(parsed.error) },
      { status: 400 },
    )
  }
  if (parsed.data.website) {
    // Pretend success — the bot's payload is discarded.
    return NextResponse.json({ status: "new", submissionId: null })
  }

  const db = await getDb()
  if (!(await rateLimit(db, `verify:${clientIp(req.headers)}`, VERIFY_LIMIT_PER_MIN))) {
    return NextResponse.json(
      { error: "too many submissions — try again in a minute" },
      { status: 429 },
    )
  }

  try {
    const llm = createLlmClient()
    const result = await verifySubmission(
      { llm, db },
      {
        submittedName: parsed.data.submittedName,
        submittedLocation: parsed.data.submittedLocation,
        submitterNote: parsed.data.submitterNote,
      },
    )
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof Error && e.message.includes("LLM_API_KEY")) {
      return NextResponse.json(
        { error: "the verifier is not configured yet (LLM_API_KEY missing)" },
        { status: 503 },
      )
    }
    console.error("verify route failed:", e)
    return NextResponse.json(
      { error: "verification is unavailable right now — please try again later" },
      { status: 500 },
    )
  }
}
