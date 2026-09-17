import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import ConciergeChat from "@/components/ConciergeChat"
import RadarChart from "@/components/RadarChart"
import { SERIES_COLORS } from "@/lib/radar"
import { bestForChips } from "@/lib/bestFor"
import { curatorBlurb } from "@/lib/blurb"
import { farthestPartner } from "@/lib/compare"
import { localeFromHost, t } from "@/lib/i18n"
import { getPublicCafe, getPublicCafes } from "@/lib/queries/publicCafes"
import { priceTierLabel } from "@/lib/price"
import { SCORE_AXES, type ScoreAxis } from "@/lib/schemas/score"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ranked = await getPublicCafe(slug)
  return {
    title: ranked ? ranked.cafe.name : "Café not found",
    description: ranked
      ? `${ranked.cafe.name} in ${ranked.cafe.neighborhood} — average ${ranked.rankScore?.toFixed(1) ?? "n/a"} across five axes.`
      : undefined,
  }
}

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [ranked, allRanked, headerList] = await Promise.all([
    getPublicCafe(slug),
    getPublicCafes(),
    headers(),
  ])
  if (!ranked) notFound()
  const locale = localeFromHost(headerList.get("host"))
  const s = t(locale)

  const { cafe, score } = ranked
  const isCommunity = cafe.source === "public_submission"
  const blurb = curatorBlurb(cafe.verificationNotes)
  const chips = score ? bestForChips(score) : []
  const partner = score ? farthestPartner(allRanked, slug) : null
  const partnerName = partner
    ? (allRanked.find((r) => r.cafe.slug === partner)?.cafe.name ?? null)
    : null
  const compareHref = partner ? `/compare?cafes=${slug},${partner}` : "/compare"

  return (
    <div className="space-y-8">
      <Link href="/cafes" className="text-sm font-medium text-coffee-500 hover:text-coffee-800">
        {s.detail.allCafes}
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-medium tracking-tight text-coffee-900">{cafe.name}</h1>
          {isCommunity && (
            <span className="rounded border border-copper-500/50 bg-copper-100 px-2 py-1 text-xs font-medium text-copper-700">
              {s.card.community}
            </span>
          )}
        </div>
        <p className="text-coffee-600">
          {cafe.neighborhood} · {priceTierLabel(cafe.priceTier)}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-coffee-500 underline decoration-coffee-300 underline-offset-2 hover:text-coffee-800"
        >
          {cafe.address}
        </a>
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label={s.detail.bestFor}>
            {chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-coffee-300 px-3 py-1 text-xs font-medium text-coffee-700"
              >
                {s.bestFor[chip]}
              </li>
            ))}
          </ul>
        )}
        <div className="pt-1">
          <Link
            href={compareHref}
            className="inline-block rounded-lg border border-coffee-300 px-3 py-1.5 text-sm font-medium text-coffee-700 transition-colors duration-150 hover:bg-coffee-100"
          >
            {s.detail.compareWith(partnerName)}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {score ? (
          <div className="flex justify-center rounded-xl border border-coffee-200 bg-white p-6">
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
              size={280}
              className="text-coffee-800"
              locale={locale}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-coffee-300 p-10 text-sm text-coffee-400">
            {s.detail.noScores}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="font-display text-lg font-medium text-coffee-900">
            {s.detail.scoreBreakdown}
          </h2>
          {score ? (
            <div className="space-y-3">
              {SCORE_AXES.map((axis: ScoreAxis) => (
                <div key={axis}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-coffee-700">{s.axes[axis]}</span>
                    <span className="tabular-nums text-coffee-500">{score[axis]} / 5</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-coffee-100">
                    <div
                      className="h-full rounded-full bg-copper-500"
                      style={{ width: `${(score[axis] / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {blurb && (
                <p className="rounded-lg bg-coffee-100 p-3 text-xs text-coffee-600">
                  {blurb}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-coffee-500">{s.detail.notScored}</p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-coffee-900">{s.detail.askTitle}</h2>
        <p className="mb-4 text-sm text-coffee-500">{s.detail.askSub(cafe.name)}</p>
        <ConciergeChat
          locale={locale}
          cafeContext={
            score
              ? `${cafe.name} (${cafe.neighborhood}, ${priceTierLabel(cafe.priceTier)} tier). Scores: Quality ${score.quality}/5, Value ${score.priceValue}/5, Work ${score.workFriendliness}/5, Quiet ${score.quietVibe}/5, Specialty ${score.specialtyDepth}/5.`
              : `${cafe.name} (${cafe.neighborhood}, ${priceTierLabel(cafe.priceTier)} tier). No scores yet.`
          }
          placeholder={s.detail.askPlaceholder(cafe.name)}
        />
      </section>
    </div>
  )
}
