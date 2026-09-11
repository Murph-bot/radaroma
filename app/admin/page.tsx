import type { Metadata } from "next"
import { headers } from "next/headers"
import AdminDashboard from "@/components/AdminDashboard"
import { requireAdmin } from "@/lib/admin/auth"
import { getAdminDashboardData } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const h = await headers()
  const session = await requireAdmin(h)

  if (!session) {
    return (
      <div className="mx-auto max-w-xl pt-10 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
        <p className="mt-3 text-sm text-stone-600">
          This area is locked. Sign in through Cloudflare Access (email OTP) and make sure your
          email is in the <code className="rounded bg-stone-100 px-1">invited_emails</code>{" "}
          allowlist.
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Local development: set <code className="rounded bg-stone-100 px-1">ADMIN_EMAIL</code> in
          .env.local / .dev.vars.
        </p>
      </div>
    )
  }

  const data = await getAdminDashboardData()
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
        <span className="text-xs text-stone-400">signed in as {session.email}</span>
      </div>
      <AdminDashboard data={data} />
    </div>
  )
}
