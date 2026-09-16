// Kebab-case slug from a café name, e.g. "TAF Coffee" -> "taf-coffee".
// Unicode-aware: Greek (and other non-Latin) letters survive — an Attica
// product needs Greek URLs. Latin diacritics are still stripped ("Café" ->
// "cafe"); NFC recomposition keeps Greek tonos as precomposed codepoints.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/(?<=[a-z])\p{M}/gu, "") // strip combining marks on Latin bases only
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .normalize("NFC")
    .slice(0, 60)
}

// Ensure a slug is unique against existing slugs by appending -2, -3, …
export function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}
