import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = () => readFileSync("app/globals.css", "utf8")
const layout = () => readFileSync("app/layout.tsx", "utf8")

describe("type contract", () => {
  it("does not ship Arial or Helvetica as the body stack", () => {
    expect(css()).not.toMatch(/font-family:\s*Arial/i)
    expect(css()).not.toMatch(/Helvetica/)
  })

  it("does not use Geist as the brand sans", () => {
    expect(layout()).not.toMatch(/from "next\/font\/google"[\s\S]*Geist/)
    expect(layout()).not.toMatch(/\bGeist\b/)
    expect(layout()).not.toMatch(/\bGeist_Mono\b/)
  })

  it("loads a greek-capable display and body face", () => {
    expect(layout()).toMatch(/EB_Garamond/)
    expect(layout()).toMatch(/Source_Sans_3/)
    expect(layout()).toMatch(/subsets:[^)]*"greek"/)
  })
})
