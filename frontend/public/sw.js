// Cleanup worker for browsers that still have an older service worker registered.
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister())
})
