import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { Database } from "better-sqlite3"

// Minimal D1 types (wrangler injects the real binding at runtime; these are
// only the surface we use, so we don't need @cloudflare/workers-types).
export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement
  all(): Promise<{ results: unknown[] }>
  first(): Promise<unknown>
  run(): Promise<unknown>
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement
}

declare global {
  interface CloudflareEnv {
    DB: D1Database
  }
}

export type SqlParam = string | number | null

// The only database surface repositories depend on. Keeps D1 (production)
// and better-sqlite3 (tests, scripts) interchangeable.
export interface SqlDb {
  all<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T[]>
  get<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T | null>
  run(sql: string, params?: SqlParam[]): Promise<void>
}

// Production adapter: Cloudflare D1 binding, available in `next dev`
// (via initOpenNextCloudflareForDev), wrangler preview, and deployed.
export function d1Db(binding: D1Database): SqlDb {
  return {
    async all<T>(sql: string, params: SqlParam[] = []) {
      const res = await binding.prepare(sql).bind(...params).all()
      return res.results as T[]
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      const res = await binding.prepare(sql).bind(...params).first()
      return (res as T) ?? null
    },
    async run(sql: string, params: SqlParam[] = []) {
      await binding.prepare(sql).bind(...params).run()
    },
  }
}

// Local adapter: better-sqlite3 (in-memory or a D1 state file).
export function sqliteDb(db: Database): SqlDb {
  return {
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).all(...params) as T[]
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      return (db.prepare(sql).get(...params) as T) ?? null
    },
    async run(sql: string, params: SqlParam[] = []) {
      db.prepare(sql).run(...params)
    },
  }
}

// App-facing entry point. Only call inside Next.js server code (routes,
// server components, server actions) — never in tests or scripts.
export async function getDb(): Promise<SqlDb> {
  const { env } = await getCloudflareContext({ async: true })
  return d1Db(env.DB)
}

export const nowIso = (): string => new Date().toISOString()
