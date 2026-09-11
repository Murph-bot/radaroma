import type { Metadata } from "next"
import CafeExplorer from "@/components/CafeExplorer"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Cafés",
  description: "All curated Athens cafés, ranked by what you care about.",
}

export default async function CafesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [{ q }, ranked] = await Promise.all([searchParams, getPublicCafes()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Cafés</h1>
        <p className="mt-1 text-sm text-stone-500">
          {ranked.length} verified cafés. Adjust the weights to find your kind of place.
        </p>
      </div>
      <CafeExplorer ranked={ranked} initialQuery={q ?? ""} />
    </div>
  )
}
