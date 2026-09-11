import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ConciergeChat from "@/components/ConciergeChat"
import RadarChart, { SERIES_COLORS } from "@/components/RadarChart"
import { getPublicCafe } from "@/lib/queries/publicCafes"
import { AXIS_LABELS } from "@/lib/radar"
import { SCORE_AXES, type ScoreAxis } from "@/lib/schemas/score"

export const dynamic = "force-dynamic"

const PRICE_TIER_LABEL = ["", "$", "$$", "$$$", "$$$$"]

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
      ? `${ranked.cafe.name} in ${ranked.cafe.neighborhood} — radar score ${ranked.rankScore?.toFixed(1) ?? "n/a"} / 5.`
      : undefined,
  }
}

export default async function CafeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ranked = await getPublicCafe(slug)
  if (!ranked) notFound()

  const { cafe, score, rankScore } = ranked
  const isCommunity = cafe.source === "public_submission"

  return (
    <div className="space-y-8">
      <Link href="/cafes" className="text-sm font-medium text-stone-500 hover:text-amber-800">
        ← All cafés
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{cafe.name}</h1>
          {rankScore !== null && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-900">
              {rankScore.toFixed(1)} / 5
            </span>
          )}
          {isCommunity && (
            <span className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
              community-submitted, AI-verified
            </span>
          )}
        </div>
        <p className="text-stone-600">
          {cafe.neighborhood} · {PRICE_TIER_LABEL[cafe.priceTier]}
        </p>
        <p className="text-sm text-stone-500">{cafe.address}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {score ? (
          <div className="flex justify-center rounded-xl border border-stone-200 bg-stone-50 p-6">
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
              className="text-stone-800"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-stone-300 p-10 text-sm text-stone-400">
            No scores yet — coming soon.
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Score breakdown
          </h2>
          {score ? (
            <div className="space-y-3">
              {SCORE_AXES.map((axis: ScoreAxis) => (
                <div key={axis}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">{AXIS_LABELS[axis]}</span>
                    <span className="font-mono text-stone-500">{score[axis]} / 5</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-amber-700"
                      style={{ width: `${(score[axis] / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {cafe.verificationNotes && (
                <p className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
                  {cafe.verificationNotes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Not scored yet.</p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-stone-900">Ask about this café</h2>
        <p className="mb-4 text-sm text-stone-500">
          Questions about {cafe.name}? The concierge knows its profile.
        </p>
        <ConciergeChat
          cafeContext={
            score
              ? `${cafe.name} (${cafe.neighborhood}, ${PRICE_TIER_LABEL[cafe.priceTier]} tier). Scores: Quality ${score.quality}/5, Value ${score.priceValue}/5, Work ${score.workFriendliness}/5, Quiet ${score.quietVibe}/5, Specialty ${score.specialtyDepth}/5.`
              : `${cafe.name} (${cafe.neighborhood}, ${PRICE_TIER_LABEL[cafe.priceTier]} tier). No scores yet.`
          }
          placeholder={`Ask about ${cafe.name}…`}
        />
      </section>
    </div>
  )
}
