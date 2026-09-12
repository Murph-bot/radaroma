"use client"

import { useEffect } from "react"

// Registers the (pass-through) service worker that makes Radaroma
// installable as a home-screen app. Production builds only.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration is best-effort; the site works without it.
    })
  }, [])

  return null
}
