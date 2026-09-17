import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { createTestDb } from "@/lib/db/repositories/test-db"
import type { SqlDb } from "@/lib/db/sql"
import { AGENT_TOOLS } from "./tools"

async function seed(db: SqlDb) {
  const cafes = new CafeRepository(db)
  const scores = new ScoreRepository(db)
  const a = await cafes.create({
    slug: "alpha",
    name: "Alpha Coffee",
    address: "A 1",
    lat: 37.98,
    lng: 23.73,
    neighborhood: "Exarchia",
    priceTier: 2,
    source: "owner",
    status: "verified",
    confidenceScore: null,
    verificationNotes: null,
  })
  await scores.upsertCurator(a.id, {
    quality: 5,
    priceValue: 3,
    workFriendliness: 3,
    quietVibe: 3,
    specialtyDepth: 5,
  }, { reviewed: true })
  const b = await cafes.create({
    slug: "beta",
    name: "Beta Coffee",
    address: "B 1",
    lat: 38.01,
    lng: 23.7,
    neighborhood: "Peristeri",
    priceTier: 2,
    source: "owner",
    status: "verified",
    confidenceScore: null,
    verificationNotes: null,
  })
  await scores.upsertCurator(b.id, {
    quality: 3,
    priceValue: 4,
    workFriendliness: 4,
    quietVibe: 3,
    specialtyDepth: 3,
  }, { reviewed: true })
}

describe("searchWeb", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("falls back to DuckDuckGo Lite without a search key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: String(url).includes("lite.duckduckgo.com"),
        status: 200,
        text: async () =>
          `<a class='result-link' href='//duckduckgo.com/l/?uddg=https%3A%2F%2Ftafcoffee.gr'>TAF</a>` +
          `<td class='result-snippet'>roaster</td>`,
      })),
    )
    const db = createTestDb()
    const res = (await AGENT_TOOLS.searchWeb.execute({ query: "taf coffee athens" }, { db })) as {
      source: string
      results: { url: string }[]
    }
    expect(res.source).toBe("duckduckgo")
    expect(res.results[0].url).toBe("https://tafcoffee.gr")
  })

  it("returns an error when the fallback fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 502 })))
    const db = createTestDb()
    const res = (await AGENT_TOOLS.searchWeb.execute({ query: "x y z" }, { db })) as {
      error: string
    }
    expect(res.error).toContain("502")
  })
})

describe("fetchPage", () => {
  let db: SqlDb
  beforeEach(() => {
    db = createTestDb()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches and strips HTML to text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          "<html><head><title>x</title></head><body><h1>Welcome</h1><p>Great coffee here</p><script>bad()</script></body></html>",
      })),
    )
    const res = (await AGENT_TOOLS.fetchPage.execute(
      { url: "https://example.com/cafe" },
      { db },
    )) as { text: string }
    expect(res.text).toContain("Welcome")
    expect(res.text).toContain("Great coffee here")
    expect(res.text).not.toContain("bad()")
  })

  it("blocks private hosts (SSRF guard)", async () => {
    const res = (await AGENT_TOOLS.fetchPage.execute(
      { url: "http://localhost:3000/admin" },
      { db },
    )) as { error: string }
    expect(res.error).toContain("blocked host")
  })

  it("rejects non-http protocols", async () => {
    const res = (await AGENT_TOOLS.fetchPage.execute(
      { url: "file:///etc/passwd" },
      { db },
    )) as { error: string }
    expect(res.error).toContain("unsupported protocol")
  })

  it("reports HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, text: async () => "" })),
    )
    const res = (await AGENT_TOOLS.fetchPage.execute(
      { url: "https://example.com/missing" },
      { db },
    )) as { error: string }
    expect(res.error).toContain("404")
  })
})

describe("queryCafesByWeights", () => {
  it("ranks the real dataset by weights and respects the limit", async () => {
    const db = createTestDb()
    await seed(db)
    const res = (await AGENT_TOOLS.queryCafesByWeights.execute(
      { weights: { quality: 5, priceValue: 1 }, limit: 1 },
      { db },
    )) as { cafes: { name: string; rankScore: number }[] }
    expect(res.cafes).toHaveLength(1)
    expect(res.cafes[0].name).toBe("Alpha Coffee")
    expect(res.cafes[0].rankScore).toBeGreaterThan(3)
  })

  it("defaults weights when omitted", async () => {
    const db = createTestDb()
    await seed(db)
    const res = (await AGENT_TOOLS.queryCafesByWeights.execute({ limit: 10 }, { db })) as {
      cafes: { name: string }[]
    }
    // Alpha (5,3,3,3,5) avg 3.8 > Beta (3,4,4,3,3) avg 3.4
    expect(res.cafes[0].name).toBe("Alpha Coffee")
    expect(res.cafes).toHaveLength(2)
  })

  it("never lets draft (unreviewed) scores influence the ranking", async () => {
    const db = createTestDb()
    await seed(db)
    const cafes = new CafeRepository(db)
    const scores = new ScoreRepository(db)
    const c = await cafes.create({
      slug: "gamma",
      name: "Gamma Coffee",
      address: "G 1",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 2,
      source: "public_submission",
      status: "verified",
      confidenceScore: null,
      verificationNotes: null,
    })
    await scores.upsertCurator(c.id, {
      quality: 5,
      priceValue: 5,
      workFriendliness: 5,
      quietVibe: 5,
      specialtyDepth: 5,
    })
    const res = (await AGENT_TOOLS.queryCafesByWeights.execute({ limit: 10 }, { db })) as {
      cafes: { name: string; rankScore: number | null; axes: unknown }[]
    }
    expect(res.cafes.map((c) => c.name)).toEqual(["Alpha Coffee", "Beta Coffee", "Gamma Coffee"])
    const gamma = res.cafes[2]
    expect(gamma.rankScore).toBeNull()
    expect(gamma.axes).toBeNull()
  })
})

describe("findNearbyCafes", () => {
  it("returns only cafés within the radius with distance", async () => {
    const db = createTestDb()
    await seed(db)
    const res = (await AGENT_TOOLS.findNearbyCafes.execute(
      { lat: 37.98, lng: 23.73, radiusM: 500 },
      { db },
    )) as { count: number; cafes: { name: string; distanceM: number }[] }
    expect(res.count).toBe(1)
    expect(res.cafes[0].name).toBe("Alpha Coffee")
    expect(res.cafes[0].distanceM).toBeLessThan(50)
  })
})

describe("draftCafeRecord", () => {
  it("validates a well-formed record", async () => {
    const db = createTestDb()
    const input = {
      name: "New Place",
      address: "Street 1",
      lat: 37.98,
      lng: 23.73,
      neighborhood: "Exarchia",
      priceTier: 2,
      scores: { quality: 4, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 4 },
    }
    const parsed = AGENT_TOOLS.draftCafeRecord.inputSchema.safeParse(input)
    expect(parsed.success).toBe(true)
    const res = await AGENT_TOOLS.draftCafeRecord.execute(input, { db })
    expect(res).toEqual(input)
  })

  it("rejects a record with an out-of-range price tier", async () => {
    const parsed = AGENT_TOOLS.draftCafeRecord.inputSchema.safeParse({
      name: "X",
      address: "Y",
      priceTier: 9,
      scores: { quality: 4, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 4 },
    })
    expect(parsed.success).toBe(false)
  })
})
