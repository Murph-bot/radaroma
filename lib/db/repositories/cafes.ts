import type { SupabaseClient } from "@supabase/supabase-js"
import { parseCafeRow, type Cafe, type CafePatch, type NewCafe } from "@/lib/schemas/cafe"
import { haversineMeters } from "@/lib/geo"

export class CafeRepository {
  constructor(private client: SupabaseClient) {}

  async findVerified(): Promise<Cafe[]> {
    const { data, error } = await this.client
      .from("cafes")
      .select("*")
      .eq("status", "verified")
      .order("name")
    if (error) throw new Error(`cafes.findVerified: ${error.message}`)
    return (data ?? []).map(parseCafeRow)
  }

  async findById(id: string): Promise<Cafe | null> {
    const { data, error } = await this.client
      .from("cafes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(`cafes.findById: ${error.message}`)
    return data ? parseCafeRow(data) : null
  }

  async findBySlug(slug: string): Promise<Cafe | null> {
    const { data, error } = await this.client
      .from("cafes")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    if (error) throw new Error(`cafes.findBySlug: ${error.message}`)
    return data ? parseCafeRow(data) : null
  }

  async findByStatus(status: Cafe["status"]): Promise<Cafe[]> {
    const { data, error } = await this.client
      .from("cafes")
      .select("*")
      .eq("status", status)
      .order("name")
    if (error) throw new Error(`cafes.findByStatus: ${error.message}`)
    return (data ?? []).map(parseCafeRow)
  }

  // Duplicate detection for the verify pipeline: cafés within radiusM of a
  // point. Dataset is small, so distance is computed in JS (haversine).
  async findNearby(lat: number, lng: number, radiusM: number): Promise<Cafe[]> {
    const verified = await this.findVerified()
    return verified.filter(
      (c) =>
        c.lat !== null &&
        c.lng !== null &&
        haversineMeters(lat, lng, c.lat, c.lng) <= radiusM,
    )
  }

  async create(input: NewCafe): Promise<Cafe> {
    const { data, error } = await this.client
      .from("cafes")
      .insert({
        slug: input.slug,
        name: input.name,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        neighborhood: input.neighborhood,
        price_tier: input.priceTier,
        source: input.source,
        status: input.status,
        confidence_score: input.confidenceScore,
        verification_notes: input.verificationNotes,
      })
      .select()
      .single()
    if (error) throw new Error(`cafes.create: ${error.message}`)
    return parseCafeRow(data)
  }

  async update(id: string, patch: CafePatch): Promise<Cafe> {
    const { data, error } = await this.client
      .from("cafes")
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.address !== undefined && { address: patch.address }),
        ...(patch.lat !== undefined && { lat: patch.lat }),
        ...(patch.lng !== undefined && { lng: patch.lng }),
        ...(patch.neighborhood !== undefined && { neighborhood: patch.neighborhood }),
        ...(patch.priceTier !== undefined && { price_tier: patch.priceTier }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.confidenceScore !== undefined && {
          confidence_score: patch.confidenceScore,
        }),
        ...(patch.verificationNotes !== undefined && {
          verification_notes: patch.verificationNotes,
        }),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`cafes.update: ${error.message}`)
    return parseCafeRow(data)
  }

  async markVerified(id: string, verifiedAt = new Date().toISOString()): Promise<Cafe> {
    const { data, error } = await this.client
      .from("cafes")
      .update({ status: "verified", verified_at: verifiedAt })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`cafes.markVerified: ${error.message}`)
    return parseCafeRow(data)
  }
}
