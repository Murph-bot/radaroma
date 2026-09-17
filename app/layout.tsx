import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { EB_Garamond, Source_Sans_3 } from "next/font/google"
import Link from "next/link"
import PwaRegister from "@/components/PwaRegister"
import "./globals.css"

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin", "greek"],
})

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "greek"],
})

export const metadata: Metadata = {
  title: {
    default: "Radaroma",
    template: "%s · Radaroma",
  },
  description:
    "Attica cafés, ranked your way. Compare cafés by what you care about — quiet, social, price-value, specialty depth, work-friendliness — and ask the concierge.",
  openGraph: {
    title: "Radaroma",
    description:
      "Attica cafés, ranked your way. Radar charts, weighted re-ranking, and an AI concierge grounded in the dataset.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Radaroma",
    description: "Attica cafés, ranked your way.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Radaroma",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
}

const navLinks = [
  { href: "/cafes", label: "Cafés" },
  { href: "/compare", label: "Compare" },
  { href: "/submit", label: "Submit a café" },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-coffee-50 font-sans text-coffee-900">
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
              <span className="font-display text-lg font-medium tracking-tight text-coffee-900">Radaroma</span>
              <span className="text-xs uppercase tracking-[0.18em] text-coffee-400">Attica</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-coffee-600 transition-colors duration-150 hover:bg-coffee-100 hover:text-coffee-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <PwaRegister />
        <footer className="border-t border-coffee-200 py-6">
          <div className="mx-auto w-full max-w-5xl px-4 text-xs text-coffee-400">
            Radaroma — a curated, weighted comparison of Attica cafés. Scores are opinions;
            go taste for yourself.
          </div>
        </footer>
      </body>
    </html>
  )
}
