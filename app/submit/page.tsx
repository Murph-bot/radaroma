import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Submit a café",
}

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 pt-10 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Submit a café</h1>
      <p className="text-stone-600">
        Know a great spot that&apos;s missing? The public submission form is coming soon — an AI
        concierge will verify the café is real and check for duplicates before it goes live.
      </p>
    </div>
  )
}
