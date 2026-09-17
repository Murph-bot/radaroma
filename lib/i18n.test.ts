import { describe, expect, it } from "vitest"
import { localeFromHost, STRINGS, t } from "./i18n"

describe("localeFromHost", () => {
  it("maps the .gr domain and subdomains to Greek", () => {
    expect(localeFromHost("radaroma.gr")).toBe("el")
    expect(localeFromHost("www.radaroma.gr")).toBe("el")
  })

  it("maps .com, workers.dev, and localhost to English", () => {
    expect(localeFromHost("radaroma.com")).toBe("en")
    expect(localeFromHost("www.radaroma.com")).toBe("en")
    expect(localeFromHost("radaroma.sotirios-k-goulas.workers.dev")).toBe("en")
    expect(localeFromHost("localhost:3000")).toBe("en")
  })

  it("is case-insensitive and tolerates ports", () => {
    expect(localeFromHost("RADAROMA.GR")).toBe("el")
    expect(localeFromHost("radaroma.gr:443")).toBe("el")
  })

  it("falls back to English for missing hosts", () => {
    expect(localeFromHost(null)).toBe("en")
    expect(localeFromHost(undefined)).toBe("en")
  })
})

describe("strings", () => {
  it("Greek dictionary mirrors the English shape", () => {
    const shape = (v: unknown): unknown =>
      v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]))
        : typeof v
    expect(shape(STRINGS.el)).toEqual(shape(STRINGS.en))
  })

  it("t() returns the right dictionary", () => {
    expect(t("el").nav.compare).toBe("Σύγκριση")
    expect(t("en").nav.compare).toBe("Compare")
    expect(t("el").axes.quality).toBe("Ποιότητα")
  })
})
