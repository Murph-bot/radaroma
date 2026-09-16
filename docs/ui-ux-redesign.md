# Radaroma implementation prompt — UI / UX / brand, test-first

> **How to use this file.** Paste this entire document as the task for an implementing model (including a future session of the same agent). It is the brief, the design system, the bug list, and the TDD contract. Do not skim. Do not invent a second product. Execute in the order given.
>
> **This file is not code.** It was written as a recommendation. An implementer may change application code. The session that produced it did not.

---

## 0. Who you are and what you are building

You are a senior product designer and a careful TypeScript engineer working in the Radaroma repo.

Radaroma is a curated Attica café guide. It is not a star-rating aggregator, not Tripadvisor, not Google Maps, not an AI wrapper with a coffee skin. It is a **taste instrument**: five axes (quality, price-value, work-friendliness, quiet vibe, specialty depth), a radar silhouette, weights the visitor can steer, and a concierge that can only name cafés already in the dataset.

The live site is https://radaroma.com (Cloudflare Workers via OpenNext, D1, Next.js 16 App Router). Local working agreement: `AGENTS.md`. Original product spec: `radaroma-spec.md`. Build plan: `docs/megaplan.md`.

Your job: make the interface feel like a short, opinionated Athens café zine that happens to be interactive. Paper, not dashboard. Shape, not stars. Place, not inventory.

The memorable brand object: **the O in Radaroma is the five-axis radar.** Every card, favicon, and share image should rhyme with that pentagon.

---

## 1. Hard constraints

1. **TDD for every logic change.** Write the failing test first. Run it. Confirm it fails for the intended reason. Then write the minimum production code. Run it until green. Do not “fix then test.” Do not change tests to match a wrong implementation.
2. **Do not weaken the existing suite.** On 2026-09-17 the repo reported `Test Files 20 passed (20) / Tests 126 passed (126)` via `npm test` (Vitest, `lib/**/*.test.ts`, node environment). Those 126 must stay green. If a new behavior genuinely changes a contract, say so in the commit and update the assertion with a reason, do not silently loosen it.
3. **Do not touch ranking geometry unless a test demands it.** `lib/ranking.ts` and `lib/radar.ts` are the product. `queryCafesByWeights` in `lib/agent/tools.ts` consumes `rankCafes`. A visual redesign must not fork a second ranking function.
4. **No stock interiors of fake cafés.** Do not download Unsplash “cozy café” photos and assign them to TAF, The Underdog, or anyone else. Phone photos of the real 20 can wait on the human. Ship silhouette radars and paper texture until real images exist. Texture stock (grain, crema, steam, a wall in Attica light) is allowed only if it is not captioned as a shop.
5. **No new chart library, no ORM, no agent framework, no Inter/Roboto/Poppins/Montserrat/Geist-as-brand, no purple gradients, no 3-column icon feature grid, no dark mode in this pass, no mascot.**
6. **Do not invent hours, menus, or reviews.** Do not scrape photos. Do not put secrets in source.
7. **Match local style.** App/component TS often has no semicolons. Existing tests *do* use semicolons. Follow the file you are in. Conventional commits, no attribution trailer. Verification gate in `AGENTS.md`: lint + typecheck + test, then runtime proof.
8. **Vitest stays on node for unit tests.** `vitest.config.ts` is `environment: "node"` and `include: ["lib/**/*.test.ts", "lib/**/*.test.tsx"]`. Prefer new pure helpers under `lib/` so they run in the existing harness with no jsdom, no Playwright, no new runner. Component tests are optional and only worth it if you add a jsdom project without breaking the 126. Visual layout (truncation, homepage hierarchy) is verified in the browser, not with a bad mock test.
9. **Keep the concierge structurally honest.** Mode `concierge_chat` may only call `queryCafesByWeights`. Do not give it web search.

---

## 2. TDD protocol for this brief

For each item in §6 (failing tests), do this loop and no other:

```
RED   → add the test exactly as specified (or a stricter equivalent)
      → run: npm test -- <file>
      → confirm failure message matches the intended bug / missing API
GREEN → smallest production change
      → rerun the same file, then npm test
```

If a listed test **already passes** on current HEAD, you mis-copied it or the code changed. Stop and re-read the source. Several tests below are known to be RED today. A few are GREEN locks on existing behavior; those are labeled **LOCK** and must remain passing.

If a test is impractical (layout, photography, font rendering in a real browser), do not invent a brittle snapshot. Use the “closest executable check” in that subsection, then verify in the browser.

Do not add tests that only assert implementation details (class names, Tailwind strings) unless the subsection explicitly asks for a file-level contract (Arial ban, euro labels).

---

## 3. Product thesis (do not drift)

### Visitor jobs

- “Quiet place to work in Exarchia.”
- “Which of these two is a specialty bar, not a brunch room?”
- “Something good that is not a tourist terrace in Psyrri.”

### Not the jobs

- Best brunch near me.
- User reviews, wait times, a map of every coffee in Attica.

### Positioning

Current homepage: *“Attica cafés, ranked your way”* plus *“Not another star-rating aggregator.”* The first is generic. The second is defensive. If the interface does the job you never need the disclaimer.

Use something this sharp, not a pitch deck:

