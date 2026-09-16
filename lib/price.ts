// Euro price tiers — this is Greece. Single source of truth so the
// card, explorer filter, and detail page can't drift back to "$".
export const PRICE_TIER_LABELS = ["", "€", "€€", "€€€", "€€€€"] as const

export function priceTierLabel(tier: number): string {
  return PRICE_TIER_LABELS[tier] ?? ""
}
