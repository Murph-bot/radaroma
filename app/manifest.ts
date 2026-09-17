import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radaroma — Attica cafés, as a shape",
    short_name: "Radaroma",
    description: "Attica cafés, as a shape. Radar charts, weighted re-ranking, and an AI concierge.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EDE3",
    theme_color: "#F4EDE3",
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
