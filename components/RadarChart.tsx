"use client"

import {
  axisLabelsVisible,
  axisPoints,
  MAX_SCORE,
  polygonPoints,
  ringPoints,
  SERIES_COLORS,
  toSvgPoints,
} from "@/lib/radar"
import { t, type Locale } from "@/lib/i18n"
import type { ScoreAxis } from "@/lib/schemas/score"

const VIEWBOX = 220
const CENTER = VIEWBOX / 2
const RADIUS = 68
const LABEL_OFFSET = 16
// Without axis words the label gutter is dead space: crop the viewBox so
// the silhouette fills the box (list cards read at a glance).
const COMPACT_PAD = 6
const COMPACT_VIEWBOX = `${CENTER - RADIUS - COMPACT_PAD} ${CENTER - RADIUS - COMPACT_PAD} ${2 * (RADIUS + COMPACT_PAD)} ${2 * (RADIUS + COMPACT_PAD)}`

export { SERIES_COLORS }

export interface RadarSeries {
  id: string
  label: string
  values: Record<ScoreAxis, number>
  color: string
}

interface RadarChartProps {
  series: RadarSeries[]
  size?: number
  showLegend?: boolean
  showAxisLabels?: boolean
  className?: string
  locale?: Locale
}

export default function RadarChart({
  series,
  size = 160,
  showLegend = true,
  showAxisLabels,
  className = "",
  locale = "en",
}: RadarChartProps) {
  const AXIS_LABELS = t(locale).axes
  const labelsVisible = axisLabelsVisible(size, showAxisLabels)
  const axes = Object.keys(AXIS_LABELS) as ScoreAxis[]
  const n = axes.length
  const axisVerts = axisPoints(n, RADIUS, CENTER, CENTER)
  const compact = !labelsVisible
  const summary = series
    .map(
      (s) =>
        `${s.label}: ${axes
          .map((a) => `${AXIS_LABELS[a].toLowerCase()} ${s.values[a]}/5`)
          .join(", ")}`,
    )
    .join("; ")

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 ${className}`}
      role="img"
      aria-label={`Radar chart: ${summary}`}
    >
      <svg
        viewBox={compact ? COMPACT_VIEWBOX : `0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={size}
        height={size}
        className="select-none"
      >
        {compact && <title>{summary}</title>}
        {/* score rings 1-5 */}
        {[1, 2, 3, 4, 5].map((ring) => (
          <polygon
            key={ring}
            points={toSvgPoints(ringPoints(ring, n, RADIUS, CENTER, CENTER))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={ring === MAX_SCORE ? 0.45 : compact ? 0.18 : 0.12}
            strokeWidth={ring === MAX_SCORE ? 1.4 : 0.8}
          />
        ))}
        {/* axis lines */}
        {axisVerts.map((p, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity={compact ? 0.25 : 0.15}
            strokeWidth={0.8}
          />
        ))}
        {/* compact: axis ticks stand in for the hidden words */}
        {compact && axisVerts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="currentColor" fillOpacity={0.5} />
        ))}
        {/* axis labels — hidden below AXIS_LABEL_MIN_SIZE unless overridden */}
        {labelsVisible && axisVerts.map((p, i) => (
          <text
            key={i}
            x={CENTER + (p.x - CENTER) * ((RADIUS + LABEL_OFFSET) / RADIUS)}
            y={CENTER + (p.y - CENTER) * ((RADIUS + LABEL_OFFSET) / RADIUS)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-coffee-500 text-[10px] font-medium"
          >
            {AXIS_LABELS[axes[i]]}
          </text>
        ))}
        {/* data polygons */}
        {series.map((s) => (
          <polygon
            key={s.id}
            points={toSvgPoints(
              polygonPoints(axes.map((a) => s.values[a]), RADIUS, CENTER, CENTER),
            )}
            fill={s.color}
            fillOpacity={compact ? 0.38 : 0.25}
            stroke={s.color}
            strokeWidth={compact ? 2.6 : 2}
            strokeLinejoin="round"
            className="transition-[points] duration-200"
          />
        ))}
      </svg>
      {showLegend && series.length > 1 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs text-coffee-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
