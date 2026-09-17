import Link from "next/link"
import PentagonMark from "@/components/PentagonMark"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import { t, type Locale } from "@/lib/i18n"
import { priceTierLabel } from "@/lib/price"
import { formatMatchLabel, type RankedCafe, type Weights } from "@/lib/ranking"

interface RankedCafeCardProps {
  ranked: RankedCafe
  weights: Weights
  locale?: Locale
}

export default function RankedCafeCard({ ranked, weights, locale = "en" }: RankedCafeCardProps) {
  const s = t(locale)
  const { cafe, score, rankScore } = ranked
  const isCommunity = cafe.source === "public_submission"
  const matchLabel = formatMatchLabel(rankScore, weights, s.card.match)



  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-coffee-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-coffee-700/40 hover:shadow-sm"
    >
      {score ? (
        <RadarChart
          series={[
            {
              id: cafe.id,
              label: cafe.name,
              values: {
                quality: score.quality,
                priceValue: score.priceValue,
                workFriendliness: score.workFriendliness,
                quietVibe: score.quietVibe,
                specialtyDepth: score.specialtyDepth,
              },
              color: SERIES_COLORS[0],
            },
          ]}
          size={96}
          showLegend={false}
          className="shrink-0 text-coffee-800"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-coffee-100">
          <PentagonMark className="h-8 w-8 text-coffee-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold text-coffee-900 group-hover:text-coffee-800">
            {cafe.name}
          </h3>
          {matchLabel !== null && (
            <span className="shrink-0 rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-coffee-900">
              {matchLabel}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-coffee-500">
          {cafe.neighborhood} · {priceTierLabel(cafe.priceTier)}
        </p>
        {isCommunity && (
          <span className="mt-1 inline-block rounded border border-copper-500/50 bg-copper-100 px-1.5 py-0.5 text-[11px] font-medium text-copper-700">
            {s.card.community}
          </span>
        )}
      </div>
    </Link>
  )
}
