import { describe, expect, it } from "vitest"
import { parseSubmissionRow, SubmissionInputSchema } from "./submission"

describe("SubmissionInputSchema", () => {
  it("trims and accepts valid input", () => {
    const input = SubmissionInputSchema.parse({
      submittedName: "  Kaya Coffee  ",
      submittedLocation: "https://maps.app.goo.gl/abc",
      submitterNote: "great filter coffee",
    })
    expect(input.submittedName).toBe("Kaya Coffee")
    expect(input.submitterNote).toBe("great filter coffee")
  })

  it("rejects an empty name", () => {
    expect(() =>
      SubmissionInputSchema.parse({
        submittedName: "   ",
        submittedLocation: "Athens",
      }),
    ).toThrow()
  })

  it("rejects an oversized note", () => {
    expect(() =>
      SubmissionInputSchema.parse({
        submittedName: "Kaya",
        submittedLocation: "Athens",
        submitterNote: "x".repeat(1001),
      }),
    ).toThrow()
  })
})

describe("parseSubmissionRow", () => {
  it("maps snake_case rows to the domain type", () => {
    const sub = parseSubmissionRow({
      id: "11111111-1111-4111-8111-111111111111",
      submitted_name: "Kaya Coffee",
      submitted_location: "Athens",
      submitter_note: null,
      status: "new",
      promoted_cafe_id: null,
    })
    expect(sub).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      submittedName: "Kaya Coffee",
      submittedLocation: "Athens",
      submitterNote: null,
      status: "new",
      promotedCafeId: null,
    })
  })

  it("rejects an unknown submission status", () => {
    expect(() =>
      parseSubmissionRow({
        id: "11111111-1111-4111-8111-111111111111",
        submitted_name: "Kaya",
        submitted_location: "Athens",
        submitter_note: null,
        status: "pending",
        promoted_cafe_id: null,
      }),
    ).toThrow()
  })
})
