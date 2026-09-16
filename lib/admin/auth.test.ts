import { afterEach, describe, expect, it, vi } from "vitest"
import { getAdminEmail, requireAdmin } from "./auth"

const mockDb = vi.hoisted(() => ({
  get: vi.fn(),
}))
const mockJwtVerify = vi.hoisted(() => vi.fn())
const mockCreateRemoteJWKSet = vi.hoisted(() => vi.fn(() => "JWKS"))

vi.mock("@/lib/db/sql", () => ({
  getDb: vi.fn(async () => mockDb),
}))
vi.mock("jose", () => ({
  createRemoteJWKSet: mockCreateRemoteJWKSet,
  jwtVerify: mockJwtVerify,
}))

const TEAM = "https://team.cloudflareaccess.com"
const AUD = "test-aud-tag"

const stubAccessEnv = () => {
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", TEAM)
  vi.stubEnv("CF_ACCESS_AUD", AUD)
}

const jwtHeaders = (token = "token.jwt.sig"): Headers =>
  new Headers({ "cf-access-jwt-assertion": token })

const cookieHeaders = (token = "token.jwt.sig"): Headers =>
  new Headers({ cookie: `other=1; CF_Authorization=${token}; more=2` })

// The header Access injects after auth — forgeable by clients on any
// hostname/path not covered by the Access app, so it must never be trusted.
const forgedEmailHeaders = (email = "owner@example.com"): Headers =>
  new Headers({ "cf-access-authenticated-user-email": email })

describe("getAdminEmail — Cloudflare Access JWT", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    mockJwtVerify.mockReset()
    mockCreateRemoteJWKSet.mockClear()
  })

  it("returns the verified JWT email claim (assertion header)", async () => {
    stubAccessEnv()
    mockJwtVerify.mockResolvedValue({ payload: { email: "Curator@Example.com " } })
    expect(await getAdminEmail(jwtHeaders())).toBe("curator@example.com")
    expect(mockJwtVerify).toHaveBeenCalledWith("token.jwt.sig", "JWKS", {
      issuer: TEAM,
      audience: AUD,
    })
  })

  it("also accepts the CF_Authorization cookie", async () => {
    stubAccessEnv()
    mockJwtVerify.mockResolvedValue({ payload: { email: "c@example.com" } })
    expect(await getAdminEmail(cookieHeaders())).toBe("c@example.com")
  })

  it("denies when JWT verification fails", async () => {
    stubAccessEnv()
    mockJwtVerify.mockRejectedValue(new Error("bad signature"))
    expect(await getAdminEmail(jwtHeaders("forged.jwt.here"))).toBeNull()
  })

  it("denies when the JWT has no email claim", async () => {
    stubAccessEnv()
    mockJwtVerify.mockResolvedValue({ payload: { sub: "svc-token" } })
    expect(await getAdminEmail(jwtHeaders())).toBeNull()
  })

  it("ignores a forged email header when Access env is configured", async () => {
    stubAccessEnv()
    expect(await getAdminEmail(forgedEmailHeaders())).toBeNull()
    expect(mockJwtVerify).not.toHaveBeenCalled()
  })

  it("ignores a forged email header in production when Access env is missing", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ADMIN_EMAIL", "")
    expect(await getAdminEmail(forgedEmailHeaders())).toBeNull()
  })
})

describe("getAdminEmail — local dev fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("falls back to ADMIN_EMAIL outside production", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "test")
    expect(await getAdminEmail(new Headers())).toBe("me@example.com")
  })

  it("falls back with the explicit dev flag even in a production build", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("RADAROMA_DEV_ADMIN", "1")
    expect(await getAdminEmail(new Headers())).toBe("me@example.com")
  })

  it("never falls back to ADMIN_EMAIL in production without the dev flag", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "production")
    expect(await getAdminEmail(new Headers())).toBeNull()
  })

  // Regression: Turbopack inlines .env.local into the prod bundle, so
  // ADMIN_EMAIL and the dev flag can reach the prod worker. The fallback
  // must stay dead wherever Access is configured — prod always has an AUD.
  it("ignores the dev fallback when Access is configured", async () => {
    stubAccessEnv()
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("RADAROMA_DEV_ADMIN", "1")
    expect(await getAdminEmail(new Headers())).toBeNull()
  })
})

describe("requireAdmin", () => {
  afterEach(() => {
    mockDb.get.mockReset()
    mockJwtVerify.mockReset()
    vi.unstubAllEnvs()
  })

  it("returns a session for an allowlisted email", async () => {
    stubAccessEnv()
    mockJwtVerify.mockResolvedValue({ payload: { email: "curator@example.com" } })
    mockDb.get.mockResolvedValue({ email: "curator@example.com" })
    const session = await requireAdmin(jwtHeaders())
    expect(session).toEqual({ email: "curator@example.com" })
    expect(mockDb.get).toHaveBeenCalledWith(
      "select email from invited_emails where email = ?",
      ["curator@example.com"],
    )
  })

  it("denies an email not in the allowlist", async () => {
    stubAccessEnv()
    mockJwtVerify.mockResolvedValue({ payload: { email: "stranger@example.com" } })
    mockDb.get.mockResolvedValue(null)
    expect(await requireAdmin(jwtHeaders())).toBeNull()
  })

  it("denies when no identity is present", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ADMIN_EMAIL", "")
    expect(await requireAdmin(new Headers())).toBeNull()
    expect(mockDb.get).not.toHaveBeenCalled()
  })
})
