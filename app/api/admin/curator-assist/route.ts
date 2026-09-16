import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/auth"
import { createLlmClient } from "@/lib/agent/client"
import { runCuratorAssist } from "@/lib/agent/run"
import { getDb } from "@/lib/db/sql"

const CuratorAssistSchema = z.object({
  notes: z.string().min(1).max(5_000),
})

export async function POST(req: Request) {
  const session = await requireAdmin(req.headers)
  if (!session) return NextResponse.json({ error: "not authorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const parsed = CuratorAssistSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid request" }, { status: 400 })

  try {
    const llm = createLlmClient()
    const db = await getDb()
    const res = await runCuratorAssist(
      { llm, db, searchApiKey: process.env.SEARCH_API_KEY },
      { notes: parsed.data.notes },
    )
    return NextResponse.json(res)
  } catch (e) {
    if (e instanceof Error && e.message.includes("LLM_API_KEY")) {
      return NextResponse.json(
        { error: "curator assist is not configured yet (LLM_API_KEY missing)" },
        { status: 503 },
      )
    }
    console.error("curator-assist route failed:", e)
    return NextResponse.json({ error: "curator assist failed" }, { status: 500 })
  }
}
