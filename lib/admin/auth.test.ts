import { afterEach, describe, expect, it, vi } from "vitest"
import { getAdminEmail, requireAdmin } from "./auth"

const mockDb = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock("@/lib/db/sql", () => ({
  getDb: vi.fn(async () => mockDb),
}))

const headers = (email?: string): Headers =>
  new Headers(
    email ? { "cf-access-authenticated-user-email": email } : undefined,
  )

describe("getAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("reads the Cloudflare Access email header", async () => {
    expect(await getAdminEmail(headers("Curator@Example.com"))).toBe("curator@example.com")
    expect(await getAdminEmail(headers())).toBeNull()
  })

  it("falls back to ADMIN_EMAIL outside production", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "test")
    expect(await getAdminEmail(headers())).toBe("me@example.com")
  })

  it("falls back with the explicit dev flag even in a production build", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("POUR_COMPASS_DEV_ADMIN", "1")
    expect(await getAdminEmail(headers())).toBe("me@example.com")
  })

  it("never falls back to ADMIN_EMAIL in production without the dev flag", async () => {
    vi.stubEnv("ADMIN_EMAIL", "me@example.com")
    vi.stubEnv("NODE_ENV", "production")
    expect(await getAdminEmail(headers())).toBeNull()
  })
})

describe("requireAdmin", () => {
  afterEach(() => {
    mockDb.get.mockReset()
    vi.unstubAllEnvs()
  })

  it("returns a session for an allowlisted email", async () => {
    mockDb.get.mockResolvedValue({ email: "curator@example.com" })
    const session = await requireAdmin(headers("curator@example.com"))
    expect(session).toEqual({ email: "curator@example.com" })
  })

  it("denies an email not in the allowlist", async () => {
    mockDb.get.mockResolvedValue(null)
    expect(await requireAdmin(headers("stranger@example.com"))).toBeNull()
  })

  it("denies when no identity is present", async () => {
    expect(await requireAdmin(headers())).toBeNull()
    expect(mockDb.get).not.toHaveBeenCalled()
  })
})
