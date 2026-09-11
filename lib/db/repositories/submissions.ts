import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseSubmissionRow,
  type Submission,
  type SubmissionInput,
  type SubmissionStatus,
} from "@/lib/schemas/submission"

export class SubmissionRepository {
  constructor(private client: SupabaseClient) {}

  // Public intake: anon client, RLS enforces status stays 'new'.
  async create(input: SubmissionInput): Promise<Submission> {
    const { data, error } = await this.client
      .from("submissions")
      .insert({
        submitted_name: input.submittedName,
        submitted_location: input.submittedLocation,
        submitter_note: input.submitterNote || null,
      })
      .select()
      .single()
    if (error) throw new Error(`submissions.create: ${error.message}`)
    return parseSubmissionRow(data)
  }

  async findById(id: string): Promise<Submission | null> {
    const { data, error } = await this.client
      .from("submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(`submissions.findById: ${error.message}`)
    return data ? parseSubmissionRow(data) : null
  }

  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    const { data, error } = await this.client
      .from("submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
    if (error) throw new Error(`submissions.findByStatus: ${error.message}`)
    return (data ?? []).map(parseSubmissionRow)
  }

  async updateStatus(
    id: string,
    status: SubmissionStatus,
    promotedCafeId?: string,
  ): Promise<Submission> {
    const { data, error } = await this.client
      .from("submissions")
      .update({
        status,
        ...(promotedCafeId !== undefined && { promoted_cafe_id: promotedCafeId }),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(`submissions.updateStatus: ${error.message}`)
    return parseSubmissionRow(data)
  }

  async listRecent(limit = 50): Promise<Submission[]> {
    const { data, error } = await this.client
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw new Error(`submissions.listRecent: ${error.message}`)
    return (data ?? []).map(parseSubmissionRow)
  }
}
