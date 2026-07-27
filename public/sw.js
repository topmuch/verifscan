/* VerifScan Service Worker — PWA offline cache
 *
 * Strategy:
 *  - App shell (HTML/JS/CSS): stale-while-revalidate
 *  - Static assets (images, fonts): cache-first
 *  - API GET /api/products/featured, /api/scans/[lot]: network-first with cache fallback (offline scan)
 *  - POST /api/scans: background sync queue (saved locally, retried when back online)
 */

const CACHE_VERSION = "v5-20260728";
const STATIC_CACHE = `vs-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vs-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/produits",
  "/offline.html",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
];

// --- Install: precache app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

// --- Activate: clean old caches ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- Helpers ---
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/hero/") ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|woff2?|ttf|ico)$/i.test(url.pathname)
  );
}

// --- Fetch handler ---
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Skip non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // Skip Next.js HMR / dev
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // 1) Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return resp;
          })
      )
    );
    return;
  }

  // 2) Navigation requests: network-first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        })
    );
    return;
  }

  // 3) API GET (scan / featured): network-first with cache (enables offline scan re-display)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request).then((c) => c || Response.error()))
    );
    return;
  }

  // 4) Default: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// --- Background sync: replay queued scans when back online ---
self.addEventListener("sync", (event) => {
  if (event.tag === "vs-scan-queue") {
    event.waitUntil(replayQueuedScans());
  }
});

async function replayQueuedScans() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const queue = await idbGetAll("vs-scan-queue");
    for (const item of queue) {
      try {
        const resp = await fetch(item.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });
        if (resp.ok) {
          await idbDelete("vs-scan-queue", item.id);
        }
      } catch (e) {
        // silent retry on next sync
      }
    }
  } catch (e) {
    // ignore
  }
}

// Minimal IndexedDB key-value helpers (no external lib)
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vs-offline", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("vs-scan-queue", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(store) {
  const db = await idbOpen();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function idbDelete(store, id) {
  const db = await idbOpen();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
