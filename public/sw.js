// Radaroma service worker — online-only by design: pass-through fetches,
// no caching, no offline support. Its job is to make the app installable
// (Add to Home Screen / Install) and to take over navigation quickly.
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request))
})
