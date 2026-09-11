import { beforeEach, describe, expect, it } from "vitest"
import { createTestDb } from "@/lib/db/repositories/test-db"
import type { SqlDb } from "@/lib/db/sql"
import { rateLimit } from "./rateLimit"

describe("rateLimit", () => {
  let db: SqlDb

  beforeEach(() => {
    db = createTestDb()
  })

  it("allows requests up to the limit", async () => {
    for (let i = 0; i < 3; i += 1) {
      expect(await rateLimit(db, "verify:1.2.3.4", 3)).toBe(true)
    }
  })

  it("blocks requests past the limit", async () => {
    for (let i = 0; i < 3; i += 1) {
      await rateLimit(db, "verify:1.2.3.4", 3)
    }
    expect(await rateLimit(db, "verify:1.2.3.4", 3)).toBe(false)
  })

  it("keeps keys independent", async () => {
    await rateLimit(db, "chat:a", 1)
    expect(await rateLimit(db, "chat:b", 1)).toBe(true)
  })

  it("resets after the window expires", async () => {
    await rateLimit(db, "verify:1.2.3.4", 1)
    expect(await rateLimit(db, "verify:1.2.3.4", 1)).toBe(false)
    // backdate the bucket so the window expires
    await db.run("update rate_limits set window_start = '2020-01-01T00:00:00.000Z' where key = ?", [
      "verify:1.2.3.4",
    ])
    expect(await rateLimit(db, "verify:1.2.3.4", 1)).toBe(true)
  })
})
