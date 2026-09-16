import type { Metadata } from "next"
import SubmitForm from "@/components/SubmitForm"

export const metadata: Metadata = {
  title: "Submit a café",
  description:
    "Know a great Attica café that's missing? Submit it — an AI concierge verifies it's real and checks for duplicates before it goes live.",
}

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">Submit a café</h1>
        <p className="mt-2 text-sm text-coffee-600">
          Know a spot that belongs here? Submit it and our concierge will verify the café is real,
          check for duplicates, and draft its profile. Nothing goes live without verification —
          community picks get a badge so you know they weren&apos;t hand-curated.
        </p>
      </div>
      <SubmitForm />
    </div>
  )
}
