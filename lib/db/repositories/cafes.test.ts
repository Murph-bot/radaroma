import { beforeEach, describe, expect, it } from "vitest"
import { CafeRepository } from "./cafes"
import { createTestDb } from "./test-db"
import type { SqlDb } from "@/lib/db/sql"

const newCafe = (overrides: Record<string, unknown> = {}) => ({
  slug: "taf-coffee",
  name: "Taf Coffee",
  address: "Emmanouil Benaki 7, Athens",
  lat: 37.977,
  lng: 23.733,
  neighborhood: "Exarchia",
  priceTier: 3,
  source: "owner" as const,
  status: "verified" as const,
  confidenceScore: null,
  verificationNotes: null,
  ...overrides,
})

describe("CafeRepository", () => {
  let db: SqlDb
  let repo: CafeRepository

  beforeEach(() => {
    db = createTestDb()
    repo = new CafeRepository(db)
  })

  it("findVerified returns only verified cafes, ordered by name", async () => {
    await repo.create(newCafe({ slug: "zeta", name: "Zeta Cafe" }))
    await repo.create(newCafe({ slug: "alpha", name: "Alpha Cafe" }))
    await repo.create(newCafe({ slug: "drafty", name: "Draft Cafe", status: "draft" }))

    const verified = await repo.findVerified()

    expect(verified.map((c) => c.slug)).toEqual(["alpha", "zeta"])
  })

  it("findBySlug / findById roundtrip the domain shape", async () => {
    const created = await repo.create(newCafe())

    const bySlug = await repo.findBySlug("taf-coffee")
    const byId = await repo.findById(created.id)

    expect(bySlug).toEqual(created)
    expect(byId).toEqual(created)
    expect(bySlug?.priceTier).toBe(3)
    expect(bySlug?.status).toBe("verified")
    expect(await repo.findBySlug("nope")).toBeNull()
  })

  it("findNearby returns only cafés within the radius", async () => {
    // Acropolis (37.9715, 23.7267), Syntagma (~790 m), Piraeus (~9 km)
    await repo.create(newCafe({ slug: "acropolis", lat: 37.9715, lng: 23.7267 }))
    await repo.create(newCafe({ slug: "syntagma", lat: 37.9757, lng: 23.734 }))
    await repo.create(newCafe({ slug: "piraeus", lat: 37.942, lng: 23.6469 }))

    const nearby = await repo.findNearby(37.9715, 23.7267, 2_000)

    expect(nearby.map((c) => c.slug)).toEqual(["acropolis", "syntagma"])
  })

  it("findNearby ignores cafes without coordinates", async () => {
    await repo.create(newCafe({ slug: "nolat", lat: null, lng: null }))
    const nearby = await repo.findNearby(37.97, 23.73, 100_000)
    expect(nearby).toHaveLength(0)
  })

  it("update applies a partial patch and bumps updated_at", async () => {
    const created = await repo.create(newCafe())
    // Backdate so the bump is observable even within the same millisecond
    await db.run("update cafes set updated_at = '2020-01-01T00:00:00.000Z' where id = ?", [
      created.id,
    ])

    const updated = await repo.update(created.id, {
      status: "flagged",
      verificationNotes: "possible duplicate",
    })

    expect(updated.status).toBe("flagged")
    expect(updated.verificationNotes).toBe("possible duplicate")
    expect(updated.name).toBe("Taf Coffee")
    // updated_at is not part of the domain type but the DB row did change
    const after = await db.get("select updated_at from cafes where id = ?", [updated.id])
    expect(after?.updated_at).not.toBe("2020-01-01T00:00:00.000Z")
  })

  it("markVerified sets status and verified_at", async () => {
    const created = await repo.create(newCafe({ status: "draft" }))
    const verifiedAt = "2026-09-12T00:00:00.000Z"

    const updated = await repo.markVerified(created.id, verifiedAt)

    expect(updated.status).toBe("verified")
    const raw = await db.get("select verified_at from cafes where id = ?", [created.id])
    expect(raw?.verified_at).toBe(verifiedAt)
  })

  it("findByStatus filters by status", async () => {
    await repo.create(newCafe({ slug: "flagged-a", status: "flagged" }))
    await repo.create(newCafe({ slug: "flagged-b", status: "flagged" }))
    await repo.create(newCafe({ slug: "rejected-a", status: "rejected" }))

    const flagged = await repo.findByStatus("flagged")

    expect(flagged.map((c) => c.slug)).toEqual(["flagged-a", "flagged-b"])
  })
})
