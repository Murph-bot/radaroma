"use client"

import { useMemo, useState } from "react"
import RankedCafeCard from "@/components/RankedCafeCard"
import { AXIS_LABELS } from "@/lib/radar"
import { DEFAULT_WEIGHTS, rankCafes, type RankedCafe, type Weights } from "@/lib/ranking"
import type { ScoreAxis } from "@/lib/schemas/score"

const SLIDER_MAX = 2
const SLIDER_STEP = 0.05

const priceTiers = [
  { value: "all", label: "Any price" },
  { value: "1", label: "€" },
  { value: "2", label: "€€" },
  { value: "3", label: "€€€" },
  { value: "4", label: "€€€€" },
]

interface CafeExplorerProps {
  ranked: RankedCafe[]
  compact?: boolean
  initialQuery?: string
}

export default function CafeExplorer({
  ranked,
  compact = false,
  initialQuery = "",
}: CafeExplorerProps) {
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS })
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
  }

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS })
    setNeighborhood("all")
    setPriceTier("all")
    setQuery("")
  }

  const list = compact ? visible.slice(0, 5) : visible

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-coffee-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-coffee-500">
            Rank by what matters to you
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md px-2 py-1 text-xs font-medium text-coffee-500 transition hover:bg-coffee-200 hover:text-coffee-800"
          >
            Reset
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(AXIS_LABELS) as ScoreAxis[]).map((axis) => (
            <label key={axis} className="block">
              <span className="flex items-center justify-between text-sm text-coffee-700">
                <span>{AXIS_LABELS[axis]}</span>
                <span className="font-mono text-xs text-coffee-400">
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
                aria-label={`${AXIS_LABELS[axis]} importance`}
                className="mt-1 w-full accent-coffee-700"
              />
            </label>
          ))}
        </div>
        {!compact && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-coffee-200 pt-3">
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>Neighborhood</span>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>Price</span>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value)}
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              >
                {priceTiers.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Café name…"
                className="rounded-md border border-coffee-300 bg-white px-2 py-1 text-sm"
              />
            </label>
            <span className="ml-auto text-xs text-coffee-400">
              {list.length} of {ranked.length} cafés
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-coffee-300 p-8 text-center text-sm text-coffee-500">
            No cafés match these filters.
          </p>
        ) : (
          list.map((r) => <RankedCafeCard key={r.cafe.id} ranked={r} />)
        )}
      </div>
    </div>
  )
}
