// No-key web search fallback for the verify agent: DuckDuckGo Lite's
// HTML endpoint. Used only when SEARCH_API_KEY (Tavily) is not set.

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
}

const decodeEntities = (s: string): string =>
  s.replace(/&(?:amp|lt|gt|quot|nbsp|#39|#x27);/g, (m) => ENTITY_MAP[m] ?? m)

const stripTags = (s: string): string =>
  decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()

// DDG Lite wraps targets in a redirect: //duckduckgo.com/l/?uddg=<enc>&rut=…
const decodeResultUrl = (href: string): string | null => {
  const uddg = /[?&]uddg=([^&]+)/.exec(href)?.[1]
  const url = uddg ? decodeURIComponent(uddg) : href
  return url.startsWith("http") ? url : null
}

// Parses the lite.duckduckgo.com table markup: <a class='result-link'> pairs
// with <td class='result-snippet'>. Returns [] when markup is unrecognized.
export function parseDuckDuckGoLite(html: string): SearchResult[] {
  const linkRe =
    /<a\b[^>]*class\s*=\s*["'][^"']*result-link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi
  const hrefRe = /href\s*=\s*["']([^"']+)["']/i
  const snippetRe =
    /<td\b[^>]*class\s*=\s*["'][^"']*result-snippet[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi

  const results: SearchResult[] = []
  const snippets = [...html.matchAll(snippetRe)].map((m) => stripTags(m[1]))

  let i = 0
  for (const m of html.matchAll(linkRe)) {
    const href = hrefRe.exec(m[0])?.[1]
    const url = href ? decodeResultUrl(href) : null
    if (!url) continue
    results.push({ title: stripTags(m[1]), url, snippet: snippets[i++] ?? "" })
    if (results.length >= 5) break
  }
  return results
}

export async function duckDuckGoSearch(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
    {
      headers: { "user-agent": "Radaroma/1.0 (+cafe verification)" },
      signal: AbortSignal.timeout(10_000),
    },
  )
  if (!res.ok) throw new Error(`duckduckgo HTTP ${res.status}`)
  return parseDuckDuckGoLite(await res.text())
}