- Wordmark + one line: **Attica cafés, as a shape.**
- Or: **Not a score. A shape.**

Concierge copy: “It will only name shops on this list.” Not “A real AI, grounded in our dataset.”

Voice: a local with opinions. “Foyer is a brew bar. Do not bring a six-person meeting.” Never “Discover your perfect café experience.”

### Audience

Laptop people, specialty-curious Athenians, visitors who distrust a 4.6 on every shop. Friends-first, already public. `radaroma.gr` is bought but not live; fonts must support Greek **now**.

---

## 4. Current UI (facts from a 2026-09-17 audit)

Live walkthrough: `/`, `/cafes/the-underdog-thissio`, `/compare`.

### What to keep

- Cream paper and espresso ink as the *family* (`app/globals.css` `--color-coffee-*`).
- Custom SVG radar (`components/RadarChart.tsx` + `lib/radar.ts`). No Recharts.
- Weighted sliders (`components/CafeExplorer.tsx`) sharing `lib/ranking.ts` with the agent.
- Concierge constraint (dataset only).
- Footer honesty: scores are opinions; go taste.
- Compare query param already exists: `/compare?cafes=slug,slug`.

### What is working against the product

1. **One-note brown.** Every surface cream, every bar brown. Palettes need a second hue. Add copper. Do not add a rainbow.
2. **Type is unfinished.** `app/layout.tsx` loads Geist into `--font-geist-sans`. `app/globals.css` then forces `body { font-family: Arial, Helvetica, sans-serif; }`. Geist is unused in practice. Even if applied, Geist is a dashboard face, not a café zine. Arial is the first thing a designer notices.
3. **Homepage is a SaaS landing.** Centered hero, search pill, two text links, large empty chat, then cafés. First two seconds teach “search + chatbot.” The instrument (sliders + list) is below the fold. See `app/page.tsx`.
4. **Composite score reintroduces stars.** Cards and detail lead with `4.4 / 5`. That number is a weighted average. At default weights it is just “how generously we scored.” It should either be labeled **your match** and move with weights, or hide at defaults. Shape first.
5. **Names truncate.** `RankedCafeCard` uses `truncate` on `h3`. On a 20-item catalogue the name *is* the content. “Handpickers …” is amateur.
6. **Homepage lists the same cafés twice.** `top = ranked.slice(0, 3)` then `CafeExplorer compact` (first 5). Handpickers / Create / Honest appear in both bands.
7. **Detail is a data sheet.** Name, `$$$`, address, radar in a white box, five bars, grey `verificationNotes` that still say “scores estimate”, then the same chat. No photo, no maps link, no “best for,” no compare deep-link. Live example: The Underdog.
8. **Compare starts empty.** `ComparePicker` initializes from `initialSlugs`; the page passes URL slugs or `[]`. Empty → dashed “Select at least two.” The overlay, the most photogenic object, is hidden on first paint.
9. **American `$`.** `PRICE_TIER_LABEL = ["", "$", "$$", "$$$", "$$$$"]` is copy-pasted in `components/RankedCafeCard.tsx`, `app/cafes/[slug]/page.tsx`, and `$` options in `components/CafeExplorer.tsx`. This is Greece. Use `€`.
10. **Emoji as brand.** ☕ in search, concierge header, no-score placeholder.
11. **Starter assets.** `public/vercel.svg`, `next.svg`, `globe.svg`, `window.svg`, `file.svg`.
12. **Sky-blue community chip.** `bg-sky-100 text-sky-800` on public-submission cafés. Off palette.
13. **Tiny labeled radars.** Card size is 96. Axis words collide. Labels belong on the large chart only.
14. **Seed notes shipped as verification text.** All 20 rows in `data/seed/cafes.athens.json` end with `; scores estimate`. Seed writes them into `verification_notes`. Detail pages print them. That trains people not to trust the numbers.
15. **`SCORE_AXES` is defined twice.** `lib/schemas/score.ts` and again in `lib/ranking.ts`. Import one source of truth.

---

## 5. Existing test inventory (LOCK — must stay green)

Runner: `npm test` → `vitest run --passWithNoTests`.

Baseline captured 2026-09-17:

```
Test Files  20 passed (20)
     Tests  126 passed (126)
```

No `it.skip` / `test.todo` in `lib/**/*.test.ts`.

| Area | File | What it already guarantees |
|---|---|---|
| Ranking math | `lib/ranking.test.ts` | Default weights = plain average; heavy axis shifts order; zero weights → 0; unscored last + alpha; ties by name; `rankScore` stays on 1–5 for a perfect café |
| Radar geometry | `lib/radar.test.ts` | 12 o’clock start; even axes; max score = full radius; min 1 = r/5; clamp out of range; SVG point format |
| Geo | `lib/geo.test.ts` | Haversine zero, ~1° latitude, symmetry, Athens pair ~790 m |
| Slugs (Latin only) | `lib/slug.test.ts` | kebab, `&` → and, Latin diacritics stripped, unique `-2` `-3` |
| Cafe schema | `lib/schemas/cafe.test.ts` | snake→camel, status/price/confidence bounds |
| Submission schema | `lib/schemas/submission.test.ts` | trim, empty name, oversized note, row parse |
| Repositories | `lib/db/repositories/{cafes,scores,submissions,agentRuns}.test.ts` | verified filter, nearby, upsert scores, submissions always insert `'new'`, FK on promote |
| Pipeline | `lib/pipeline/{promote,verifySubmission,draftFromRuns}.test.ts` | auto-verify, flag, reject, unique slug, fail-open on throw |
| Agent tools | `lib/agent/tools.test.ts` | DDG fallback, SSRF block, `queryCafesByWeights` ranks + limit, nearby, draft validation |
| Agent run | `lib/agent/run.test.ts` | concierge only offers `queryCafesByWeights`; verify confidence/duplicate routing; curator assist |
| Auth | `lib/admin/auth.test.ts` | Access JWT, forged email header ignored, prod fail-closed |
| Net / rate limit | `lib/net.test.ts`, `lib/rateLimit.test.ts` | private hosts, windowed limiter |

