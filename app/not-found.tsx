import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl pt-16 text-center">
      <h1 className="text-2xl font-bold text-coffee-900">Page not found</h1>
      <p className="mt-3 text-sm text-coffee-600">
        That café or page doesn&apos;t exist — maybe it hasn&apos;t been verified yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-coffee-800 px-4 py-2 text-sm font-medium text-white hover:bg-coffee-900"
      >
        Back to Pour Compass
      </Link>
    </div>
  )
}
