import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Radaroma",
    template: "%s · Radaroma",
  },
  description:
    "Athens cafés, ranked your way. Compare cafés by what you care about — quiet, social, price-value, specialty depth, work-friendliness — and ask the concierge.",
  openGraph: {
    title: "Radaroma",
    description:
      "Athens cafés, ranked your way. Radar charts, weighted re-ranking, and an AI concierge grounded in the dataset.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Radaroma",
    description: "Athens cafés, ranked your way.",
  },
}

const navLinks = [
  { href: "/cafes", label: "Cafés" },
  { href: "/compare", label: "Compare" },
  { href: "/submit", label: "Submit a café" },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-coffee-50 text-coffee-900">
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
          />
        )}
        <header className="border-b border-coffee-200">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-coffee-900">Radaroma</span>
              <span className="text-xs text-coffee-400">Athens</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-coffee-600 transition hover:bg-coffee-100 hover:text-coffee-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-coffee-200 py-6">
          <div className="mx-auto w-full max-w-5xl px-4 text-xs text-coffee-400">
            Radaroma — a curated, weighted comparison of Athens cafés. Scores are opinions;
            go taste for yourself.
          </div>
        </footer>
      </body>
    </html>
  )
}