**There are zero component tests, zero tests for price labels, fonts, mood presets, compare defaults, match labels, blurbs, or Greek slugs.** The UI bugs below are untested, which is why production can ship `$`, Arial, empty compare, and `scores estimate` while the suite is green. That is the point of this section.

`promoteRecord` already does `slugify(name) || "cafe"`. Greek-only names collapse to the literal slug `cafe`, then `cafe-2`, `cafe-3`. The pipeline tests never use a Greek name, so they stay green while the bug exists.

---

## 6. Failing tests to insert first (RED)

Write these **before** production edits. Put them in the files named. Run each file. Expected failures are spelled out so you can tell a good RED from a broken import.

Use the repo’s Vitest style (`import { describe, expect, it } from "vitest"`).

---

### 6.1 Greek slugs — **RED today** (proven)

**Bug.** `lib/slug.ts` keeps only `[a-z0-9]`. Executable check (same algorithm as source), 2026-09-17:

```
"Καφές" => ""
"Μπλε Καφέ" => ""
"Café Ávissinia" => "cafe-avissinia"
"Φίλτρο & Espresso" => "and-espresso"
"TAF Coffee" => "taf-coffee"
```

Latin still works. Greek is discarded. Mixed names keep only the Latin tokens (`and-espresso` drops Φίλτρο). `promoteRecord` then stores `cafe`.

**Closest check already run:** `node` reproducing `slugify`. Existing `lib/slug.test.ts` does not mention Greek, so `npm test` stays green.

**Add to `lib/slug.test.ts`:**

```ts
it("keeps Greek letters in kebab slugs", () => {
  expect(slugify("Καφές")).toBe("καφές")
  expect(slugify("Μπλε Καφέ")).toBe("μπλε-καφέ")
})

it("does not drop the Greek half of a mixed name", () => {
  expect(slugify("Φίλτρο & Espresso")).toBe("φίλτρο-and-espresso")
})
```

**Expected RED:** `slugify("Καφές")` is `""`, assertion fails. Not an import error.

**GREEN path:** allow Unicode letters in the kept set (e.g. `\p{L}` / `\p{N}` with the `u` flag). Keep `&` → `and`. Keep Latin diacritic stripping as today’s tests require (`Café` → `cafe`). Do not break `uniqueSlug`. After GREEN, add a pipeline test that `promoteRecord` with `name: "Καφές Λόφος"` does **not** yield slug `cafe`.

**Do not** transliterate to Latin as the primary slug. This product is Attica; `radaroma.gr` will need Greek URLs.

---

### 6.2 Euro price labels — **RED today** (API missing / `$` in source)

**Bug.** Dollar signs, duplicated in three UI files. No shared helper, so nothing in `lib/` can fail yet.

**Add `lib/price.test.ts` first** (file will fail to import until you add `lib/price.ts`):

```ts
import { describe, expect, it } from "vitest"
import { priceTierLabel, PRICE_TIER_LABELS } from "./price"

describe("priceTierLabel", () => {
  it("renders Attica prices in euro signs, not dollars", () => {
    expect(priceTierLabel(1)).toBe("€")
    expect(priceTierLabel(2)).toBe("€€")
    expect(priceTierLabel(3)).toBe("€€€")
    expect(priceTierLabel(4)).toBe("€€€€")
  })

  it("returns empty for unknown tiers", () => {
    expect(priceTierLabel(0)).toBe("")
    expect(priceTierLabel(5)).toBe("")
  })

  it("never includes a dollar sign", () => {
    for (const label of PRICE_TIER_LABELS) {
      expect(label).not.toContain("$")
    }
  })
})
```

**Expected RED:** `Cannot find module './price'` — that is a valid compile-time RED. Then implement `lib/price.ts`. Then replace the three copied `PRICE_TIER_LABEL` arrays and CafeExplorer’s `$` option labels with `priceTierLabel`.

**Closest file-level lock after GREEN** (optional, still node):

```ts
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
```

Put file-read tests under `lib/` only if you want them in the current include glob, or extend `vitest.config.ts` `include` carefully. Do not test Tailwind class strings.

---

### 6.3 Arial / Geist brand — **RED today** (file contract)

**Bug.** `app/globals.css` line 30: `font-family: Arial, Helvetica, sans-serif;` while `--font-sans: var(--font-geist-sans)`. Layout loads Geist and never applies `font-sans` on `body`.

