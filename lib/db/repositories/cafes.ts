import { randomUUID } from "node:crypto"
import { parseCafeRow, type Cafe, type CafePatch, type NewCafe } from "@/lib/schemas/cafe"
import { haversineMeters } from "@/lib/geo"
import { nowIso, type SqlDb } from "@/lib/db/sql"

export class CafeRepository {
  constructor(private db: SqlDb) {}

  async findVerified(): Promise<Cafe[]> {
    const rows = await this.db.all(
      "select * from cafes where status = 'verified' order by name",
    )
    return rows.map(parseCafeRow)
  }

  async findById(id: string): Promise<Cafe | null> {
    const row = await this.db.get("select * from cafes where id = ?", [id])
    return row ? parseCafeRow(row) : null
  }

  async findBySlug(slug: string): Promise<Cafe | null> {
    const row = await this.db.get("select * from cafes where slug = ?", [slug])
    return row ? parseCafeRow(row) : null
  }

  async findByStatus(status: Cafe["status"]): Promise<Cafe[]> {
    const rows = await this.db.all("select * from cafes where status = ? order by name", [status])
    return rows.map(parseCafeRow)
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
    const id = randomUUID()
    const now = nowIso()
    await this.db.run(
      `insert into cafes (
        id, slug, name, address, lat, lng, neighborhood, price_tier, source,
        status, confidence_score, verification_notes, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.slug,
        input.name,
        input.address,
        input.lat,
        input.lng,
        input.neighborhood,
        input.priceTier,
        input.source,
        input.status,
        input.confidenceScore,
        input.verificationNotes,
        now,
        now,
      ],
    )
    const created = await this.findById(id)
    if (!created) throw new Error("cafes.create: insert did not return a row")
    return created
  }

  async update(id: string, patch: CafePatch): Promise<Cafe> {
    const sets: string[] = []
    const params: (string | number | null)[] = []
    const push = (col: string, value: string | number | null) => {
      sets.push(`${col} = ?`)
      params.push(value)
    }
    if (patch.name !== undefined) push("name", patch.name)
    if (patch.address !== undefined) push("address", patch.address)
    if (patch.lat !== undefined) push("lat", patch.lat)
    if (patch.lng !== undefined) push("lng", patch.lng)
    if (patch.neighborhood !== undefined) push("neighborhood", patch.neighborhood)
    if (patch.priceTier !== undefined) push("price_tier", patch.priceTier)
    if (patch.status !== undefined) push("status", patch.status)
    if (patch.confidenceScore !== undefined) push("confidence_score", patch.confidenceScore)
    if (patch.verificationNotes !== undefined) push("verification_notes", patch.verificationNotes)
    sets.push("updated_at = ?")
    params.push(nowIso(), id)

    await this.db.run(`update cafes set ${sets.join(", ")} where id = ?`, params)
    const updated = await this.findById(id)
    if (!updated) throw new Error("cafes.update: row not found")
    return updated
  }

  async markVerified(id: string, verifiedAt = nowIso()): Promise<Cafe> {
    await this.db.run(
      "update cafes set status = 'verified', verified_at = ?, updated_at = ? where id = ?",
      [verifiedAt, nowIso(), id],
    )
    const updated = await this.findById(id)
    if (!updated) throw new Error("cafes.markVerified: row not found")
    return updated
  }
}
