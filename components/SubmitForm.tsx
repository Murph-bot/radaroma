"use client"

import Link from "next/link"
import { useState } from "react"
import { t, type Locale } from "@/lib/i18n"

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "verified"; cafeSlug: string }
  | { phase: "flagged"; reasoning: string | null }
  | { phase: "rejected"; reasoning: string | null }
  | { phase: "error"; message: string }

export default function SubmitForm({ locale = "en" }: { locale?: Locale }) {
  const s = t(locale)
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
        setState({ phase: "error", message: s.submit.unexpected })
      }
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : s.submit.networkError })
    }
  }

  if (state.phase === "verified") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-900">{s.submit.verifiedTitle}</p>
        <p className="mt-1 text-sm text-green-800">{s.submit.verifiedBody}</p>
        <Link
          href={`/cafes/${state.cafeSlug}`}
          className="mt-4 inline-block rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
        >
          {s.submit.verifiedCta}
        </Link>
      </div>
    )
  }

  if (state.phase === "flagged" || state.phase === "rejected") {
    return (
      <div className="rounded-xl border border-coffee-200 bg-white p-6 text-center">
        <p className="text-lg font-semibold text-coffee-900">
          {state.phase === "flagged" ? s.submit.flaggedTitle : s.submit.rejectedTitle}
        </p>
        <p className="mt-1 text-sm text-coffee-800">
          {state.phase === "flagged" ? s.submit.flaggedBody : s.submit.rejectedBody}
        </p>
        {state.reasoning && (
          <p className="mx-auto mt-3 max-w-md rounded-lg bg-white/70 p-3 text-xs text-coffee-800">
            {state.reasoning}
          </p>
        )}
        <button
          type="button"
          onClick={() => setState({ phase: "idle" })}
          className="mt-4 rounded-lg border border-coffee-300 px-4 py-2 text-sm font-medium text-coffee-900 hover:bg-coffee-100"
        >
          {s.submit.another}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cafe-name" className="mb-1 block text-sm font-medium text-coffee-700">
          {s.submit.nameLabel}
        </label>
        <input
          id="cafe-name"
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={s.submit.namePlaceholder}
          className="w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm outline-none focus:border-coffee-700"
        />
      </div>
      <div>
        <label htmlFor="cafe-location" className="mb-1 block text-sm font-medium text-coffee-700">
          {s.submit.locationLabel}
        </label>
        <input
          id="cafe-location"
          type="text"
          required
          maxLength={500}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={s.submit.locationPlaceholder}
          className="w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm outline-none focus:border-coffee-700"
        />
      </div>
      <div>
        <label htmlFor="cafe-note" className="mb-1 block text-sm font-medium text-coffee-700">
          {s.submit.noteLabel} <span className="text-coffee-400">{s.submit.optional}</span>
        </label>
        <textarea
          id="cafe-note"
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={s.submit.notePlaceholder}
          className="w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm outline-none focus:border-coffee-700"
        />
      </div>
      {/* honeypot — hidden from humans, irresistible to bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cafe-website">{s.submit.honeypot}</label>
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
        className="w-full rounded-lg bg-copper-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-copper-700 disabled:opacity-50"
      >
        {state.phase === "submitting" ? s.submit.submitting : s.submit.submit}
      </button>
      {state.phase === "submitting" && (
        <p className="text-center text-xs text-coffee-400">{s.submit.submittingNote}</p>
      )}
    </form>
  )
}
