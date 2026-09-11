import { beforeEach, describe, expect, it } from "vitest"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { SubmissionRepository } from "@/lib/db/repositories/submissions"
import { createTestDb } from "@/lib/db/repositories/test-db"
import type { SqlDb } from "@/lib/db/sql"
import { FakeLlm, textResponse } from "@/lib/agent/fake-llm"
import { verifySubmission } from "./verifySubmission"

const record = {
  name: "New Place Coffee",
  address: "Street 1, Athens",
  lat: 37.98,
  lng: 23.73,
  neighborhood: "Exarchia",
  priceTier: 2,
  scores: { quality: 4, priceValue: 4, workFriendliness: 3, quietVibe: 3, specialtyDepth: 4 },
}

const verifyJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    confidence: 0.9,
    decision: "auto_verified",
    reasoning: "official site found",
    record,
    ...overrides,
  })

const input = {
  submittedName: "New Place Coffee",
  submittedLocation: "Street 1, Athens",
}

describe("verifySubmission", () => {
  let db: SqlDb

  beforeEach(() => {
    db = createTestDb()
  })

  it("promotes an auto-verified submission to a verified café", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson()))
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("verified")
    if (res.status !== "verified") return
    expect(res.cafeSlug).toBe("new-place-coffee")

    const cafes = new CafeRepository(db)
    const cafe = await cafes.findBySlug("new-place-coffee")
    expect(cafe?.source).toBe("public_submission")
    expect(cafe?.status).toBe("verified")
    expect(cafe?.confidenceScore).toBe(0.9)
    expect(cafe?.verificationNotes).toContain("official site found")

    const submissions = new SubmissionRepository(db)
    const sub = await submissions.findById(res.submissionId)
    expect(sub?.status).toBe("promoted")
    expect(sub?.promotedCafeId).toBe(cafe?.id)
  })

  it("stores the agent's scores", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson()))
    const res = await verifySubmission({ llm, db }, input)
    if (res.status !== "verified") throw new Error("expected verified")
    const cafes = new CafeRepository(db)
    const cafe = await cafes.findBySlug(res.cafeSlug)
    const scores = await db.get("select * from cafe_scores where cafe_id = ?", [cafe?.id ?? ""])
    expect(scores?.quality).toBe(4)
    expect(scores?.specialty_depth).toBe(4)
  })

  it("flags a submission when confidence is low", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson({ confidence: 0.4, decision: "auto_verified" })))
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("flagged")
    const submissions = new SubmissionRepository(db)
    const sub = await submissions.findById(res.submissionId)
    expect(sub?.status).toBe("flagged")
  })

  it("marks a rejected submission", async () => {
    const llm = new FakeLlm(() => textResponse(verifyJson({ decision: "rejected" })))
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("rejected")
    const submissions = new SubmissionRepository(db)
    expect((await submissions.findById(res.submissionId))?.status).toBe("rejected")
  })

  it("flags when the agent output is unparsable", async () => {
    const llm = new FakeLlm(() => textResponse("I could not verify this."))
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("flagged")
  })

  it("flags (fail-open) when the pipeline throws", async () => {
    const llm = new FakeLlm(() => {
      throw new Error("provider down")
    })
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("flagged")
    if (res.status !== "flagged") return
    expect(res.reasoning).toContain("pipeline error")
  })

  it("makes slugs unique when a café with that name exists", async () => {
    const cafes = new CafeRepository(db)
    await cafes.create({
      slug: "new-place-coffee",
      name: "New Place Coffee",
      address: "Old Street",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 2,
      source: "owner",
      status: "verified",
      confidenceScore: null,
      verificationNotes: null,
    })
    const llm = new FakeLlm(() => textResponse(verifyJson()))
    const res = await verifySubmission({ llm, db }, input)

    expect(res.status).toBe("verified")
    if (res.status !== "verified") return
    expect(res.cafeSlug).toBe("new-place-coffee-2")
  })

  it("always stores submissions as 'new' first (server-side boundary)", async () => {
    const submissions = new SubmissionRepository(db)
    const created = await submissions.create(input)
    expect(created.status).toBe("new")
  })
})
