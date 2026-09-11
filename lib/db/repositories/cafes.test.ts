import { describe, expect, it } from "vitest"
import { CafeRepository } from "./cafes"
import { mockSupabase } from "./repo-test-utils"

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "taf-coffee",
  name: "Taf Coffee",
  address: "Emmanouil Benaki 7, Athens",
  lat: 37.977,
  lng: 23.733,
  neighborhood: "Exarchia",
  price_tier: 3,
  source: "owner",
  status: "verified",
  confidence_score: null,
  verification_notes: null,
  ...overrides,
})

describe("CafeRepository", () => {
  it("findVerified queries verified cafes and parses rows", async () => {
    const { client, q, setResult } = mockSupabase()
    setResult({ data: [row()], error: null })
    const repo = new CafeRepository(client)

    const cafes = await repo.findVerified()

    expect(client.from).toHaveBeenCalledWith("cafes")
    expect(q.eq).toHaveBeenCalledWith("status", "verified")
    expect(q.order).toHaveBeenCalledWith("name")
    expect(cafes).toHaveLength(1)
    expect(cafes[0].priceTier).toBe(3)
    expect(cafes[0].status).toBe("verified")
  })

  it("findVerified surfaces query errors", async () => {
    const { client, setResult } = mockSupabase()
    setResult({ data: null, error: { message: "boom" } })
    const repo = new CafeRepository(client)
    await expect(repo.findVerified()).rejects.toThrow("boom")
  })

  it("findNearby returns only cafés within the radius", async () => {
    const { client, setResult } = mockSupabase()
    // Acropolis cafe (37.9715, 23.7267), Syntagma cafe (~790 m away), Piraeus cafe (~9 km away)
    setResult({
      data: [
        row({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "acropolis", lat: 37.9715, lng: 23.7267 }),
        row({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", slug: "syntagma", lat: 37.9757, lng: 23.734 }),
        row({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", slug: "piraeus", lat: 37.942, lng: 23.6469 }),
      ],
      error: null,
    })
    const repo = new CafeRepository(client)

    const nearby = await repo.findNearby(37.9715, 23.7267, 2_000)

    expect(nearby.map((c) => c.slug)).toEqual(["acropolis", "syntagma"])
  })

  it("create inserts snake_case fields and parses the result", async () => {
    const { client, q, setResult } = mockSupabase()
    setResult({ data: row(), error: null })
    const repo = new CafeRepository(client)

    await repo.create({
      slug: "taf-coffee",
      name: "Taf Coffee",
      address: "Emmanouil Benaki 7, Athens",
      lat: 37.977,
      lng: 23.733,
      neighborhood: "Exarchia",
      priceTier: 3,
      source: "owner",
      status: "verified",
      confidenceScore: null,
      verificationNotes: null,
    })

    expect(q.insert).toHaveBeenCalledWith({
      slug: "taf-coffee",
      name: "Taf Coffee",
      address: "Emmanouil Benaki 7, Athens",
      lat: 37.977,
      lng: 23.733,
      neighborhood: "Exarchia",
      price_tier: 3,
      source: "owner",
      status: "verified",
      confidence_score: null,
      verification_notes: null,
    })
  })

  it("update maps camelCase patch to snake_case", async () => {
    const { client, q, setResult } = mockSupabase()
    setResult({ data: row({ status: "flagged" }), error: null })
    const repo = new CafeRepository(client)

    const updated = await repo.update("11111111-1111-4111-8111-111111111111", {
      status: "flagged",
      verificationNotes: "possible duplicate",
    })

    expect(q.update).toHaveBeenCalledWith({
      status: "flagged",
      verification_notes: "possible duplicate",
    })
    expect(updated.status).toBe("flagged")
  })

  it("markVerified sets status and verified_at", async () => {
    const { client, q, setResult } = mockSupabase()
    setResult({ data: row(), error: null })
    const repo = new CafeRepository(client)

    await repo.markVerified("11111111-1111-4111-8111-111111111111", "2026-09-12T00:00:00Z")

    expect(q.update).toHaveBeenCalledWith({
      status: "verified",
      verified_at: "2026-09-12T00:00:00Z",
    })
  })
})