A visual font test in Vitest is a bad test (no browser). The closest honest check is a source contract.

**Add `lib/brand/type-contract.test.ts`:**

```ts
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
    expect(layout()).not.toMatch(/from "next\/font\/google".*Geist/s)
    expect(layout()).not.toMatch(/\bGeist\b/)
    expect(layout()).not.toMatch(/\bGeist_Mono\b/)
  })
})
```

**Expected RED:** first test hits `Arial`. After you switch body to the CSS variable / `font-sans`, it still fails on Geist until layout loads the new faces.

**GREEN path (design):**

| Role | Face |
|---|---|
| Display / H1 / wordmark | **Cormorant Garamond** (Greek coverage) or **Fraunces** if you verify Greek glyphs before locking |
| Body / UI | **Source Sans 3** or **IBM Plex Sans** (Greek-capable) |
| Numeric | body with `tabular-nums`, or IBM Plex Mono at small size |

Banned as primary: Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Geist, Lobster, Playfair-everywhere.

`body` must actually *use* the loaded face (`className` includes the font variables **and** `font-sans`, and `globals.css` must not override with Arial).

---

### 6.4 Match label vs static `/ 5` — **RED today** (API missing)

**Bug.** `rankScore` is always shown as `4.4 / 5` even at `DEFAULT_WEIGHTS`. That is a star. Intended: hide the composite at default weights; when the visitor has steered, show `match 4.4` (tabular).

**Add to `lib/ranking.test.ts`:**

```ts
import { formatMatchLabel, isCustomWeights, DEFAULT_WEIGHTS } from "./ranking"

describe("formatMatchLabel", () => {
  it("hides the composite at default weights", () => {
    expect(isCustomWeights(DEFAULT_WEIGHTS)).toBe(false)
    expect(formatMatchLabel(4.4, DEFAULT_WEIGHTS)).toBeNull()
  })

  it("labels a steered ranking as a match, not a /5 star", () => {
    const laptop = { ...DEFAULT_WEIGHTS, workFriendliness: 2, quietVibe: 2 }
    expect(isCustomWeights(laptop)).toBe(true)
    expect(formatMatchLabel(4.351, laptop)).toBe("match 4.4")
    expect(formatMatchLabel(4.351, laptop)).not.toMatch(/\/\s*5/)
  })

  it("returns null when there is no score", () => {
    const laptop = { ...DEFAULT_WEIGHTS, workFriendliness: 2 }
    expect(formatMatchLabel(null, laptop)).toBeNull()
  })
})
```

**Expected RED:** `formatMatchLabel` is not exported.

**GREEN:** implement next to `rankCafes`. Then RankedCafeCard / detail / compare “Overall” row use it. Compare overlay itself stays; the table’s “Overall / 5” should follow the same rule.

---

### 6.5 Mood presets — **RED today** (API missing)

Most people will not drag five sliders. Four named chips set weights. Sliders remain for the fussy.

**Add `lib/moods.test.ts`:**

```ts
import { describe, expect, it } from "vitest"
import { DEFAULT_WEIGHTS, rankCafes, type Weights } from "./ranking"
import { MOODS, moodWeights, type MoodId } from "./moods"
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore } from "@/lib/schemas/score"

const cafe = (id: string, name: string): Cafe => ({
  id,
  slug: id,
  name,
  address: "x",
  lat: null,
  lng: null,
  neighborhood: "Test",
  priceTier: 2,
  source: "owner",
  status: "verified",
  confidenceScore: null,
  verificationNotes: null,
})

const score = (id: string, values: Partial<CafeScore> = {}): CafeScore => ({
  cafeId: id,
  scoredBy: "curator",
  quality: 3,
  priceValue: 3,
  workFriendliness: 3,
  quietVibe: 3,
  specialtyDepth: 3,
  ...values,
})

describe("MOODS", () => {
  it("exposes four public moods in a stable order", () => {
    expect(MOODS.map((m) => m.id)).toEqual(["laptopDay", "talk", "filterNerd", "goodCheap"])
  })

  it("never uses default-equal weights (a mood must steer)", () => {
    for (const mood of MOODS) {
      expect(mood.weights).not.toEqual(DEFAULT_WEIGHTS)
    }
  })
})

describe("moodWeights", () => {
  it("returns a full Weights object for each id", () => {
    const ids: MoodId[] = ["laptopDay", "talk", "filterNerd", "goodCheap"]
    for (const id of ids) {
      const w: Weights = moodWeights(id)
      expect(w.workFriendliness).toBeTypeOf("number")
    }
  })

  it("laptopDay ranks a quiet work café above a loud specialty bar", () => {
    const work = cafe("work", "Work Room")
    const loud = cafe("loud", "Loud Bar")
    const scores = new Map([
      ["work", score("work", { workFriendliness: 5, quietVibe: 5, specialtyDepth: 2, quality: 3, priceValue: 3 })],
      ["loud", score("loud", { workFriendliness: 1, quietVibe: 1, specialtyDepth: 5, quality: 5, priceValue: 3 })],
    ])
    const order = rankCafes([work, loud], scores, moodWeights("laptopDay"))
    expect(order[0].cafe.slug).toBe("work")
  })

  it("filterNerd ranks the specialty bar first", () => {
    const work = cafe("work", "Work Room")
    const loud = cafe("loud", "Loud Bar")
    const scores = new Map([
      ["work", score("work", { workFriendliness: 5, quietVibe: 5, specialtyDepth: 2, quality: 3, priceValue: 3 })],
      ["loud", score("loud", { workFriendliness: 1, quietVibe: 1, specialtyDepth: 5, quality: 5, priceValue: 3 })],
    ])
    const order = rankCafes([work, loud], scores, moodWeights("filterNerd"))
    expect(order[0].cafe.slug).toBe("loud")
  })
})
```

