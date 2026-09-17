// Curator alert for a finished verify run. Subject leads with the status so
// rejects can be skimmed past; body is short bilingual plain text.
import type { VerifySubmissionResult } from "@/lib/pipeline/verifySubmission"
import type { SubmissionInput } from "@/lib/schemas/submission"
import { mailConfigFromEnv, sendMail, type MailConfig, type MailMessage } from "./resend"

export const ADMIN_URL = "https://radaroma.com/admin"

const STATUS_LABEL: Record<VerifySubmissionResult["status"], string> = {
  flagged: "FLAGGED — needs review / χρειάζεται έλεγχο",
  verified: "VERIFIED — went live / δημοσιεύτηκε",
  rejected: "REJECTED — likely fake / πιθανόν ψεύτικο",
}

const MAX_REASONING = 600

export function buildSubmissionAlert(
  input: SubmissionInput,
  result: VerifySubmissionResult,
): MailMessage {
  const reasoning =
    result.status === "verified" ? `promoted as /cafes/${result.cafeSlug}` : result.reasoning
  const snippet = (reasoning ?? "(no reasoning)").slice(0, MAX_REASONING)
  const lines = [
    `Status / Κατάσταση: ${result.status}`,
    `Name / Όνομα: ${input.submittedName}`,
    `Location / Περιοχή: ${input.submittedLocation}`,
    ...(input.submitterNote ? [`Note / Σημείωση: ${input.submitterNote}`] : []),
    "",
    `Reasoning / Αιτιολόγηση: ${snippet}`,
    "",
    `Submission id: ${result.submissionId}`,
    `Admin: ${ADMIN_URL}`,
  ]
  return {
    subject: `[Radaroma] ${STATUS_LABEL[result.status]}: ${input.submittedName}`,
    text: lines.join("\n"),
  }
}

export async function notifySubmissionOutcome(
  input: SubmissionInput,
  result: VerifySubmissionResult,
  config: MailConfig = mailConfigFromEnv(),
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  return sendMail(config, buildSubmissionAlert(input, result), fetchImpl)
}
