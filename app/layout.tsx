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
    default: "Pour Compass",
    template: "%s · Pour Compass",
  },
  description:
    "Athens cafés, ranked your way. Compare cafés by what you care about — quiet, social, price-value, specialty depth, work-friendliness — and ask the concierge.",
}

const navLinks = [
  { href: "/cafes", label: "Cafés" },
  { href: "/compare", label: "Compare" },
  { href: "/submit", label: "Submit a café" },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-stone-900">
        <header className="border-b border-stone-200">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-amber-900">Pour Compass</span>
              <span className="text-xs text-stone-400">Athens</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 py-6">
          <div className="mx-auto w-full max-w-5xl px-4 text-xs text-stone-400">
            Pour Compass — a curated, weighted comparison of Athens cafés. Scores are opinions;
            go taste for yourself.
          </div>
        </footer>
      </body>
    </html>
  )
}
