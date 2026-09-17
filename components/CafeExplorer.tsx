"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import RankedCafeCard from "@/components/RankedCafeCard"
import { t, type Locale } from "@/lib/i18n"
import { MOODS, moodWeights, type MoodId } from "@/lib/moods"
import { DEFAULT_WEIGHTS, rankCafes, type RankedCafe, type Weights } from "@/lib/ranking"
import type { ScoreAxis } from "@/lib/schemas/score"

const SLIDER_MAX = 2
const SLIDER_STEP = 0.05
const REORDER_MS = 260

// FLIP: when the order changes, start each card at its previous offset and
// let it slide to the new slot, so a slider nudge reads as a re-rank rather
// than a flicker.
function useSoftReorder(order: string[]) {
  const container = useRef<HTMLDivElement>(null)
  const previous = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const next = new Map<string, number>()
    for (const el of root.querySelectorAll<HTMLElement>("[data-cafe-id]")) {
      const id = el.dataset.cafeId ?? ""
      const top = el.getBoundingClientRect().top
      next.set(id, top)
      const before = previous.current.get(id)
      if (before === undefined || reduced) continue
      const delta = before - top
      if (Math.abs(delta) < 1) continue
      el.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: REORDER_MS, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
      )
    }
    previous.current = next
  }, [order])
  return container
}

interface CafeExplorerProps {
  ranked: RankedCafe[]
  showFilters?: boolean
  initialQuery?: string
  locale?: Locale
}

export default function CafeExplorer({
  ranked,
  showFilters = true,
  initialQuery = "",
  locale = "en",
}: CafeExplorerProps) {
  const s = t(locale)
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS })
  const [activeMood, setActiveMood] = useState<MoodId | null>(null)
  const [neighborhood, setNeighborhood] = useState("all")
  const [priceTier, setPriceTier] = useState("all")
  const [query, setQuery] = useState(initialQuery)

  const neighborhoods = useMemo(
    () =>
      [...new Set(ranked.map((r) => r.cafe.neighborhood).filter((n): n is string => Boolean(n)))].sort(),
    [ranked],
  )

  const visible = useMemo(() => {
    const filtered = ranked.filter((r) => {
      if (neighborhood !== "all" && r.cafe.neighborhood !== neighborhood) return false
      if (priceTier !== "all" && r.cafe.priceTier !== Number(priceTier)) return false
      if (query && !r.cafe.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
    const scores = new Map(
      filtered
        .filter((r): r is RankedCafe & { score: NonNullable<RankedCafe["score"]> } => r.score !== null)
        .map((r) => [r.cafe.id, r.score]),
    )
    return rankCafes(
      filtered.map((r) => r.cafe),
      scores,
      weights,
    )
  }, [ranked, weights, neighborhood, priceTier, query])

  const handleWeightChange = (axis: ScoreAxis, value: number) => {
    setWeights((w) => ({ ...w, [axis]: value }))
    setActiveMood(null)
  }

  const handleMood = (id: MoodId) => {
    setWeights(moodWeights(id))
    setActiveMood(id)
  }

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS })
    setActiveMood(null)
    setNeighborhood("all")
    setPriceTier("all")
    setQuery("")
  }

  const list = visible
  const order = useMemo(() => list.map((r) => r.cafe.id), [list])
  const listRef = useSoftReorder(order)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-coffee-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-medium text-coffee-900">
            {s.explorer.heading}
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md px-2 py-1 text-xs font-medium text-coffee-500 transition-colors duration-150 hover:bg-coffee-200 hover:text-coffee-800"
          >
            {s.explorer.reset}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={s.explorer.moodsAria}>
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => handleMood(mood.id)}
              aria-pressed={activeMood === mood.id}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.96] ${
                activeMood === mood.id
                  ? "border-copper-600 bg-copper-600 text-white"
                  : "border-coffee-300 bg-white text-coffee-700 hover:border-copper-500/60 hover:text-coffee-900"
              }`}
            >
              {s.moods[mood.id]}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(s.axes) as ScoreAxis[]).map((axis) => (
            <label key={axis} className="block">
              <span className="flex items-center justify-between text-sm text-coffee-700">
                <span>{s.axes[axis]}</span>
                <span
                  className={`rounded px-1 text-xs font-medium tabular-nums transition-colors duration-200 ${
                    weights[axis] === DEFAULT_WEIGHTS[axis] ? "text-coffee-600" : "bg-copper-100 text-copper-700"
                  }`}
                >
                  {weights[axis].toFixed(2)}×
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={weights[axis]}
                onChange={(e) => handleWeightChange(axis, Number(e.target.value))}
                aria-label={s.explorer.sliderAria(s.axes[axis])}
                className="mt-1 w-full accent-copper-600"
              />
            </label>
          ))}
        </div>
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-coffee-200 pt-3">
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>{s.explorer.neighborhood}</span>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              >
                <option value="all">{s.explorer.all}</option>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>{s.explorer.price}</span>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value)}
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              >
                <option value="all">{s.explorer.anyPrice}</option>
                <option value="1">€</option>
                <option value="2">€€</option>
                <option value="3">€€€</option>
                <option value="4">€€€€</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>{s.explorer.search}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={s.explorer.searchPlaceholder}
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              />
            </label>
            <span className="ml-auto text-xs text-coffee-600">
              {s.explorer.count(list.length, ranked.length)}
            </span>
          </div>
        )}
      </div>
      <div ref={listRef} className="space-y-3 pl-2 pt-2">
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-coffee-300 p-8 text-center text-sm text-coffee-500">
            {s.explorer.empty}
          </p>
        ) : (
          list.map((r, i) => (
            <div key={r.cafe.id} data-cafe-id={r.cafe.id}>
              <RankedCafeCard ranked={r} weights={weights} rank={i + 1} locale={locale} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
