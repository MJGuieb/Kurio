// Kurio POS service worker: lets the installed app open and work with no internet.
// The app keeps its data in the browser (localStorage), so only the app files need caching.
// Change CACHE when you update index.html or style.css so devices pick up the new version.
const CACHE = "kurio-pos-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Show the saved copy right away (works offline), and refresh it in the background when online.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request)
        .then((response) => { if (response.ok) cache.put(request, response.clone()); return response; })
        .catch(() => cached || (request.mode === "navigate" ? cache.match("./index.html") : undefined));
      return cached || fresh;
    })
  );
});
