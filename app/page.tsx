import Link from "next/link"
import CafeExplorer from "@/components/CafeExplorer"
import ConciergeChat from "@/components/ConciergeChat"
import RankedCafeCard from "@/components/RankedCafeCard"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export default async function Home() {
  const ranked = await getPublicCafes()
  const top = ranked.slice(0, 3)

  return (
    <div className="space-y-14">
      <section className="mx-auto max-w-2xl pt-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-coffee-900 sm:text-5xl">
          Athens cafés, <span className="text-coffee-600">ranked your way</span>.
        </h1>
        <p className="mt-4 text-lg text-coffee-600">
          Not another star-rating aggregator. Every café is a radar chart — re-rank the list by
          quiet vs. social, price-value, specialty depth, or work-friendliness. Ask the concierge
          anything; it only recommends cafés that are actually here.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <form
            action="/cafes"
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-coffee-300 bg-white px-4 py-2 shadow-sm focus-within:border-coffee-700"
          >
            <span aria-hidden="true" className="text-coffee-400">
              ☕
            </span>
            <input
              type="search"
              name="q"
              placeholder="Search cafés…"
              aria-label="Search cafés"
              className="w-full bg-transparent text-sm outline-none placeholder:text-coffee-400"
            />
            <button
              type="submit"
              className="rounded-full bg-coffee-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-coffee-900"
            >
              Search
            </button>
          </form>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <Link href="/compare" className="font-medium text-coffee-800 underline-offset-4 hover:underline">
            Compare cafés side by side
          </Link>
          <Link href="/submit" className="font-medium text-coffee-500 underline-offset-4 hover:underline">
            Know a great spot? Submit it
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="mb-1 text-xl font-semibold text-coffee-900">Ask the concierge</h2>
        <p className="mb-4 text-sm text-coffee-500">
          A real AI, grounded in our dataset. It can&apos;t recommend a café that isn&apos;t here.
        </p>
        <ConciergeChat />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-coffee-900">Top picks</h2>
          <Link href="/cafes" className="text-sm font-medium text-coffee-800 hover:underline">
            See all {ranked.length} cafés →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {top.map((r) => (
            <RankedCafeCard key={r.cafe.id} ranked={r} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-coffee-900">Find your spot</h2>
        <p className="mb-4 text-sm text-coffee-500">
          Drag the sliders — the list re-ranks instantly. Working from a laptop? Crank up
          “Work”.
        </p>
        <CafeExplorer ranked={ranked} compact />
      </section>
    </div>
  )
}
