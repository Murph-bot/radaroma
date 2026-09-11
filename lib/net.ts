// URL safety for the agent's fetchPage tool: block private/internal targets
// (SSRF guard). Hostnames are checked syntactically — no DNS resolution —
// which catches literal private IPs and localhost aliases.
const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.)/

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "")
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true
  }
  if (host.includes(":")) return true // IPv6 literal (incl. ::1)
  if (PRIVATE_IP_RE.test(host)) return true
  return false
}
