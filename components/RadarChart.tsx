"use client"

import {
  axisLabelsVisible,
  axisPoints,
  MAX_SCORE,
  polygonPoints,
  ringPoints,
  toSvgPoints,
} from "@/lib/radar"
import { t, type Locale } from "@/lib/i18n"
import type { ScoreAxis } from "@/lib/schemas/score"

const VIEWBOX = 220
const CENTER = VIEWBOX / 2
const RADIUS = 68
const LABEL_OFFSET = 16

// Zine palette: copper / sage / wine. Compare caps at three series.
export const SERIES_COLORS = ["#b5683a", "#6f7f68", "#7a4a55"]

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
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={size}
        height={size}
        className="select-none"
      >
        {/* score rings 1-5 */}
        {[1, 2, 3, 4, 5].map((ring) => (
          <polygon
            key={ring}
            points={toSvgPoints(ringPoints(ring, n, RADIUS, CENTER, CENTER))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={ring === MAX_SCORE ? 0.35 : 0.12}
            strokeWidth={ring === MAX_SCORE ? 1.2 : 0.8}
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
            strokeOpacity={0.15}
            strokeWidth={0.8}
          />
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
            fillOpacity={0.25}
            stroke={s.color}
            strokeWidth={2}
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
