import { readFileSync } from "node:fs"
import Database from "better-sqlite3"
import { sqliteDb, type SqlDb } from "@/lib/db/sql"

// Fresh in-memory SQLite database with the real production migration applied.
// Tests run the same SQL as the deployed D1 database.
export function createTestDb(): SqlDb {
  const db = new Database(":memory:")
  db.pragma("foreign_keys = ON")
  db.exec(readFileSync("migrations/0001_init.sql", "utf8"))
  return sqliteDb(db)
}
