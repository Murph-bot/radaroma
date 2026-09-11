import type { Metadata } from "next"
import ComparePicker from "@/components/ComparePicker"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Compare",
  description: "Overlay 2–3 cafés and compare their radar charts side by side.",
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cafes?: string }>
}) {
  const [{ cafes }, ranked] = await Promise.all([searchParams, getPublicCafes()])
  const initialSlugs = (cafes ?? "").split(",").filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Compare</h1>
        <p className="mt-1 text-sm text-stone-500">
          Overlay up to three cafés on one radar chart.
        </p>
      </div>
      <ComparePicker ranked={ranked} initialSlugs={initialSlugs} />
    </div>
  )
}
