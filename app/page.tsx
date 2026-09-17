import { headers } from "next/headers"
import Link from "next/link"
import CafeExplorer from "@/components/CafeExplorer"
import ConciergeChat from "@/components/ConciergeChat"
import ConciergeStrip from "@/components/ConciergeStrip"
import RadarChart from "@/components/RadarChart"
import { SERIES_COLORS } from "@/lib/radar"
import { shapeTrio } from "@/lib/compare"
import { localeFromHost, t } from "@/lib/i18n"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [ranked, headerList] = await Promise.all([getPublicCafes(), headers()])
  const locale = localeFromHost(headerList.get("host"))
  const s = t(locale)
  const trio = shapeTrio(ranked)

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div className="space-y-10">
        <section className="pt-4">
          <h1 className="max-w-3xl font-display text-4xl font-medium tracking-tight text-coffee-900 sm:text-5xl">
            {s.home.headline}
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
                      locale={locale}
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
          <CafeExplorer ranked={ranked} showFilters={false} locale={locale} />
          <p className="mt-3 text-sm text-coffee-500">
            <Link
              href="/cafes"
              className="font-medium text-coffee-700 underline-offset-4 hover:underline"
            >
              {s.home.searchAll(ranked.length)}
            </Link>
          </p>
        </section>

        {/* Mobile keeps the collapsible strip — the rail below doesn't fit 390px. */}
        <div className="lg:hidden">
          <ConciergeStrip locale={locale} />
        </div>
      </div>

      {/* Desktop: concierge rides along as a sticky rail while the list scrolls. */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <ConciergeChat locale={locale} />
        </div>
      </aside>
    </div>
  )
}
