import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radaroma — Attica cafés, ranked your way",
    short_name: "Radaroma",
    description: "Curated Attica cafés with radar charts, weighted re-ranking, and an AI concierge.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F0",
    theme_color: "#FAF6F0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