**Expected RED:** missing `./moods`.

**GREEN weights (lock these numbers so the tests stay deterministic):**

```
laptopDay:  { quality: 1,   priceValue: 1.2, workFriendliness: 2,   quietVibe: 1.8, specialtyDepth: 0.8 }
talk:       { quality: 1.4, priceValue: 1,   workFriendliness: 0.6, quietVibe: 0.3, specialtyDepth: 1 }
filterNerd: { quality: 1.8, priceValue: 0.8, workFriendliness: 0.6, quietVibe: 1.2, specialtyDepth: 2 }
goodCheap:  { quality: 1,   priceValue: 2,   workFriendliness: 0.8, quietVibe: 0.8, specialtyDepth: 0.6 }
```

Labels for chips: `Laptop day`, `Talk`, `Filter nerd`, `Good & cheap`. Wire them as the first control in CafeExplorer; they call the same `setWeights` the sliders use. No second ranking function.

---

### 6.6 Default compare pair — **RED today** (API missing)

**Bug.** `/compare` with no query shows a checkbox sheet and no radar.

**Add `lib/compare.test.ts`:**

```ts
import { describe, expect, it } from "vitest"
import { defaultCompareSlugs, radarDistance } from "./compare"
import type { RankedCafe } from "./ranking"
import type { Cafe } from "@/lib/schemas/cafe"
import type { CafeScore } from "@/lib/schemas/score"

const ranked = (
  slug: string,
  name: string,
  values: Pick<CafeScore, "quality" | "priceValue" | "workFriendliness" | "quietVibe" | "specialtyDepth">,
): RankedCafe => ({
  cafe: {
    id: slug,
    slug,
    name,
    address: "x",
    lat: null,
    lng: null,
    neighborhood: "Test",
    priceTier: 2,
    source: "owner",
    status: "verified",
    confidenceScore: null,
    verificationNotes: null,
  } satisfies Cafe,
  score: { cafeId: slug, scoredBy: "curator", ...values },
  rankScore: 3,
})

describe("radarDistance", () => {
  it("is 0 for identical shapes", () => {
    const a = { quality: 3, priceValue: 3, workFriendliness: 3, quietVibe: 3, specialtyDepth: 3 }
    expect(radarDistance(a, a)).toBe(0)
  })
})

describe("defaultCompareSlugs", () => {
  const quiet = ranked("foyer", "Foyer", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })
  const social = ranked("underdog", "Underdog", { quality: 5, priceValue: 3, workFriendliness: 4, quietVibe: 3, specialtyDepth: 5 })
  const clone = ranked("clone", "Clone", { quality: 5, priceValue: 4, workFriendliness: 2, quietVibe: 4, specialtyDepth: 4 })

  it("prefers URL slugs when at least two are valid", () => {
    expect(defaultCompareSlugs([quiet, social], ["underdog", "foyer"])).toEqual(["underdog", "foyer"])
  })

  it("picks the two most different shapes when the URL is empty", () => {
    expect(defaultCompareSlugs([quiet, social, clone], [])).toEqual(["foyer", "underdog"])
  })

  it("ignores cafés without scores", () => {
    const bare: RankedCafe = { cafe: quiet.cafe, score: null, rankScore: null }
    expect(defaultCompareSlugs([bare, quiet, social], [])).toEqual(["foyer", "underdog"])
  })
})
```

**Expected RED:** missing `./compare`.

**GREEN:** Euclidean distance on the five axes. Among scored cafés, pick the pair with maximum distance; tie-break by `(slugA, slugB)` lexicographic on the sorted pair, return in that sorted order unless URL order was provided. URL wins only if ≥2 slugs match ranked cafés (keep URL order, cap at 3 — compare already allows 3). `ComparePicker` should initialize with `defaultCompareSlugs(ranked, initialSlugs)` so first paint has an overlay.

After GREEN, add a small test or comment that `?cafes=` still overrides. Build a **Copy comparison** control that writes the current URL (origin + `/compare?cafes=`). Clipboard in jsdom is a bad test; skip it. Browser-verify once.

---

### 6.7 Curator blurb vs “scores estimate” — **RED today** (API missing)

**Bug.** All 20 seed `notes` end with `; scores estimate`. They are stored as `verification_notes` and rendered on detail pages.

Do **not** change the pipeline’s meaning of `verificationNotes` for agent reasoning. Add a display helper so the public page never shows the draft disclaimer.

**Add `lib/blurb.test.ts`:**

