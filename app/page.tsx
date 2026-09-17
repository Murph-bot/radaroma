import Link from "next/link"
import CafeExplorer from "@/components/CafeExplorer"
import ConciergeChat from "@/components/ConciergeChat"
import PentagonMark from "@/components/PentagonMark"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import { shapeTrio } from "@/lib/compare"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export default async function Home() {
  const ranked = await getPublicCafes()
  const trio = shapeTrio(ranked)

  return (
    <div className="space-y-10">
      <section className="pt-4">
        <h1 className="max-w-3xl font-display text-5xl font-medium tracking-tight text-coffee-900 sm:text-6xl">
          Attica cafés, as a shape.
        </h1>
        {trio.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
            {trio.map((r, i) => (
              <Link
                key={r.cafe.id}
                href={`/cafes/${r.cafe.slug}`}
                className="group flex items-center gap-3"
              >
                {r.score && (
                  <RadarChart
                    series={[
                      {
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
                      },
                    ]}
                    size={84}
                    showLegend={false}
                    className="text-coffee-800"
                  />
                )}
                <span className="text-sm font-medium text-coffee-700 underline-offset-4 group-hover:text-coffee-900 group-hover:underline">
                  {r.cafe.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Rank the list">
        <CafeExplorer ranked={ranked} showFilters={false} />
        <p className="mt-3 text-sm text-coffee-500">
          <Link
            href="/cafes"
            className="font-medium text-coffee-700 underline-offset-4 hover:underline"
          >
            Search and filter all {ranked.length} cafés →
          </Link>
        </p>
      </section>

      <details className="group overflow-hidden rounded-xl border border-coffee-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-coffee-700 [&::-webkit-details-marker]:hidden">
          <PentagonMark className="h-4 w-4 text-copper-600" />
          Ask the concierge — it only recommends cafés in our dataset
          <span
            aria-hidden="true"
            className="ml-auto text-coffee-400 transition-transform duration-150 group-open:rotate-90"
          >
            ▸
          </span>
        </summary>
        <div className="border-t border-coffee-200">
          <ConciergeChat framed={false} />
        </div>
      </details>
    </div>
  )
}
