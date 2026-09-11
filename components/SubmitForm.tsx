"use client"

import Link from "next/link"
import { useState } from "react"

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "verified"; cafeSlug: string }
  | { phase: "flagged"; reasoning: string | null }
  | { phase: "rejected"; reasoning: string | null }
  | { phase: "error"; message: string }

export default function SubmitForm() {
  const [state, setState] = useState<SubmitState>({ phase: "idle" })
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [note, setNote] = useState("")
  const [website, setWebsite] = useState("") // honeypot

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState({ phase: "submitting" })
    try {
      const res = await fetch("/api/agent/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submittedName: name,
          submittedLocation: location,
          submitterNote: note || undefined,
          website,
        }),
      })
      const data = (await res.json()) as {
        status?: string
        cafeSlug?: string
        reasoning?: string | null
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`)
      if (data.status === "verified" && data.cafeSlug) {
        setState({ phase: "verified", cafeSlug: data.cafeSlug })
      } else if (data.status === "rejected") {
        setState({ phase: "rejected", reasoning: data.reasoning ?? null })
      } else if (data.status === "flagged") {
        setState({ phase: "flagged", reasoning: data.reasoning ?? null })
      } else {
        setState({ phase: "error", message: "unexpected response" })
      }
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "network error" })
    }
  }

  if (state.phase === "verified") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-900">Verified — welcome to the list!</p>
        <p className="mt-1 text-sm text-green-800">
          The concierge confirmed the café is real and it has no duplicates in the dataset.
        </p>
        <Link
          href={`/cafes/${state.cafeSlug}`}
          className="mt-4 inline-block rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
        >
          See it on the map of cafés →
        </Link>
      </div>
    )
  }

  if (state.phase === "flagged" || state.phase === "rejected") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {state.phase === "flagged" ? "Sent for human review" : "Not added this time"}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          {state.phase === "flagged"
            ? "The concierge couldn't fully confirm this café (or it may duplicate one we already have). A curator will take a look."
            : "The concierge could not confirm this café exists. If it's real, double-check the name and address and try again."}
        </p>
        {state.reasoning && (
          <p className="mx-auto mt-3 max-w-md rounded-lg bg-white/70 p-3 text-xs text-amber-800">
            {state.reasoning}
          </p>
        )}
        <button
          type="button"
          onClick={() => setState({ phase: "idle" })}
          className="mt-4 rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Submit another café
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cafe-name" className="mb-1 block text-sm font-medium text-stone-700">
          Café name
        </label>
        <input
          id="cafe-name"
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kaya"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-700"
        />
      </div>
      <div>
        <label htmlFor="cafe-location" className="mb-1 block text-sm font-medium text-stone-700">
          Address or Google Maps link
        </label>
        <input
          id="cafe-location"
          type="text"
          required
          maxLength={500}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Voulis 7, Athens 105 62"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-700"
        />
      </div>
      <div>
        <label htmlFor="cafe-note" className="mb-1 block text-sm font-medium text-stone-700">
          Anything the concierge should know? <span className="text-stone-400">(optional)</span>
        </label>
        <textarea
          id="cafe-note"
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Great filter coffee, nice courtyard…"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-700"
        />
      </div>
      {/* honeypot — hidden from humans, irresistible to bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cafe-website">Leave this field empty</label>
        <input
          id="cafe-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {state.phase === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.phase === "submitting" || name.trim().length === 0 || location.trim().length === 0}
        className="w-full rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50"
      >
        {state.phase === "submitting" ? "Verifying with the concierge…" : "Submit for verification"}
      </button>
      {state.phase === "submitting" && (
        <p className="text-center text-xs text-stone-400">
          The concierge checks the web, looks for duplicates, and drafts a record. Usually 10–30
          seconds — keep this tab open.
        </p>
      )}
    </form>
  )
}
