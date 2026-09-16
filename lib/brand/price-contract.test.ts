import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("public UI currency", () => {
  it("does not hardcode dollar price tiers in café UI", () => {
    const files = [
      "components/RankedCafeCard.tsx",
      "components/CafeExplorer.tsx",
      "app/cafes/[slug]/page.tsx",
    ]
    for (const f of files) {
      const src = readFileSync(f, "utf8")
      expect(src, f).not.toMatch(/"\$\$\$?"/)
    }
  })
})
