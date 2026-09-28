/* Service worker for offline use.
 *
 * ── BUMP VERSION ON EVERY DEPLOY THAT CHANGES ANY FILE BELOW ──
 * There is no build step, so nothing hashes filenames for us. If you edit a
 * CSS/JS/JSON file and do not bump VERSION, browsers keep serving the old copy
 * from cache. Bumping it discards every old cache on the next load.
 */
const VERSION = "v12";

const SHELL = `ff-shell-${VERSION}`;
const DATA = `ff-data-${VERSION}`;

/* Deliberately NOT versioned. This holds videos the student chose to download
   (~171 MB); tying it to VERSION would throw that away on every deploy and
   make them fetch it all again over a phone connection. Its contents are
   whole files addressed by URL, so a new app version cannot invalidate them.
   Renaming a video file is the only thing that would, and that is rare. */
const MEDIA = "ff-media";

const CURRENT = [SHELL, DATA, MEDIA];

const SHELL_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "css/fonts.css",
  "css/tokens.css",
  "css/style.css",
  "css/animations.css",
  "css/sound-toggle-switch.css",
  "js/storage.js",
  "js/language.js",
  "js/ui.js",
  "js/quiz.js",
  "js/animations.js",
  "js/app.js",
  "assets/images/background-image.jpg",
  "assets/images/bg-numbers.jpg",
  "assets/images/bg-numbers.webp",
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

/* Range-aware cache lookup. A <video> element asks for byte ranges; the Cache
   API only stores and matches whole responses, so the slice and its headers
   are built here. A miss falls through to the network untouched. */
async function serveVideo(request) {
  const cache = await caches.open(MEDIA);
  const cached = await cache.match(request.url, { ignoreSearch: true });

  if (!cached) return fetch(request);

  const range = request.headers.get("range");
  if (!range) return cached;

  const buffer = await cached.arrayBuffer();
  const total = buffer.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());

  if (!match) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
  }

  // "bytes=-500" means the LAST 500 bytes, not from 0 to 500. The moov atom
  // often sits at the end of a file, so players do ask for exactly this.
  let start;
  let end;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? total - 1 : Math.min(Number(match[2]), total - 1);
  }

  if (!(start >= 0 && start <= end && end < total)) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
  }

  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Videos: served from the MEDIA cache only once the student has explicitly
  // saved them for offline use. Otherwise they bypass the worker entirely and
  // stream from the network.
  //
  // Cache.match() ignores Range headers, so a cached video must have its
  // byte-range requests answered by hand; returning a whole 200 body to a
  // request that asked for a range breaks seeking and can stop playback.
  if (request.destination === "video" || url.pathname.includes("/assets/videos/")) {
    event.respondWith(serveVideo(request));
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
