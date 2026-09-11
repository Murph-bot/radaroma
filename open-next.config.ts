// OpenNext config for Cloudflare Workers.
// No incremental cache override: v1 serves mostly dynamic Supabase data,
// default (in-memory) cache is enough. Revisit if we adopt ISR/PPR.
import { defineCloudflareConfig } from "@opennextjs/cloudflare"

export default defineCloudflareConfig({})
