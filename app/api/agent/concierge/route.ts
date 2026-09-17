import { NextResponse } from "next/server"
import { z } from "zod"
import { createLlmClient } from "@/lib/agent/client"
import { runConcierge } from "@/lib/agent/run"
import { getDb } from "@/lib/db/sql"
import { clientIp, CONCIERGE_LIMIT_PER_MIN, rateLimit } from "@/lib/rateLimit"

const MAX_HISTORY = 10

const ConciergeRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2_000),
      }),
    )
    .min(1)
    .max(20),
  cafeContext: z.string().max(500).optional(),
  locale: z.enum(["en", "el"]).optional(),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const parsed = ConciergeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", details: z.prettifyError(parsed.error) }, { status: 400 })
  }

  const db = await getDb()
  if (!(await rateLimit(db, `chat:${clientIp(req.headers)}`, CONCIERGE_LIMIT_PER_MIN))) {
    return NextResponse.json(
      { error: "too many messages — take a breath and try again in a minute" },
      { status: 429 },
    )
  }

  try {
    const llm = createLlmClient()
    const history = parsed.data.messages.slice(-MAX_HISTORY)
    const res = await runConcierge(
      { llm, db },
      {
        history,
        ...(parsed.data.cafeContext !== undefined && { cafeContext: parsed.data.cafeContext }),
        ...(parsed.data.locale !== undefined && { locale: parsed.data.locale }),
      },
    )
    return NextResponse.json({ content: res.content })
  } catch (e) {
    if (e instanceof Error && e.message.includes("LLM_API_KEY")) {
      return NextResponse.json(
        { error: "the concierge is not configured yet (LLM_API_KEY missing)" },
        { status: 503 },
      )
    }
    console.error("concierge route failed:", e)
    return NextResponse.json({ error: "the concierge is unavailable right now" }, { status: 500 })
  }
}
