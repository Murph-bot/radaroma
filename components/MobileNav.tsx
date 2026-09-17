"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import PentagonMark from "@/components/PentagonMark"

// Thumb-reach nav for small screens: Cafés / Compare / Ask / Submit.
// "Ask" deep-links the concierge strip on the homepage.
const items = [
  {
    href: "/cafes",
    label: "Cafés",
    match: (p: string) => p.startsWith("/cafes"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
        <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" strokeLinejoin="round" />
        <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/compare",
    label: "Compare",
    match: (p: string) => p.startsWith("/compare"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
        <path d="M8 4.5 3 12l5 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4.5 21 12l-5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/#concierge",
    label: "Ask",
    match: () => false,
    icon: <PentagonMark className="h-5 w-5" />,
  },
  {
    href: "/submit",
    label: "Submit",
    match: (p: string) => p.startsWith("/submit"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-coffee-200 bg-coffee-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 ${
                active ? "text-copper-600" : "text-coffee-500"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
