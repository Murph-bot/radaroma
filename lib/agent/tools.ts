import { z } from "zod"
import { CafeRepository } from "@/lib/db/repositories/cafes"
import { ScoreRepository } from "@/lib/db/repositories/scores"
import { haversineMeters } from "@/lib/geo"
import { isBlockedHostname } from "@/lib/net"
import { DEFAULT_WEIGHTS, rankCafes, type Weights } from "@/lib/ranking"
import { ScoreInputSchema } from "@/lib/schemas/score"
import type { SqlDb } from "@/lib/db/sql"
import { duckDuckGoSearch } from "./searchFallback"
import type { ToolDefinition } from "./types"

// Structured café draft the agent can propose (verify + curator modes).
export const DraftRecordSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  lat: z.number().nullable().optional().default(null),
  lng: z.number().nullable().optional().default(null),
  neighborhood: z.string().nullable().optional().default(null),
  priceTier: z.number().int().min(1).max(4),
  scores: ScoreInputSchema,
})
export type DraftRecord = z.infer<typeof DraftRecordSchema>

export interface ToolContext {
  db: SqlDb
  searchApiKey?: string
}

export interface AgentTool {
  name: string
  description: string
  inputSchema: z.ZodTypeAny
  execute(args: unknown, ctx: ToolContext): Promise<unknown>
}

const SearchWebInputSchema = z.object({ query: z.string().min(3).max(200) })

const searchWeb: AgentTool = {
  name: "searchWeb",
  description:
    "Search the web for a café's official presence (website, Google Maps listing, reviews). Returns up to 5 results with title, url, and snippet.",
  inputSchema: SearchWebInputSchema,
  async execute(args, ctx) {
    const { query } = args as z.infer<typeof SearchWebInputSchema>
    if (!ctx.searchApiKey) {
      try {
        const results = await duckDuckGoSearch(query)
        return results.length
          ? { results, source: "duckduckgo" }
          : { results: [], hint: "no results — try fetchPage with a known URL" }
      } catch (e) {
        return { error: `search failed: ${e instanceof Error ? e.message : "unknown error"}` }
      }
    }
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: ctx.searchApiKey,
          query,
          max_results: 5,
          include_answer: false,
        }),
      })
      if (!res.ok) return { error: `search provider HTTP ${res.status}` }
      const data = (await res.json()) as {
        results?: { title: string; url: string; content: string }[]
      }
      return {
        results: (data.results ?? []).slice(0, 5).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 300),
        })),
      }
    } catch (e) {
      return { error: `search failed: ${e instanceof Error ? e.message : "unknown error"}` }
    }
  },
}

const MAX_PAGE_CHARS = 4_000

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const FetchPageInputSchema = z.object({ url: z.string().url() })

const fetchPage: AgentTool = {
  name: "fetchPage",
  description:
    "Fetch a URL and return its readable text content (first 4000 chars). Use for the submitted link, menus, or official pages.",
  inputSchema: FetchPageInputSchema,
  async execute(args, ctx) {
    void ctx
    const { url } = args as z.infer<typeof FetchPageInputSchema>
    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: "unsupported protocol" }
      }
      if (isBlockedHostname(parsed.hostname)) {
        return { error: "blocked host (private/internal addresses are not allowed)" }
      }
      const res = await fetch(parsed, {
        headers: { "user-agent": "PourCompass/1.0 (+cafe comparison)" },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return { error: `HTTP ${res.status}` }
      const text = stripHtml(await res.text()).slice(0, MAX_PAGE_CHARS)
      return { url, text: text || "(empty page)" }
    } catch (e) {
      return { error: `fetch failed: ${e instanceof Error ? e.message : "unknown error"}` }
    }
  },
}

const FindNearbyInputSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radiusM: z.number().int().min(50).max(5_000).default(500),
})

const findNearbyCafes: AgentTool = {
  name: "findNearbyCafes",
  description:
    "Find existing cafés in the dataset within a radius of a point (duplicate check). Returns name, slug, and distance.",
  inputSchema: FindNearbyInputSchema,
  async execute(args, ctx) {
    const { lat, lng, radiusM } = args as z.infer<typeof FindNearbyInputSchema>
    const repo = new CafeRepository(ctx.db)
    const nearby = await repo.findNearby(lat, lng, radiusM)
    return {
      count: nearby.length,
      cafes: nearby.map((c) => ({
        name: c.name,
        slug: c.slug,
        address: c.address,
        distanceM: Math.round(haversineMeters(lat, lng, c.lat!, c.lng!)),
      })),
    }
  },
}

const draftCafeRecord: AgentTool = {
  name: "draftCafeRecord",
  description:
    "Propose the café record for the dataset: name, address, coordinates, neighborhood, price tier, and the five axis scores (1-5). The record is validated before it is accepted.",
  inputSchema: DraftRecordSchema,
  async execute(args) {
    // The tool's purpose is structured output: validation happens here,
    // and the parsed record is what the pipeline uses.
    return args
  },
}

const WeightInputSchema = z.object({
  quality: z.number().min(0).max(5).optional(),
  priceValue: z.number().min(0).max(5).optional(),
  workFriendliness: z.number().min(0).max(5).optional(),
  quietVibe: z.number().min(0).max(5).optional(),
  specialtyDepth: z.number().min(0).max(5).optional(),
})

const QueryCafesInputSchema = z.object({
  weights: WeightInputSchema.optional(),
  limit: z.number().int().min(1).max(20).default(10),
})

const queryCafesByWeights: AgentTool = {
  name: "queryCafesByWeights",
  description:
    "Rank the dataset by importance weights (each 0-5; omit an axis for neutral). Returns the top cafés with their rank score. This is the ONLY source of café recommendations.",
  inputSchema: QueryCafesInputSchema,
  async execute(args, ctx) {
    const { weights, limit } = args as z.infer<typeof QueryCafesInputSchema>
    const cafes = new CafeRepository(ctx.db)
    const scores = new ScoreRepository(ctx.db)
    const all = await cafes.findVerified()
    const scoreMap = await scores.findForCafes(all.map((c) => c.id))
    const merged: Weights = {
      ...DEFAULT_WEIGHTS,
      ...(weights ?? {}),
    }
    const ranked = rankCafes(all, scoreMap, merged).slice(0, limit)
    return {
      count: ranked.length,
      cafes: ranked.map((r) => ({
        name: r.cafe.name,
        slug: r.cafe.slug,
        neighborhood: r.cafe.neighborhood,
        priceTier: r.cafe.priceTier,
        rankScore: r.rankScore === null ? null : Number(r.rankScore.toFixed(2)),
        axes: r.score
          ? {
              quality: r.score.quality,
              priceValue: r.score.priceValue,
              workFriendliness: r.score.workFriendliness,
              quietVibe: r.score.quietVibe,
              specialtyDepth: r.score.specialtyDepth,
            }
          : null,
      })),
    }
  },
}

export const AGENT_TOOLS: Record<string, AgentTool> = {
  searchWeb,
  fetchPage,
  findNearbyCafes,
  draftCafeRecord,
  queryCafesByWeights,
}

export type AgentToolName = keyof typeof AGENT_TOOLS

export const toolDefinitionsFor = (names: AgentToolName[]): ToolDefinition[] => {
  return names.map((name) => {
    const tool = AGENT_TOOLS[name]
    return {
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.inputSchema) as Record<string, unknown>,
    }
  })
}
