/* Service worker for offline use.
 *
 * ── BUMP VERSION ON EVERY DEPLOY THAT CHANGES ANY FILE BELOW ──
 * There is no build step, so nothing hashes filenames for us. If you edit a
 * CSS/JS/JSON file and do not bump VERSION, browsers keep serving the old copy
 * from cache. Bumping it discards every old cache on the next load.
 */
const VERSION = "v5";

const SHELL = `ff-shell-${VERSION}`;
const DATA = `ff-data-${VERSION}`;
const MEDIA = `ff-media-${VERSION}`;
const CURRENT = [SHELL, DATA, MEDIA];

const SHELL_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "css/fonts.css",
  "css/tokens.css",
  "css/style.css",
  "css/animations.css",
  "css/responsive.css",
  "css/sound-toggle-switch.css",
  "js/storage.js",
  "js/language.js",
  "js/ui.js",
  "js/quiz.js",
  "js/animations.js",
  "js/app.js",
  "assets/images/background-image.jpg",
  "assets/images/math-pattern.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-192.png",
  "assets/icons/icon-maskable-512.png",
  "assets/fonts/baloo-2-latin-var.woff2",
  "assets/fonts/poppins-latin-400.woff2",
  "assets/fonts/poppins-latin-500.woff2",
  "assets/fonts/poppins-latin-600.woff2",
  "assets/fonts/poppins-latin-700.woff2",
  "assets/fonts/poppins-latin-800.woff2",
  "assets/fonts/space-mono-latin-400.woff2",
  "assets/fonts/space-mono-latin-700.woff2",
];

const QUIZ_ASSETS = [];
for (const lesson of [1, 2, 3, 4]) {
  for (const lang of ["en", "tl", "bi"]) {
    QUIZ_ASSETS.push(`quizzes/json/lesson${lesson}-${lang}.json`);
  }
}

async function precache(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.allSettled(urls.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precache(SHELL, SHELL_ASSETS);
      await precache(DATA, QUIZ_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("ff-") && !CURRENT.includes(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL);
      cache.put("index.html", response.clone());
    }
    return response;
  } catch (err) {
    const cached = (await caches.match(request)) || (await caches.match("index.html"));
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Videos bypass the worker entirely. Cache.match() ignores Range headers, so
  // answering a byte-range request from cache breaks seeking and can stop
  // playback outright. The network stack handles ranges correctly on its own.
  if (request.destination === "video" || request.headers.has("range") || url.pathname.includes("/assets/videos/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.includes("/quizzes/json/")) {
    event.respondWith(cacheFirst(request, DATA));
    return;
  }

  // ~1MB and opt-in, so it is fetched on first play rather than at install.
  if (request.destination === "audio" || url.pathname.includes("/assets/music/")) {
    event.respondWith(cacheFirst(request, MEDIA));
    return;
  }

  event.respondWith(cacheFirst(request, SHELL));
});
