import type { Metadata } from "next"
import { headers } from "next/headers"
import CafeExplorer from "@/components/CafeExplorer"
import { localeFromHost, t } from "@/lib/i18n"
import { getPublicCafes } from "@/lib/queries/publicCafes"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const s = t(localeFromHost((await headers()).get("host")))
  return { title: s.meta.cafes.title, description: s.meta.cafes.description }
}

export default async function CafesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [{ q }, ranked, headerList] = await Promise.all([searchParams, getPublicCafes(), headers()])
  const locale = localeFromHost(headerList.get("host"))
  const s = t(locale)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">{s.cafesPage.title}</h1>
        <p className="mt-1 text-sm text-coffee-500">{s.cafesPage.sub(ranked.length)}</p>
      </div>
      <CafeExplorer ranked={ranked} initialQuery={q ?? ""} locale={locale} />
    </div>
  )
}
