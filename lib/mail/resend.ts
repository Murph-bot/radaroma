// Thin outbound-mail helper over the Resend HTTP API (no SDK). Fail-soft by
// design: a missing key or a failed request logs and returns false — mail
// must never break the request that triggered it.
export const RESEND_ENDPOINT = "https://api.resend.com/emails"
export const DEFAULT_ALERT_TO = "mimis.sotos@gmail.com"
// Resend's shared onboarding sender works without domain verification but
// can only deliver to the account owner's address.
export const DEFAULT_ALERT_FROM = "Radaroma <onboarding@resend.dev>"

export type MailConfig = {
  apiKey?: string
  to: string
  from: string
}

export type MailMessage = {
  subject: string
  text: string
}

export function mailConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): MailConfig {
  return {
    apiKey: env.RESEND_API_KEY?.trim() || undefined,
    to: env.ALERT_EMAIL_TO?.trim() || DEFAULT_ALERT_TO,
    from: env.ALERT_EMAIL_FROM?.trim() || DEFAULT_ALERT_FROM,
  }
}

export async function sendMail(
  config: MailConfig,
  message: MailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!config.apiKey) {
    console.warn("mail: RESEND_API_KEY not set — skipping", { subject: message.subject })
    return false
  }
  try {
    const res = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: message.subject,
        text: message.text,
      }),
    })
    if (!res.ok) {
      console.error("mail: Resend rejected the request", res.status, await res.text().catch(() => ""))
      return false
    }
    return true
  } catch (e) {
    console.error("mail: send failed", e)
    return false
  }
}
