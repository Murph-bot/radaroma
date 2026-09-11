import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/sql"

// Runtime proof that the Worker → D1 binding → SQLite chain works.
export async function GET() {
  const db = await getDb()
  const row = await db.get<{ n: number }>("select count(*) as n from cafes")
  return NextResponse.json({ ok: true, db: "d1", cafes: row?.n ?? 0 })
}
