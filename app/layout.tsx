import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { EB_Garamond, Source_Sans_3 } from "next/font/google"
import { headers } from "next/headers"
import Link from "next/link"
import MobileNav from "@/components/MobileNav"
import PentagonMark from "@/components/PentagonMark"
import PwaRegister from "@/components/PwaRegister"
import { localeFromHost, t } from "@/lib/i18n"
import "./globals.css"

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin", "greek"],
})

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "greek"],
})

export async function generateMetadata(): Promise<Metadata> {
  const s = t(localeFromHost((await headers()).get("host")))
  return {
    title: {
      default: s.meta.siteTitle,
      template: `%s · ${s.meta.siteTitle}`,
    },
    description: s.meta.siteDescription,
    openGraph: {
      title: s.meta.siteTitle,
      description: s.meta.ogDescription,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: s.meta.siteTitle,
      description: s.meta.twitterDescription,
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
}

export const viewport: Viewport = {
  themeColor: "#F4EDE3",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = localeFromHost((await headers()).get("host"))
  const s = t(locale)
  const navLinks = [
    { href: "/cafes", label: s.nav.cafes },
    { href: "/compare", label: s.nav.compare },
    { href: "/submit", label: s.nav.submit },
  ]
  return (
    <html lang={s.htmlLang} className={`${ebGaramond.variable} ${sourceSans.variable} h-full antialiased`}>
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
            <Link href="/" className="flex items-center gap-2">
              <PentagonMark className="h-5 w-5 text-copper-600" />
              <span className="font-display text-lg font-medium tracking-tight text-coffee-900">
                Radaroma
              </span>
              <span className="text-xs tracking-wide text-coffee-600">Attica</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
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
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">{children}</main>
        <PwaRegister />
        <MobileNav locale={locale} />
        <footer className="border-t border-coffee-200 py-6 pb-20 sm:pb-6">
          <div className="mx-auto w-full max-w-5xl space-y-1 px-4 text-xs text-coffee-400">
            <p>{s.footer.tagline}</p>
            <p>{s.footer.privacy}</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
