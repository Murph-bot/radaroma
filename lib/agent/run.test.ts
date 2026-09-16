import { beforeEach, describe, expect, it } from "vitest"
import { AgentRunRepository } from "@/lib/db/repositories/agentRuns"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { createTestDb } from "@/lib/db/repositories/test-db"
import type { SqlDb } from "@/lib/db/sql"
import { FakeLlm, textResponse, toolCallResponse } from "./fake-llm"
import { extractJson, runConcierge, runCuratorAssist, runVerify } from "./run"
import type { CompleteRequest } from "./types"

const fullRecord = {
  name: "New Place Coffee",
  address: "Street 1, Athens",
  lat: 37.984,
  lng: 23.731,
  neighborhood: "Exarchia",
  priceTier: 2,
  scores: { quality: 4, priceValue: 4, workFriendliness: 3, quietVibe: 3, specialtyDepth: 4 },
}

const verifyJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    confidence: 0.9,
    decision: "auto_verified",
    reasoning: "found official site and maps listing",
    record: fullRecord,
    ...overrides,
  })

async function seedCafe(db: SqlDb, overrides: Record<string, unknown> = {}) {
  const cafes = new CafeRepository(db)
  const scores = new ScoreRepository(db)
  const cafe = await cafes.create({
    slug: "existing-cafe",
    name: "Existing Cafe",
    address: "Old Street 2, Athens",
    lat: 37.984,
    lng: 23.731,
    neighborhood: "Exarchia",
    priceTier: 2,
    source: "owner",
    status: "verified",
    confidenceScore: null,
    verificationNotes: null,
    ...overrides,
  })
  await scores.upsertCurator(cafe.id, {
    quality: 5,
    priceValue: 4,
    workFriendliness: 3,
    quietVibe: 3,
    specialtyDepth: 5,
  })
  return cafe
}

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })

  it("parses fenced JSON", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it("parses JSON embedded in prose", () => {
    expect(extractJson('Sure, here it is: {"a":1} hope that helps')).toEqual({ a: 1 })
  })

  it("returns null for non-JSON", () => {
    expect(extractJson("I could not verify this café.")).toBeNull()
    expect(extractJson(null)).toBeNull()
  })
})

describe("runConcierge", () => {
  let db: SqlDb

  beforeEach(() => {
    db = createTestDb()
  })

  it("returns text and offers only queryCafesByWeights", async () => {
    const llm = new FakeLlm(() => textResponse("Try TAF Coffee."))
    const res = await runConcierge({ llm, db }, { history: [{ role: "user", content: "best espresso?" }] })

    expect(res.content).toBe("Try TAF Coffee.")
    expect(llm.requests[0].tools?.map((t) => t.name)).toEqual(["queryCafesByWeights"])

    const runs = await new AgentRunRepository(db).listRecent()
    expect(runs).toHaveLength(1)
    expect(runs[0].mode).toBe("concierge_chat")
  })

  it("executes queryCafesByWeights against the real dataset", async () => {
    await seedCafe(db, { slug: "great", name: "Great Coffee", lat: 37.99, lng: 23.73 })
    await seedCafe(db, { slug: "meh", name: "Meh Coffee", lat: 37.97, lng: 23.75 })

    const llm = new FakeLlm((req: CompleteRequest, call: number) => {
      if (call === 0) {
        return toolCallResponse("queryCafesByWeights", { weights: { quality: 5 }, limit: 5 })
      }
      const toolMsg = req.messages.find((m) => m.role === "tool")
      const data = JSON.parse(toolMsg?.content ?? "{}") as { cafes: { name: string }[] }
      expect(data.cafes[0].name).toBe("Great Coffee")
      return textResponse("Great Coffee is your best bet.")
    })

    const res = await runConcierge({ llm, db }, { history: [{ role: "user", content: "quality?" }] })
    expect(res.content).toContain("Great Coffee")
  })

  it("returns a friendly message when the loop exceeds max rounds", async () => {
    const llm = new FakeLlm(() => toolCallResponse("queryCafesByWeights", {}))
    const res = await runConcierge({ llm, db, maxToolRounds: 2 }, { history: [{ role: "user", content: "hi" }] })
    expect(res.content).toContain("try again")
  })
})

