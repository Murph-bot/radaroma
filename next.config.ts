import type { NextConfig } from "next"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

// Required for Cloudflare bindings (env vars etc.) to work during `next dev`
initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {}

export default nextConfig
