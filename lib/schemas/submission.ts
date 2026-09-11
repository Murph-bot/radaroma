import { z } from "zod"

export const SUBMISSION_STATUSES = [
  "new",
  "agent_reviewing",
  "verified",
  "flagged",
  "rejected",
  "promoted",
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  submittedName: z.string().min(1),
  submittedLocation: z.string().min(1),
  submitterNote: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  promotedCafeId: z.string().uuid().nullable(),
})
export type Submission = z.infer<typeof SubmissionSchema>

// Public form input — validated before anything touches the database.
export const SubmissionInputSchema = z.object({
  submittedName: z.string().trim().min(1).max(120),
  submittedLocation: z.string().trim().min(1).max(500),
  submitterNote: z.string().trim().max(1000).optional().default(""),
})
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>

export const SubmissionRowSchema = z
  .object({
    id: z.string().uuid(),
    submitted_name: z.string().min(1),
    submitted_location: z.string().min(1),
    submitter_note: z.string().nullable(),
    status: z.enum(SUBMISSION_STATUSES),
    promoted_cafe_id: z.string().uuid().nullable(),
  })
  .transform(
    (r): Submission => ({
      id: r.id,
      submittedName: r.submitted_name,
      submittedLocation: r.submitted_location,
      submitterNote: r.submitter_note,
      status: r.status,
      promotedCafeId: r.promoted_cafe_id,
    }),
  )

export const parseSubmissionRow = (row: unknown): Submission =>
  SubmissionRowSchema.parse(row)
