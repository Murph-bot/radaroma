import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { getDb } from "@/lib/db/sql"
import { ScoreSaveSchema } from "@/lib/schemas/score"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin(req.headers)
  if (!session) return NextResponse.json({ error: "not authorized" }, { status: 401 })

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const parsed = ScoreSaveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid scores" }, { status: 400 })

  const db = await getDb()
  const cafe = await new CafeRepository(db).findById(id)
  if (!cafe) return NextResponse.json({ error: "café not found" }, { status: 404 })

  // Saving without markReviewed is a draft edit: it resets any prior review.
  const { markReviewed, ...scores } = parsed.data
  const saved = await new ScoreRepository(db).upsertCurator(id, scores, {
    reviewed: markReviewed === true,
  })
  return NextResponse.json({ ok: true, scoresReviewedAt: saved.scoresReviewedAt })
}