```ts
import { describe, expect, it } from "vitest"
import { curatorBlurb } from "./blurb"

describe("curatorBlurb", () => {
  it("strips draft disclaimers so public pages do not say scores estimate", () => {
    expect(
      curatorBlurb("championship-linked house roaster with brunch, courtyard, and retail; scores estimate"),
    ).toBe("championship-linked house roaster with brunch, courtyard, and retail.")
  })

  it("strips approximate-coords disclaimers", () => {
    expect(
      curatorBlurb("roastery-backed specialty boutique on Kifisia's main avenue; coords approximate; scores estimate"),
    ).toBe("roastery-backed specialty boutique on Kifisia's main avenue.")
  })

  it("returns null for empty or disclaimer-only notes", () => {
    expect(curatorBlurb(null)).toBeNull()
    expect(curatorBlurb("scores estimate")).toBeNull()
    expect(curatorBlurb("; coords approximate; scores estimate")).toBeNull()
  })
})
```

**Expected RED:** missing `./blurb`.

**GREEN:** strip case-insensitive `scores estimate` and `coords approximate`, trim separators, ensure a final period if there is leftover prose. Use this on the public detail page instead of raw `verificationNotes`. Leave admin views showing the raw field.

Also stop putting `; scores estimate` in new seed copy when you rewrite blurbs. Cleaning JSON is product data, not a secret test pass: rewrite the 20 notes into real sentences (they already have the content). That is allowed and desired.

---

### 6.8 Best-for chips — **RED today** (API missing)

Inferred from scores. No new columns.

**Add `lib/bestFor.test.ts`:**

```ts
import { describe, expect, it } from "vitest"
import { bestForChips } from "./bestFor"
import type { CafeScore } from "@/lib/schemas/score"

const base: CafeScore = {
  cafeId: "00000000-0000-0000-0000-000000000001",
  scoredBy: "curator",
  quality: 3,
  priceValue: 3,
  workFriendliness: 3,
  quietVibe: 3,
  specialtyDepth: 3,
}

describe("bestForChips", () => {
  it("emits chips for axes scoring 4 or 5, in axis order", () => {
    expect(bestForChips({ ...base, workFriendliness: 5, quietVibe: 4, specialtyDepth: 2 })).toEqual([
      "laptop",
      "quiet",
    ])
  })

  it("returns empty when nothing stands out", () => {
    expect(bestForChips(base)).toEqual([])
  })

  it("maps specialty to filter and priceValue to value", () => {
    expect(bestForChips({ ...base, priceValue: 5, specialtyDepth: 5 })).toEqual(["value", "filter"])
  })
})
```

Chip ids: `quality` → `quality`, `priceValue` → `value`, `workFriendliness` → `laptop`, `quietVibe` → `quiet`, `specialtyDepth` → `filter`. Threshold: `>= 4`.

---

### 6.9 Radar labels at card size — **RED today** (API missing)

**Add to `lib/radar.test.ts`:**

```ts
import { axisLabelsVisible } from "./radar"

describe("axisLabelsVisible", () => {
  it("hides labels on card-sized charts", () => {
    expect(axisLabelsVisible(96)).toBe(false)
  })

  it("shows labels on detail/compare charts", () => {
    expect(axisLabelsVisible(280)).toBe(true)
  })

  it("honors an explicit override", () => {
    expect(axisLabelsVisible(96, true)).toBe(true)
    expect(axisLabelsVisible(280, false)).toBe(false)
  })
})
```

Threshold: hide when `size < 140` unless overridden. `RadarChart` must call this (default `showLegend` already exists; add `showAxisLabels={axisLabelsVisible(size)}`).

**LOCK:** do not change `polygonPoints` / `axisAngle` behavior. Existing geometry tests stay green.

---

### 6.10 Single `SCORE_AXES` — **LOCK + tiny RED if you re-export**

**Add to `lib/ranking.test.ts`:**

```ts
import { SCORE_AXES as rankingAxes } from "./ranking"
import { SCORE_AXES as schemaAxes } from "@/lib/schemas/score"

it("does not drift from the schema axis list", () => {
  expect([...rankingAxes]).toEqual([...schemaAxes])
})
```

This likely **PASSES today** (same five strings). After GREEN of a refactor, `ranking.ts` should import `SCORE_AXES` from `lib/schemas/score.ts` instead of redeclaring it. The lock prevents silent drift.

---

### 6.11 Tests you must not write

- Snapshot tests of full homepage HTML (will churn on copy).
- Tests that `fetch` Unsplash or the live site.
- Tests that mock the LLM to prove a font is pretty.
- Playwright until the unit helpers above are green. Phase 8 E2E in `docs/megaplan.md` is still deferred unless you already have Playwright in `package.json` (you do not).
- Tests that encode current truncation (`truncate` class) as desired behavior. Truncation is a bug.

---

### 6.12 Impractical as unit tests (browser after GREEN)

| Issue | Why a new Vitest file is a bad test | Closest check |
|---|---|---|
| Homepage duplicate lists | Structure, not a pure function | After refactor, `/` has one café list driven by CafeExplorer; no second “Top picks” grid of the same three. Prove in the browser. |
| Name truncation | CSS | Remove `truncate` from café names; two lines allowed (`line-clamp-2` max). Screenshot a long name (Handpickers Coffee Roasters) on desktop and a 390px viewport. |
| Empty chat as hero | Layout | Concierge is a compact strip or chip, not the second full-width card. |
| Stock photography | Human asset | No café card `img src` pointing at unsplash/pexels/generic `/placeholder`. |
| Mobile bottom bar | Layout | 390px viewport: Cafés / Compare / Ask / Submit reachable. |
| Contrast | Needs computed style | Ink vs paper should look like `#1F1612` on `#F4EDE3`, not `coffee-400` on `coffee-50` for body text. |
| Wordmark as radar-O | SVG craft | Visual only. Can be inline SVG. Do not add a 200KB illustration library. |

