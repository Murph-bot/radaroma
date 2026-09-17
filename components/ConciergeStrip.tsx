"use client"

import { useEffect, useRef } from "react"
import ConciergeChat from "@/components/ConciergeChat"
import PentagonMark from "@/components/PentagonMark"
import { t, type Locale } from "@/lib/i18n"

// The concierge as a collapsed strip — subordinate to the ranking
// instrument. Deep-linkable via #concierge (the mobile "Ask" tab).
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
      className="group overflow-hidden rounded-xl border border-coffee-200 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-coffee-700 [&::-webkit-details-marker]:hidden">
        <PentagonMark className="h-4 w-4 text-copper-600" />
        {s.concierge.stripSummary}
        <span
          aria-hidden="true"
          className="ml-auto text-coffee-400 transition-transform duration-150 group-open:rotate-90"
        >
          ▸
        </span>
      </summary>
      <div className="border-t border-coffee-200">
        <ConciergeChat framed={false} locale={locale} />
      </div>
    </details>
  )
}
