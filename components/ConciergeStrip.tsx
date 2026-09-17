"use client"

import { useEffect, useRef } from "react"
import ConciergeChat from "@/components/ConciergeChat"
import PentagonMark from "@/components/PentagonMark"
import { t, type Locale } from "@/lib/i18n"

// The concierge as a collapsed strip — subordinate to the ranking
// instrument. Deep-linkable via #concierge (the mobile "Ask" tab). On phones
// the closed strip sticks above the tab bar and opens as a bottom sheet.
export default function ConciergeStrip({ locale = "en" }: { locale?: Locale }) {
  const s = t(locale)
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const openIfTargeted = () => {
      if (window.location.hash === "#concierge" && ref.current) {
        ref.current.open = true
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    openIfTargeted()
    window.addEventListener("hashchange", openIfTargeted)
    return () => window.removeEventListener("hashchange", openIfTargeted)
  }, [])

  return (
    <details
      ref={ref}
      id="concierge"
      className="group rounded-xl border border-copper-500/40 bg-white shadow-sm max-sm:sticky max-sm:bottom-[calc(3.75rem+env(safe-area-inset-bottom))] max-sm:z-30 max-sm:open:static"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-coffee-800 [&::-webkit-details-marker]:hidden">
        <PentagonMark className="h-5 w-5 text-copper-600" />
        {s.concierge.stripSummary}
        <span
          aria-hidden="true"
          className="ml-auto text-coffee-500 transition-transform duration-150 group-open:rotate-90"
        >
          ▸
        </span>
      </summary>
      <div className="border-t border-coffee-200 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-[calc(3.75rem+env(safe-area-inset-bottom))] max-sm:z-50 max-sm:max-h-[70vh] max-sm:overflow-y-auto max-sm:rounded-t-2xl max-sm:border max-sm:border-coffee-200 max-sm:bg-white max-sm:shadow-2xl">
        <button
          type="button"
          onClick={() => {
            if (ref.current) ref.current.open = false
          }}
          className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-coffee-600 sm:hidden"
        >
          <span>{s.concierge.title}</span>
          <span aria-hidden="true">✕</span>
          <span className="sr-only">{s.concierge.close}</span>
        </button>
        <ConciergeChat framed={false} locale={locale} />
      </div>
    </details>
  )
}
