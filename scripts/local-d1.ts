import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import Database from "better-sqlite3"
import { sqliteDb, type SqlDb } from "../lib/db/sql"

// Find the actual D1 database file under .wrangler/state/v3/d1/ — the name
// is a content hash, so we scan for *.sqlite files that aren't miniflare
// metadata or WAL/SHM sidecars.
export function findLocalD1Db(): string {
  const base = ".wrangler/state/v3/d1"
  if (!existsSync(base)) return ""
  const walk = (dir: string): string => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        const found = walk(full)
        if (found) return found
      } else if (entry.endsWith(".sqlite") && entry !== "metadata.sqlite") {
        return full
      }
    }
    return ""
  }
  return walk(base)
}

// Open the local D1 database as a SqlDb. Throws with a hint if the local
// database hasn't been created yet (`npm run db:migrate:local`).
export function openLocalD1(): SqlDb {
  const dbFile = findLocalD1Db()
  if (!dbFile) {
    throw new Error("local D1 database not found — run `npm run db:migrate:local` first")
  }
  return sqliteDb(new Database(dbFile))
}
