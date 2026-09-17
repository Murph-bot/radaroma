import type { Metadata } from "next"
import { headers } from "next/headers"
import SubmitForm from "@/components/SubmitForm"
import { localeFromHost, t } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const s = t(localeFromHost((await headers()).get("host")))
  return { title: s.meta.submit.title, description: s.meta.submit.description }
}

export default async function SubmitPage() {
  const locale = localeFromHost((await headers()).get("host"))
  const s = t(locale)
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">{s.submit.title}</h1>
        <p className="mt-2 text-sm text-coffee-600">{s.submit.intro}</p>
      </div>
      <SubmitForm locale={locale} />
    </div>
  )
}
