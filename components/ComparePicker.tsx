"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import { AXIS_LABELS } from "@/lib/radar"
import type { RankedCafe } from "@/lib/ranking"
import { SCORE_AXES, type ScoreAxis } from "@/lib/schemas/score"

const MAX_COMPARE = 3

interface ComparePickerProps {
  ranked: RankedCafe[]
  initialSlugs: string[]
}

export default function ComparePicker({ ranked, initialSlugs }: ComparePickerProps) {
  const [selected, setSelected] = useState<string[]>(
    initialSlugs.filter((slug) => ranked.some((r) => r.cafe.slug === slug)).slice(0, MAX_COMPARE),
  )

  const handleToggle = (slug: string) => {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug)
      if (current.length >= MAX_COMPARE) return current
      return [...current, slug]
    })
  }

  const chosen = useMemo(
    () => selected.map((slug) => ranked.find((r) => r.cafe.slug === slug)).filter((r): r is RankedCafe => Boolean(r)),
    [selected, ranked],
  )

  const chartSeries = chosen
    .filter((r): r is RankedCafe & { score: NonNullable<RankedCafe["score"]> } => r.score !== null)
    .map((r, i) => ({
      id: r.cafe.id,
      label: r.cafe.name,
      values: {
        quality: r.score.quality,
        priceValue: r.score.priceValue,
        workFriendliness: r.score.workFriendliness,
        quietVibe: r.score.quietVibe,
        specialtyDepth: r.score.specialtyDepth,
      },
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }))

  return (
    <div className="space-y-8">
      <fieldset className="rounded-xl border border-coffee-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-coffee-700">
          Pick 2–3 cafés ({selected.length}/{MAX_COMPARE})
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((r) => {
            const checked = selected.includes(r.cafe.slug)
            const disabled = !checked && selected.length >= MAX_COMPARE
            return (
              <label
                key={r.cafe.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  checked ? "bg-coffee-100 text-coffee-900" : "hover:bg-coffee-100"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => handleToggle(r.cafe.slug)}
                  className="accent-coffee-700"
                />
                <span className="truncate">{r.cafe.name}</span>
                <span className="ml-auto shrink-0 text-xs text-coffee-400">
                  {r.cafe.neighborhood}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {chosen.length < 2 ? (
        <p className="rounded-xl border border-dashed border-coffee-300 p-10 text-center text-sm text-coffee-500">
          Select at least two cafés to overlay their radar charts.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex items-center justify-center rounded-xl border border-coffee-200 bg-white p-6">
            <RadarChart series={chartSeries} size={300} className="text-coffee-800" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coffee-200 text-left">
                  <th className="py-2 pr-4 font-medium text-coffee-500">Axis</th>
                  {chosen.map((r) => (
                    <th key={r.cafe.id} className="py-2 pr-4 font-semibold text-coffee-800">
                      <Link href={`/cafes/${r.cafe.slug}`} className="hover:text-coffee-800">
                        {r.cafe.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCORE_AXES.map((axis: ScoreAxis) => (
                  <tr key={axis} className="border-b border-coffee-100">
                    <td className="py-2 pr-4 text-coffee-600">{AXIS_LABELS[axis]}</td>
                    {chosen.map((r) => (
                      <td key={r.cafe.id} className="py-2 pr-4 font-mono text-coffee-800">
                        {r.score ? `${r.score[axis]} / 5` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 font-medium text-coffee-600">Average</td>
                  {chosen.map((r) => (
                    <td key={r.cafe.id} className="py-2 pr-4 font-mono font-semibold tabular-nums text-coffee-900">
                      {r.rankScore !== null ? r.rankScore.toFixed(1) : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
