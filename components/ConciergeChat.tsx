"use client"

import { useId, useRef, useState } from "react"
import PentagonMark from "@/components/PentagonMark"
import { t, type Locale } from "@/lib/i18n"

interface ConciergeMessage {
  role: "user" | "assistant"
  content: string
}

interface ConciergeChatProps {
  cafeContext?: string
  placeholder?: string
  // Standalone card chrome (border + header). False when embedded in a
  // collapsible strip that already labels it.
  framed?: boolean
  locale?: Locale
}

export default function ConciergeChat({
  cafeContext,
  placeholder,
  framed = true,
  locale = "en",
}: ConciergeChatProps) {
  const s = t(locale)
  const effectivePlaceholder = placeholder ?? s.concierge.placeholder
  const [messages, setMessages] = useState<ConciergeMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Several instances can be mounted at once (mobile strip + desktop rail).
  const inputId = useId()

  const handleSend = async () => {
    const text = input.trim()
    if (!text || busy) return
    const history: ConciergeMessage[] = [...messages, { role: "user", content: text }]
    setMessages(history)
    setInput("")
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/agent/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history,
          locale,
          ...(cafeContext !== undefined && { cafeContext }),
        }),
      })
      const data = (await res.json()) as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`)
      setMessages([...history, { role: "assistant", content: data.content ?? "" }])
    } catch (e) {
      setError(e instanceof Error ? e.message : s.concierge.genericError)
    } finally {
      setBusy(false)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
      })
    }
  }

  return (
    <div
      className={
        framed
          ? "flex flex-col overflow-hidden rounded-xl border border-coffee-200 bg-white"
          : "flex flex-col bg-white"
      }
    >
      {framed && (
        <div className="flex items-center gap-2 border-b border-coffee-200 bg-coffee-50 px-4 py-2.5">
          <PentagonMark className="h-4 w-4 text-copper-600" />
          <span className="text-sm font-semibold text-coffee-800">{s.concierge.title}</span>
          <span className="ml-auto text-[11px] text-coffee-400">
            {s.concierge.headerNote}
          </span>
        </div>
      )}

      <div
        ref={listRef}
        aria-live="polite"
        className="max-h-72 min-h-24 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-coffee-400">{s.concierge.empty}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-coffee-800 text-white"
                : "bg-coffee-100 text-coffee-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="max-w-[85%] rounded-lg bg-coffee-100 px-3 py-2 text-sm text-coffee-500">
            {s.concierge.thinking}
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t border-coffee-200 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {s.concierge.inputAria}
        </label>
        <input
          id={inputId}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={effectivePlaceholder}
          disabled={busy}
          className="w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm outline-none focus:border-coffee-700 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="shrink-0 rounded-lg bg-copper-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-copper-700 disabled:opacity-40"
        >
          {s.concierge.send}
        </button>
      </form>
      <p className="border-t border-coffee-100 px-3 py-1.5 text-[11px] leading-snug text-coffee-400">
        {s.concierge.disclaimer}
      </p>
    </div>
  )
}
