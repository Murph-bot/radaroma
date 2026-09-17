import Link from "next/link"
import PentagonMark from "@/components/PentagonMark"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import { t, type Locale } from "@/lib/i18n"
import { priceTierLabel } from "@/lib/price"
import { isCustomWeights, topAxis, type RankedCafe, type Weights } from "@/lib/ranking"

interface RankedCafeCardProps {
  ranked: RankedCafe
  weights: Weights
  // 1-based position in the current ordering; omitted for unranked contexts.
  rank?: number
  locale?: Locale
}

export default function RankedCafeCard({ ranked, weights, rank, locale = "en" }: RankedCafeCardProps) {
  const s = t(locale)
  const { cafe, score, rankScore } = ranked
  const isCommunity = cafe.source === "public_submission"
  const custom = isCustomWeights(weights)
  const strongest = score ? topAxis(score) : null

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group relative flex items-center gap-4 rounded-xl border border-coffee-200 bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-coffee-700/40 hover:shadow-sm"
    >
      {rank !== undefined && (
        <span
          aria-label={s.card.rankAria(rank)}
          className={`absolute -left-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 font-display text-sm font-medium tabular-nums shadow-sm ${
            rank <= 3
              ? "border-copper-600 bg-copper-600 text-white"
              : "border-coffee-200 bg-coffee-50 text-coffee-700"
          }`}
        >
          {rank}
        </span>
      )}
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
          size={80}
          showLegend={false}
          className="shrink-0 text-coffee-800"
          locale={locale}
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-coffee-100">
          <PentagonMark className="h-8 w-8 text-coffee-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold text-coffee-900 group-hover:text-coffee-800">
            {cafe.name}
          </h3>
          {rankScore !== null && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors duration-200 ${
                custom ? "bg-copper-100 text-copper-700" : "bg-coffee-100 text-coffee-700"
              }`}
            >
              {rankScore.toFixed(1)} <span className="font-medium">{custom ? s.card.match : s.card.average}</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-coffee-500">
          {cafe.neighborhood} · {priceTierLabel(cafe.priceTier)}
        </p>
        {score && strongest && (
          <p className="mt-1 truncate text-xs text-coffee-600">
            {s.card.topAxis(s.axes[strongest], score[strongest])}
          </p>
        )}
        {isCommunity && (
          <span className="mt-1 inline-block rounded border border-copper-500/50 bg-copper-100 px-1.5 py-0.5 text-[11px] font-medium text-copper-700">
            {s.card.community}
          </span>
        )}
      </div>
    </Link>
  )
}
