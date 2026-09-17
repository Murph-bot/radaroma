import type { Metadata } from "next"
import { headers } from "next/headers"
import ComparePicker from "@/components/ComparePicker"
import { defaultCompareSlugs } from "@/lib/compare"
import { localeFromHost, t } from "@/lib/i18n"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = t(localeFromHost((await headers()).get("host")))
  return { title: s.meta.compare.title, description: s.meta.compare.description }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cafes?: string }>
}) {
  const [{ cafes }, ranked, headerList] = await Promise.all([
    searchParams,
    getPublicCafes(),
    headers(),
  ])
  const locale = localeFromHost(headerList.get("host"))
  const s = t(locale)
  const initialSlugs = defaultCompareSlugs(ranked, (cafes ?? "").split(",").filter(Boolean))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">{s.compare.title}</h1>
        <p className="mt-1 text-sm text-coffee-500">{s.compare.sub}</p>
      </div>
      <ComparePicker ranked={ranked} initialSlugs={initialSlugs} locale={locale} />
    </div>
  )
}
