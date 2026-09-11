import { readdirSync, readFileSync } from "node:fs"
import Database from "better-sqlite3"
import { sqliteDb, type SqlDb } from "@/lib/db/sql"

// Fresh in-memory SQLite database with the real production migrations
// applied (all files in migrations/, in order). Tests run the same SQL
// as the deployed D1 database.
export function createTestDb(): SqlDb {
  const db = new Database(":memory:")
  db.pragma("foreign_keys = ON")
  const migrations = readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()
  for (const file of migrations) {
    db.exec(readFileSync(`migrations/${file}`, "utf8"))
  }
  return sqliteDb(db)
}