describe("runVerify", () => {
  let db: SqlDb

  beforeEach(() => {
    db = createTestDb()
  })

  it("auto-verifies high confidence with no duplicates", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson()))
    const res = await runVerify({ llm, db }, { name: "New Place Coffee", location: "Street 1, Athens" })

    expect(res.decision).toBe("auto_verified")
    expect(res.confidence).toBe(0.9)
    expect(res.record?.name).toBe("New Place Coffee")

    const runs = await new AgentRunRepository(db).listRecent()
    expect(runs[0].decision).toBe("auto_verified")
    expect(runs[0].confidenceScore).toBe(0.9)
  })

  it("flags low confidence", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson({ confidence: 0.5, decision: "auto_verified" })))
    const res = await runVerify({ llm, db }, { name: "X", location: "Y" })

    expect(res.decision).toBe("flagged_for_review")
    expect(res.reasoning).toContain("below 0.75")
  })

  it("flags when a duplicate exists within 200m even with high confidence", async () => {
    await seedCafe(db) // existing cafe at 37.984, 23.731
    const llm = new FakeLlm(() =>
      textResponse(verifyJson({ record: { ...fullRecord, lat: 37.9842, lng: 23.7312 } })),
    )
    const res = await runVerify({ llm, db }, { name: "New Place Coffee", location: "Street 1" })

    expect(res.decision).toBe("flagged_for_review")
    expect(res.reasoning).toContain("Existing Cafe")
  })

  it("flags unparsable output", async () => {
    const llm = new FakeLlm(() => textResponse("I searched but could not find this place."))
    const res = await runVerify({ llm, db }, { name: "X", location: "Y" })

    expect(res.decision).toBe("flagged_for_review")
    expect(res.confidence).toBeNull()
  })

  it("recovers an unparsable verdict via the json-mode corrective call", async () => {
    const llm = new FakeLlm((_req, call) =>
      call === 0
        ? textResponse("The café checks out, but let me say that in words.")
        : textResponse(verifyJson({ decision: "flagged_for_review", confidence: 0.6 })),
    )
    const res = await runVerify({ llm, db }, { name: "X", location: "Y" })

    expect(llm.requests[1]?.jsonSchema?.name).toBe("verify_verdict")
    expect(res.decision).toBe("flagged_for_review")
    expect(res.confidence).toBe(0.6)
    expect(res.record?.name).toBe("New Place Coffee")
  })

  it("forces a final answer pass when tool rounds run out", async () => {
    const llm = new FakeLlm(() => toolCallResponse("searchWeb", { query: "x" }))
    const res = await runVerify({ llm, db, maxToolRounds: 2 }, { name: "X", location: "Y" })

    expect(res.decision).toBe("flagged_for_review")
    const finalReq = llm.requests[2]
    expect(finalReq?.tools).toBeUndefined()
    expect(finalReq?.jsonSchema?.name).toBe("verify_verdict")
  })

  it("respects the agent's rejected decision", async () => {
    const llm = new FakeLlm(() =>
      textResponse(verifyJson({ decision: "rejected", confidence: 0.9, record: fullRecord })),
    )
    const res = await runVerify({ llm, db }, { name: "X", location: "Y" })
    expect(res.decision).toBe("rejected")
  })

  it("logs tool calls", async () => {
    const llm = new FakeLlm((req: CompleteRequest, call: number) => {
      if (call === 0) {
        return toolCallResponse("draftCafeRecord", { ...fullRecord, name: "New Place Coffee" })
      }
      return textResponse(verifyJson())
    })
    await runVerify({ llm, db }, { name: "New Place Coffee", location: "Street 1" })

    const runs = await new AgentRunRepository(db).listRecent()
    expect(runs[0].toolCalls).not.toBeNull()
  })
})

describe("runCuratorAssist", () => {
  it("extracts the record from the last draftCafeRecord call", async () => {
    const db = createTestDb()
    const llm = new FakeLlm((_req, call) => {
      if (call === 0) {
        return toolCallResponse("draftCafeRecord", {
          name: "Curated Place",
          address: "Street 9, Athens",
          priceTier: 3,
          scores: { quality: 4, priceValue: 3, workFriendliness: 4, quietVibe: 4, specialtyDepth: 3 },
        })
      }
      return textResponse("Drafted a record for Curated Place.")
    })

    const res = await runCuratorAssist({ llm, db }, { notes: "notes about the place" })

    expect(res.record?.name).toBe("Curated Place")
    expect(res.record?.scores.quality).toBe(4)
    expect(res.content).toContain("Curated Place")
  })

  it("returns null record when the agent never drafts", async () => {
    const db = createTestDb()
    const llm = new FakeLlm(() => textResponse("Nothing to draft."))
    const res = await runCuratorAssist({ llm, db }, { notes: "junk" })
    expect(res.record).toBeNull()
  })
})
