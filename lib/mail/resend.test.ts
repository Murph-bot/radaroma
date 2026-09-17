import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_ALERT_FROM, DEFAULT_ALERT_TO, RESEND_ENDPOINT, mailConfigFromEnv, sendMail } from "./resend"
import { buildSubmissionAlert } from "./submissionAlert"

const okFetch = () => vi.fn(async () => new Response("{}", { status: 200 }))

describe("mailConfigFromEnv", () => {
  it("falls back to the documented defaults", () => {
    const cfg = mailConfigFromEnv({})
    expect(cfg.apiKey).toBeUndefined()
    expect(cfg.to).toBe(DEFAULT_ALERT_TO)
    expect(cfg.from).toBe(DEFAULT_ALERT_FROM)
  })

  it("reads overrides", () => {
    const cfg = mailConfigFromEnv({
      RESEND_API_KEY: "re_x",
      ALERT_EMAIL_TO: "a@b.gr",
      ALERT_EMAIL_FROM: "Radaroma <alerts@radaroma.com>",
    })
    expect(cfg).toEqual({ apiKey: "re_x", to: "a@b.gr", from: "Radaroma <alerts@radaroma.com>" })
  })
})

describe("sendMail", () => {
  afterEach(() => vi.restoreAllMocks())

  it("skips without calling fetch when the key is missing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchMock = okFetch()
    const ok = await sendMail({ to: "x@y.z", from: "f@y.z" }, { subject: "s", text: "t" }, fetchMock)
    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("posts to Resend with bearer auth and the message", async () => {
    const fetchMock = okFetch()
    const ok = await sendMail(
      { apiKey: "re_key", to: "x@y.z", from: "f@y.z" },
      { subject: "hello", text: "body" },
      fetchMock,
    )
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RESEND_ENDPOINT)
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key")
    expect(JSON.parse(init.body as string)).toEqual({
      from: "f@y.z",
      to: ["x@y.z"],
      subject: "hello",
      text: "body",
    })
  })

  it("returns false (no throw) on a non-2xx response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const fetchMock = vi.fn(async () => new Response("nope", { status: 422 }))
    const ok = await sendMail({ apiKey: "k", to: "x@y.z", from: "f@y.z" }, { subject: "s", text: "t" }, fetchMock)
    expect(ok).toBe(false)
  })

  it("returns false (no throw) when fetch rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const fetchMock = vi.fn(async () => {
      throw new Error("network")
    })
    const ok = await sendMail({ apiKey: "k", to: "x@y.z", from: "f@y.z" }, { subject: "s", text: "t" }, fetchMock)
    expect(ok).toBe(false)
  })
})

describe("buildSubmissionAlert", () => {
  const input = { submittedName: "Kafeneio X", submittedLocation: "Koukaki", submitterNote: "great espresso" }

  it("puts the status in the subject and links the admin", () => {
    const msg = buildSubmissionAlert(input, { status: "flagged", submissionId: "s1", reasoning: "duplicate?" })
    expect(msg.subject).toMatch(/^\[Radaroma\] FLAGGED/)
    expect(msg.subject).toContain("Kafeneio X")
    expect(msg.text).toContain("Koukaki")
    expect(msg.text).toContain("great espresso")
    expect(msg.text).toContain("duplicate?")
    expect(msg.text).toContain("https://radaroma.com/admin")
  })

  it("makes rejects and verified obvious", () => {
    expect(buildSubmissionAlert(input, { status: "rejected", submissionId: "s", reasoning: null }).subject).toContain("REJECTED")
    const v = buildSubmissionAlert(input, { status: "verified", submissionId: "s", cafeSlug: "kafeneio-x" })
    expect(v.subject).toContain("VERIFIED")
    expect(v.text).toContain("/cafes/kafeneio-x")
  })
})