---

## 7. Design system to implement (coherent package)

**Aesthetic:** editorial paper. Independent café magazine, not SaaS, not “coffee shop script font + latte.”

**Decoration:** intentional but quiet. Paper grain optional. Hairline rules. One copper stain on the radar fill.

**Layout:** hybrid. Homepage is the tool (not a marketing poster). Detail can be a magazine spread. Do not center everything.

**Color (tokens — put in `app/globals.css`, keep `coffee-*` names or add these beside them):**

| Token | Hex | Use |
|---|---|---|
| Paper | `#F4EDE3` | page background (dirtier than current `#FAF6F0`) |
| Ink | `#1F1612` | body text (darker than `#463523`) |
| Muted | `#7A6556` | secondary |
| Hairline | `#D9C7B3` | borders |
| Copper | `#B5683A` | slider fill, active mood, primary button, radar fill ~25% opacity |
| Sage | `#6F7F68` | compare series 2 (already close to current) |
| Wine | `#7A4A55` | compare series 3 — **replace** `#9b8cb8` lavender in `SERIES_COLORS` |
| Verified stamp | copper, not `sky-100` / `green-50` | community / AI-verified |

No second bright accent. No dark mode.

**Radar series:** `["#B5683A", "#6F7F68", "#7A4A55"]` plus one spare if you keep a fourth.

**Spacing:** 8px base, comfortable. Cards are not nested cards. Outer radius = inner radius + padding when nested.

**Motion:** 150–200ms on list reorder and radar polygon. `transition-property` explicit, never `all`. Chip press `scale(0.96)`. `prefers-reduced-motion` respected.

**Type scale (starting point):** display ~40–48px homepage one-liner; café name ~22–28px; body 16px; chips 13px. `text-wrap: balance` on headings. Tabular nums on scores and slider multipliers.

**Wordmark:** “Radaroma” in the display serif; O = five-axis pentagon; small-caps `ATTICA`. Favicon / PWA icons should be that mark (`scripts/generate-icons.ts` exists — regenerate after the SVG exists). Delete leftover Next starter SVGs in `public/` when you touch assets.

---

## 8. Screen-by-screen spec

### `/` Home

Kill: centered SaaS hero, search-as-hero, defensive aggregator sentence, duplicate Top picks, ☕, large empty concierge.

Build: wordmark + one line. Mood chips. Five sliders as the next row (or “adjust weights” disclosure if you must save height — prefer visible). The ranked list immediately. Concierge as a compact strip at the bottom of the first screen or a chip. Search lives on `/cafes`.

Do not lead with the three highest default-weight scores as a separate band. If you want a “today’s shape” trio, pick three *disagreeing* silhouettes (use `radarDistance`), not `slice(0, 3)` of `getPublicCafes()`.

### `/cafes`

Same explorer as home, full list, neighborhood + euro price filters. Optional grouping by neighborhood as chapters (headings, not only a `<select>`). Names wrap.

### `/cafes/[slug]`

Spread, not admin: name in display serif; euro tier; neighborhood; address as a maps link (`https://www.google.com/maps/search/?api=1&query=` + encoded address is enough; do not invent coordinates UI). Large radar with labels. Breakdown bars in copper. `curatorBlurb(verificationNotes)`. `bestForChips`. Actions: `Compare` → `/compare?cafes={this},` + `defaultCompareSlugs` partner; scoped concierge. No raw “scores estimate.”

Photo slot: if no real image, paper + large radar, not emoji.

### `/compare`

On load, overlay already visible via §6.6. Radar large. Copper / sage / wine. Legend = names. Checkboxes below, grouped by neighborhood if easy. Copy link. URL `?cafes=` remains source of truth when present.

### `/submit`

Keep the form and verify pipeline. Visual pass only (type, euro in helper text if any, no sky badges). Do not restyle by breaking honeypot / Zod.

### `/admin`

Out of scope except: do not break Access JWT auth tests. You may leave admin visually as-is.

---

## 9. Implementation order (do not reshuffle)

Each step is a TDD cycle. Commit when the gate is green if the user asked for commits; otherwise stop at a clean tree per step.

1. **§6.1 slugify Greek** + promote test that Greek names do not become `cafe`.
2. **§6.2 euro helper** + replace three UI copies.
3. **§6.4 match label** + stop showing `/ 5` at default weights.
4. **§6.5 moods** + chips on CafeExplorer.
5. **§6.6 default compare** + Copy link control.
6. **§6.7 blurb** + rewrite seed notes (strip disclaimers, keep the actual sentence).
7. **§6.8 best-for** on cards/detail.
8. **§6.9 radar labels** + **§6.10 SCORE_AXES import**.
9. **§6.3 type + color tokens** (Arial gone, Geist gone, copper in, wine series).
10. **Homepage information architecture** (one list, concierge demoted, search demoted). Browser proof.
11. **Wordmark / emoji removal / starter SVG deletion / community stamp.**
12. **Mobile pass** at 390px.

