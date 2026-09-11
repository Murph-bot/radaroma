import { randomUUID } from "node:crypto"
import {
  parseSubmissionRow,
  type Submission,
  type SubmissionInput,
  type SubmissionStatus,
} from "@/lib/schemas/submission"
import { nowIso, type SqlDb } from "@/lib/db/sql"

export class SubmissionRepository {
  constructor(private db: SqlDb) {}

  // Public intake. The server route hardcodes status='new'; the schema and
  // this repository are the only writers, so a forged status is impossible.
  async create(input: SubmissionInput): Promise<Submission> {
    const id = randomUUID()
    await this.db.run(
      `insert into submissions (id, submitted_name, submitted_location, submitter_note, status, created_at)
       values (?, ?, ?, ?, 'new', ?)`,
      [id, input.submittedName, input.submittedLocation, input.submitterNote || null, nowIso()],
    )
    const created = await this.findById(id)
    if (!created) throw new Error("submissions.create: insert did not return a row")
    return created
  }

  async findById(id: string): Promise<Submission | null> {
    const row = await this.db.get("select * from submissions where id = ?", [id])
    return row ? parseSubmissionRow(row) : null
  }

  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    const rows = await this.db.all(
      "select * from submissions where status = ? order by created_at desc",
      [status],
    )
    return rows.map(parseSubmissionRow)
  }

  async updateStatus(
    id: string,
    status: SubmissionStatus,
    promotedCafeId?: string,
  ): Promise<Submission> {
    await this.db.run(
      `update submissions set status = ?, promoted_cafe_id = ? where id = ?`,
      [status, promotedCafeId ?? null, id],
    )
    const updated = await this.findById(id)
    if (!updated) throw new Error("submissions.updateStatus: row not found")
    return updated
  }

  async listRecent(limit = 50): Promise<Submission[]> {
    const rows = await this.db.all(
      "select * from submissions order by created_at desc limit ?",
      [limit],
    )
    return rows.map(parseSubmissionRow)
  }
}
