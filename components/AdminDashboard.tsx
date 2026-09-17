"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AXIS_LABELS } from "@/lib/radar"
import type { AdminDashboardData } from "@/lib/admin/data"
import type { DraftRecord } from "@/lib/agent/tools"
import { SCORE_AXES, type ScoreInput, type ScoreAxis } from "@/lib/schemas/score"

const defaultScores: ScoreInput = {
  quality: 3,
  priceValue: 3,
  workFriendliness: 3,
  quietVibe: 3,
  specialtyDepth: 3,
}

const scoresFromRecord = (record: DraftRecord): ScoreInput => ({ ...record.scores })
const scoresFromCafeScore = (s?: AdminDashboardData["cafes"][number]["score"] | null): ScoreInput =>
  s
    ? {
        quality: s.quality,
        priceValue: s.priceValue,
        workFriendliness: s.workFriendliness,
        quietVibe: s.quietVibe,
        specialtyDepth: s.specialtyDepth,
      }
    : defaultScores

function ScoreEditor({
  scores,
  onChange,
}: {
  scores: ScoreInput
  onChange: (s: ScoreInput) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {SCORE_AXES.map((axis: ScoreAxis) => (
        <label key={axis} className="block text-xs text-coffee-600">
          {AXIS_LABELS[axis]}
          <input
            type="number"
            min={1}
            max={5}
            step={1}
            value={scores[axis]}
            onChange={(e) => onChange({ ...scores, [axis]: Number(e.target.value) })}
            className="mt-0.5 w-full rounded border border-coffee-300 px-2 py-1 text-sm"
          />
        </label>
      ))}
    </div>
  )
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "request failed" }
  }
}

