import { describe, expect, it } from "vitest"
import {
  CafePatchSchema,
  CafeSchema,
  NewCafeSchema,
  parseCafeRow,
} from "./cafe"

const validRow = {
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
}

describe("CafeRowSchema", () => {
  it("maps snake_case rows to the camelCase domain type", () => {
    const cafe = parseCafeRow(validRow)
    expect(cafe).toEqual({
      id: validRow.id,
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
  })

  it("rejects an unknown status", () => {
    expect(() => parseCafeRow({ ...validRow, status: "published" })).toThrow()
  })

  it("rejects a price tier outside 1-4", () => {
    expect(() => parseCafeRow({ ...validRow, price_tier: 5 })).toThrow()
    expect(() => parseCafeRow({ ...validRow, price_tier: 0 })).toThrow()
  })

  it("rejects a confidence score outside 0-1", () => {
    expect(() =>
      parseCafeRow({ ...validRow, confidence_score: 1.5 }),
    ).toThrow()
  })
})

describe("CafeSchema", () => {
  it("accepts a well-formed domain cafe", () => {
    const cafe = CafeSchema.parse({
      id: validRow.id,
      slug: "taf-coffee",
      name: "Taf Coffee",
      address: "Emmanouil Benaki 7, Athens",
      lat: null,
      lng: null,
      neighborhood: null,
      priceTier: 3,
      source: "owner",
      status: "draft",
      confidenceScore: null,
      verificationNotes: null,
    })
    expect(cafe.status).toBe("draft")
  })

  it("rejects an empty name", () => {
    expect(() =>
      CafeSchema.parse({
        id: validRow.id,
        slug: "x",
        name: "",
        address: "a",
        lat: null,
        lng: null,
        neighborhood: null,
        priceTier: 1,
        source: "owner",
        status: "draft",
        confidenceScore: null,
        verificationNotes: null,
      }),
    ).toThrow()
  })
})

describe("NewCafeSchema / CafePatchSchema", () => {
  it("accepts a cafe without an id", () => {
    const parsedCafe = CafeSchema.parse({
      id: validRow.id,
      slug: "taf-coffee",
      name: "Taf Coffee",
      address: "Emmanouil Benaki 7, Athens",
      lat: 37.977,
      lng: 23.733,
      neighborhood: "Exarchia",
      priceTier: 3,
      source: "owner",
      status: "verified",
      confidenceScore: 0.8,
      verificationNotes: "verified by agent",
    })
    const { id, ...rest } = parsedCafe
    expect(id).toBeTruthy()
    const parsed = NewCafeSchema.parse(rest)
    expect(parsed.confidenceScore).toBe(0.8)
  })

  it("accepts a partial patch", () => {
    const patch = CafePatchSchema.parse({ status: "flagged" })
    expect(patch.status).toBe("flagged")
    expect(patch.name).toBeUndefined()
  })

  it("rejects an illegal status in a patch", () => {
    expect(() => CafePatchSchema.parse({ status: "live" })).toThrow()
  })
})
