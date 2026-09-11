"use client"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-xl pt-16 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
      <p className="mt-3 text-sm text-stone-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
      >
        Try again
      </button>
    </div>
  )
}