export default function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [drafting, setDrafting] = useState(false)
  const [draft, setDraft] = useState<{ record: DraftRecord; content: string } | null>(null)
  const [draftScores, setDraftScores] = useState<ScoreInput>(defaultScores)
  const [savingDraft, setSavingDraft] = useState(false)
  const [cafeScores, setCafeScores] = useState<Record<string, ScoreInput>>({})
  const [submissionScores, setSubmissionScores] = useState<Record<string, ScoreInput>>({})
  const [showReviewed, setShowReviewed] = useState(false)

  const handleAction = async (submissionId: string, action: "approve" | "reject", scores?: ScoreInput) => {
    setBusyId(submissionId)
    setActionError(null)
    const res = await postJson(`/api/admin/submissions/${submissionId}`, { action, scores })
    if (!res.ok) setActionError(res.error ?? "action failed")
    setBusyId(null)
    router.refresh()
  }

  const handleDraft = async () => {
    if (!notes.trim() || drafting) return
    setDrafting(true)
    setActionError(null)
    try {
      const res = await fetch("/api/admin/curator-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      const data = (await res.json()) as { record?: DraftRecord; content?: string; error?: string }
      if (!res.ok || !data.record) throw new Error(data.error ?? "drafting failed")
      setDraft({ record: data.record, content: data.content ?? "" })
      setDraftScores(scoresFromRecord(data.record))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "drafting failed")
    } finally {
      setDrafting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!draft || savingDraft) return
    setSavingDraft(true)
    setActionError(null)
    const res = await postJson("/api/admin/cafes", { ...draft.record, scores: draftScores })
    if (!res.ok) setActionError(res.error ?? "save failed")
    setSavingDraft(false)
    if (res.ok) {
      setDraft(null)
      setNotes("")
      router.refresh()
    }
  }

  const handleSaveScores = async (cafeId: string, scores: ScoreInput, markReviewed = false) => {
    setBusyId(cafeId)
    setActionError(null)
    const res = await postJson(`/api/admin/cafes/${cafeId}/scores`, { ...scores, markReviewed })
    if (!res.ok) setActionError(res.error ?? "save failed")
    setBusyId(null)
    router.refresh()
  }

  const reviewedCount = data.cafes.filter(({ score }) => score?.scoresReviewedAt).length
  const sortedCafes = [...data.cafes].sort((a, b) => {
    const ra = a.score?.scoresReviewedAt ? 1 : 0
    const rb = b.score?.scoresReviewedAt ? 1 : 0
    return ra - rb || a.cafe.name.localeCompare(b.cafe.name)
  })
  const visibleCafes = showReviewed ? sortedCafes : sortedCafes.filter(({ score }) => !score?.scoresReviewedAt)

  return (
    <div className="space-y-10">
      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-coffee-900">
          Flagged submissions ({data.flagged.length})
        </h2>
        {data.flagged.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-coffee-300 p-6 text-sm text-coffee-400">
            Nothing waiting. New submissions that can&apos;t be auto-verified land here.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {data.flagged.map(({ submission, draft, reasoning }) => (
              <div key={submission.id} className="rounded-xl border border-coffee-200 bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-coffee-900">{submission.submittedName}</h3>
                  <span className="text-xs text-coffee-400">
                    {new Date(submission.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-coffee-600">{submission.submittedLocation}</p>
                {submission.submitterNote && (
                  <p className="mt-1 text-xs text-coffee-400">“{submission.submitterNote}”</p>
                )}
                {reasoning && (
                  <p className="mt-2 rounded-lg bg-coffee-50 p-2 text-xs text-coffee-600">
                    {reasoning}
                  </p>
                )}
                {draft ? (
                  <div className="mt-3">
                    <p className="text-xs text-coffee-500">
                      Agent draft: {draft.name} · {draft.neighborhood ?? "?"} · tier {draft.priceTier}
                    </p>
                    <p className="mb-2 mt-1 text-[11px] text-coffee-400">
                      Adjust scores if needed before approving.
                    </p>
                    <ScoreEditor
                      scores={submissionScores[submission.id] ?? scoresFromRecord(draft)}
                      onChange={(s) =>
                        setSubmissionScores((prev) => ({ ...prev, [submission.id]: s }))
                      }
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-coffee-700">
                    No draft record — reject or use curator assist.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === submission.id}
                    onClick={() =>
                      handleAction(
                        submission.id,
                        "approve",
                        draft
                          ? submissionScores[submission.id] ?? draft.scores
                          : undefined,
                      )
                    }
                    className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    Approve &amp; promote
                  </button>
                  <button
                    type="button"
                    disabled={busyId === submission.id}
                    onClick={() => handleAction(submission.id, "reject")}
                    className="rounded-lg border border-coffee-300 px-3 py-1.5 text-sm font-medium text-coffee-600 hover:bg-coffee-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-coffee-900">Curator assist</h2>
        <p className="mt-1 text-sm text-coffee-500">
          Paste notes or a link — the agent drafts a complete record.
        </p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. https://… new specialty place in Kypseli, great filter, quiet courtyard"
          className="mt-2 w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm outline-none focus:border-coffee-700"
        />
        <button
          type="button"
          disabled={drafting || notes.trim().length === 0}
          onClick={handleDraft}
          className="mt-2 rounded-lg bg-coffee-800 px-4 py-2 text-sm font-medium text-white hover:bg-coffee-900 disabled:opacity-50"
        >
          {drafting ? "Drafting…" : "Draft record"}
        </button>
        {draft && (
          <div className="mt-3 rounded-xl border border-coffee-200 p-4">
            <p className="text-sm font-semibold text-coffee-900">{draft.record.name}</p>
            <p className="text-xs text-coffee-500">
              {draft.record.address} · {draft.record.neighborhood ?? "?"} · tier{" "}
              {draft.record.priceTier}
            </p>
            <p className="mt-1 text-xs text-coffee-500">{draft.content}</p>
            <div className="mt-3">
              <ScoreEditor scores={draftScores} onChange={setDraftScores} />
            </div>
            <button
              type="button"
              disabled={savingDraft}
              onClick={handleSaveDraft}
              className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {savingDraft ? "Saving…" : "Save as curated café"}
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-coffee-900">
            Café scores{" "}
            <span className="text-sm font-normal text-coffee-500">
              · {reviewedCount} / {data.cafes.length} reviewed
            </span>
          </h2>
          <label className="flex items-center gap-1.5 text-xs text-coffee-500">
            <input
              type="checkbox"
              checked={showReviewed}
              onChange={(e) => setShowReviewed(e.target.checked)}
            />
            Show reviewed
          </label>
        </div>
        <p className="mt-1 text-xs text-coffee-400">
          Unreviewed first. “Save scores” keeps a café as draft; “Save &amp; mark reviewed” records
          your approval. Editing a reviewed café resets it to draft.
        </p>
        {visibleCafes.length === 0 && (
          <p className="mt-2 rounded-lg border border-dashed border-coffee-300 p-6 text-sm text-coffee-400">
            Every live café has curator-reviewed scores.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {visibleCafes.map(({ cafe, score }) => {
            const current = cafeScores[cafe.id] ?? scoresFromCafeScore(score)
            const reviewedAt = score?.scoresReviewedAt ?? null
            return (
              <div key={cafe.id} className="rounded-xl border border-coffee-200 bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="flex items-baseline gap-2 font-semibold text-coffee-900">
                    <Link href={`/cafes/${cafe.slug}`} className="hover:text-coffee-800">
                      {cafe.name}
                    </Link>
                    {reviewedAt ? (
                      <span
                        title={new Date(reviewedAt).toLocaleString()}
                        className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800"
                      >
                        Reviewed
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        Draft
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-coffee-400">{cafe.neighborhood}</span>
                </div>
                <div className="mt-2">
                  <ScoreEditor
                    scores={current}
                    onChange={(s) => setCafeScores((prev) => ({ ...prev, [cafe.id]: s }))}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === cafe.id}
                    onClick={() => handleSaveScores(cafe.id, current)}
                    className="rounded-lg border border-coffee-300 px-3 py-1.5 text-sm font-medium text-coffee-600 hover:bg-coffee-100 disabled:opacity-50"
                  >
                    Save scores
                  </button>
                  <button
                    type="button"
                    disabled={busyId === cafe.id}
                    onClick={() => handleSaveScores(cafe.id, current, true)}
                    className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {reviewedAt ? "Save & re-mark reviewed" : "Save & mark reviewed"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-coffee-900">Agent runs</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-coffee-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-coffee-200 bg-coffee-50 text-xs uppercase tracking-wide text-coffee-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => (
                <tr key={run.id} className="border-b border-coffee-100">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-coffee-400">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{run.mode}</td>
                  <td className="px-3 py-2 text-xs">
                    {run.decision ?? <span className="text-coffee-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {run.confidenceScore !== null ? run.confidenceScore.toFixed(2) : "—"}
                  </td>
                  <td className="max-w-md truncate px-3 py-2 text-xs text-coffee-500">
                    {run.reasoning ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
