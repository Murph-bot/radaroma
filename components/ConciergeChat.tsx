"use client"

import { useRef, useState } from "react"

interface ConciergeMessage {
  role: "user" | "assistant"
  content: string
}

interface ConciergeChatProps {
  cafeContext?: string
  placeholder?: string
}

export default function ConciergeChat({
  cafeContext,
  placeholder = "Ask the concierge — e.g. “quiet place to work near Exarchia?”",
}: ConciergeChatProps) {
  const [messages, setMessages] = useState<ConciergeMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
          ...(cafeContext !== undefined && { cafeContext }),
        }),
      })
      const data = (await res.json()) as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`)
      setMessages([...history, { role: "assistant", content: data.content ?? "" }])
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong")
    } finally {
      setBusy(false)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
      })
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-2.5">
        <span aria-hidden="true" className="text-lg">
          ☕
        </span>
        <span className="text-sm font-semibold text-stone-800">Café Concierge</span>
        <span className="ml-auto text-[11px] text-stone-400">
          only recommends cafés in our dataset
        </span>
      </div>

      <div
        ref={listRef}
        aria-live="polite"
        className="max-h-72 min-h-24 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-stone-400">
            Ask about the best espresso, a quiet corner to work from, or which café fits your
            budget.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-amber-800 text-white"
                : "bg-stone-100 text-stone-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="max-w-[85%] rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-500">
            Thinking…
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t border-stone-200 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
      >
        <label htmlFor="concierge-input" className="sr-only">
          Message the concierge
        </label>
        <input
          id="concierge-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-700 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="shrink-0 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-900 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  )
}
