import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { DraftRecordSchema } from "@/lib/agent/tools"
import { getDb } from "@/lib/db/sql"
import { promoteRecord } from "@/lib/pipeline/promote"

// Create a curated café from a draft record (curator assist "save").
export async function POST(req: Request) {
  const session = await requireAdmin(req.headers)
  if (!session) return NextResponse.json({ error: "not authorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const parsed = DraftRecordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid record" }, { status: 400 })
  }

  const db = await getDb()
  const cafe = await promoteRecord(db, {
    record: parsed.data,
    source: "owner",
    confidenceScore: null,
    verificationNotes: "curated by owner",
  })
  return NextResponse.json({ ok: true, cafeSlug: cafe.slug })
}
