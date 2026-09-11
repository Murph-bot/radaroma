import Link from "next/link"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import type { RankedCafe } from "@/lib/ranking"

const PRICE_TIER_LABEL = ["", "$", "$$", "$$$", "$$$$"]

export default function RankedCafeCard({ ranked }: { ranked: RankedCafe }) {
  const { cafe, score, rankScore } = ranked
  const isCommunity = cafe.source === "public_submission"

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-amber-700/40 hover:shadow-sm"
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
          className="shrink-0 text-stone-800"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl">
          ☕
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold text-stone-900 group-hover:text-amber-800">
            {cafe.name}
          </h3>
          {rankScore !== null && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
              {rankScore.toFixed(1)} / 5
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-stone-500">
          {cafe.neighborhood} · {PRICE_TIER_LABEL[cafe.priceTier]}
        </p>
        {isCommunity && (
          <span className="mt-1 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800">
            community-submitted, AI-verified
          </span>
        )}
      </div>
    </Link>
  )
}