Do not start with photography, OG image generation, bilingual copy, or a map.

---

## 10. Ranking and agent — do not fork

`weightedScore` / `rankCafes` remain the only ranking. Moods are `Weights` objects. Concierge `queryCafesByWeights` already merges partial weights onto `DEFAULT_WEIGHTS` — keep that.

After moods exist, you may later let the concierge accept a mood id; that is **out of this pass** unless a test in `lib/agent/tools.test.ts` is added first and `WeightInputSchema` stays valid.

Existing agent tests that “defaults weights when omitted” must still pass.

---

## 11. Photography and assets (human-gated)

Implementer:

- May add a `photoUrl` field later; **do not** schema-migrate in this pass unless the user explicitly asks. A convention such as `/photos/{slug}.jpg` with a graceful miss is enough if you need a slot.
- Must not hotlink random CDNs.
- Must delete `public/vercel.svg`, `next.svg`, `globe.svg`, `window.svg`, `file.svg` when touching `public/`.
- Should leave a short note in the PR/report: “photos still needed for these slugs: …” listing all 20 from `data/seed/cafes.athens.json`.

The 20 current shops: TAF Coffee, The Underdog, Foyer Espresso Bar, Mind The Cup, KUDU Coffee, Samba Coffee Roasters, Create Coffee Roasters, Taresso Artisan Coffee Roasters, Little Tree Books & Coffee, Dope Roasting Co., Picky Specialty Coffee & Brunch, Jaf Specialty Coffee, Mokka Specialty Coffee, Kaya, Handpickers Coffee Roasters, Honest Coffee Developers, Hunch Specialty Coffee, MOUR Athens, Il Toto Roastery Boutique, SweetLeaf.

---

## 12. Verification gate (every step)

```bash
npm run lint
npx tsc --noEmit
npm test
```

Then exercise the real surface (`npm run dev` or prod):

- Home: moods reorder the list; names fully readable; no second copy of the same three cards; concierge is not the hero.
- Detail: euro, blurb without “scores estimate”, maps link, compare deep-link.
- Compare: radar on first paint without query params; URL pair still wins.
- Submit and admin: still function (do not regress verify / Access).

Report: what changed, RED evidence (file + failure), GREEN evidence (file + pass), browser proof, leftover human inputs (photos, score review — seed scores are still drafts per `AGENTS.md`).

---

## 13. Anti-patterns (reject these in review)

- “Just apply Geist to body” — that fixes the Arial bug and keeps the wrong brand.
- Leading the homepage with ChatGPT-style empty state.
- A big `4.9` in a circle.
- Unsplash laptop + latte hero.
- Poppins + brown rounded cards + emoji.
- A second `rankCafes2` for the UI.
- Weakening `lib/admin/auth.test.ts` or SSRF tests to make styling easier.
- Inventing café hours.
- `transition: all`.
- Nested cards in cards.
- Sky / indigo Tailwind chips.
- Dollar price tiers “because everyone understands $.”

---

## 14. Out of scope

Public average ratings, busyness, offline cache, streaming chat, full map product, dark mode, mascot, bilingual UI strings (fonts must still support Greek), Playwright suite, vinext migration, changing LLM provider, Cloudflare Access rewiring.

---

## 15. Acceptance

You are done when:

1. All new tests in §6 that you attempted are GREEN, and the original 126 are still GREEN (count will be higher).
2. `slugify("Καφές")` is not `""`.
3. No `$` / `$$` price labels on public café UI.
4. `app/globals.css` does not set Arial as body.
5. Default-weight views do not present a star-like `/ 5` as the hero metric.
6. `/compare` shows an overlay with zero query params.
7. Public detail does not contain the substring `scores estimate`.
8. Homepage is the ranking instrument with mood chips; concierge is subordinate.
9. Radar card silhouettes have no axis words; detail/compare radars do.
10. You have not added Unsplash interiors or a new chart library.

If you must stop mid-way, stop at a GREEN suite after a complete §9 step, and say which step is next.

---

## 16. Source trail

- Live: https://radaroma.com (home, The Underdog, compare), 2026-09-17.
- Type bug: `app/globals.css`, `app/layout.tsx`.
- Duplicate dollars: `RankedCafeCard.tsx`, `CafeExplorer.tsx`, `app/cafes/[slug]/page.tsx`.
- Duplicate lists: `app/page.tsx` (`top` + `CafeExplorer compact`).
- Empty compare: `components/ComparePicker.tsx` `useState(initialSlugs...)`.
- Seed disclaimers: `data/seed/cafes.athens.json` `notes`; seed script writes `verification_notes`; detail renders `cafe.verificationNotes`.
- Slug collapse: `lib/slug.ts` + `lib/pipeline/promote.ts` (`slugify(name) || "cafe"`).
- Test baseline: `npm test` → 20 files, 126 tests, all pass, 2026-09-17.
- Greek slug reproduction: same keep-set as `lib/slug.ts`, `"Καφές" => ""`, `"Φίλτρο & Espresso" => "and-espresso"`.
)
