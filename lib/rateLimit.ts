// D1-backed sliding-window rate limiter for the agent endpoints.
// A real boundary guard that works on Workers (in-memory maps don't).
import { nowIso, type SqlDb } from "@/lib/db/sql"

export const VERIFY_LIMIT_PER_MIN = 5
export const CONCIERGE_LIMIT_PER_MIN = 20

export async function rateLimit(
  db: SqlDb,
  key: string,
  max: number,
  windowMs = 60_000,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs).toISOString()
  // Drop the bucket if its window expired, then count this request.
  await db.run("delete from rate_limits where key = ? and window_start < ?", [key, cutoff])
  await db.run(
    `insert into rate_limits (key, window_start, count) values (?, ?, 1)
     on conflict (key) do update set count = count + 1`,
    [key, nowIso()],
  )
  const row = await db.get<{ count: number }>("select count from rate_limits where key = ?", [key])
  return (row?.count ?? 0) <= max
}

export const clientIp = (headers: Headers): string =>
  headers.get("cf-connecting-ip") ?? "unknown"
