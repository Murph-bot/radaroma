// Public-facing café blurb: verification_notes carries draft disclaimers
// ("scores estimate", "coords approximate") that must never render on the
// site. Admin views keep the raw field; public pages go through this.

const SCORES_ESTIMATE = /\bscores?\s+estimate\b/gi
const COORDS_APPROXIMATE = /\bcoords?\s+approximated?\b/gi

export function curatorBlurb(notes: string | null): string | null {
  if (!notes) return null
  const text = notes
    .replace(SCORES_ESTIMATE, "")
    .replace(COORDS_APPROXIMATE, "")
    .replace(/(\s*;\s*)+/g, "; ")
    .replace(/^[;.\s]+|[;.\s]+$/g, "")
    .trim()
  if (!text) return null
  return /[.!?]$/.test(text) ? text : `${text}.`
}
