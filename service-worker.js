/* Phase 1 PWA baseline: minimal offline support with safe caching strategy. */
const CACHE_VERSION = "eugeneousxr-1785004100000";
const CACHE_NAME = `${CACHE_VERSION}-core`;
// Persistent, version-INDEPENDENT cache for the heavy 3D boot-loader dino
// (~8 MB). Kept out of the per-deploy cache so it's downloaded once, not on
// every release, and survives the activate cleanup below.
const DINO_CACHE = "inkling-dino-v2";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/style-enhancements.css",
  "/style-enhancements-inkling-nav.css",
  "/style-enhancements-wordweaver.css",
  "/style-enhancements-layers.css",
  "/style-appearance-palettes.css",
  "/account-settings.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/src/main.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  // Auto-activate the new worker so a changed deploy can NEVER leave a client stuck
  // on a stale cache (more robust than waiting for an in-app "Update" tap, which a
  // blank/frozen screen can't show). Best-effort precache: a single asset that 404s
  // mid-propagation must NOT fail the whole install (cache.addAll is atomic — fatal).
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((u) => cache.add(u)))
    )
  );
});

// The page posts this when the user taps "Update" (or to auto-apply on first
// install where there's no controller yet).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME && key !== DINO_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Boot-loader 3D dino assets: cache-first from the persistent DINO_CACHE so
  // that, once warmed, the real raptor renders instantly on every load (and
  // offline). Scoped to /models/dino/* only — never touches app assets/api.
  if (url.pathname.startsWith("/models/dino/")) {
    event.respondWith(
      caches.open(DINO_CACHE).then((cache) =>
        cache.match(event.request).then((hit) =>
          hit ||
          fetch(event.request).then((resp) => {
            if (resp && resp.status === 200) cache.put(event.request, resp.clone());
            return resp;
          })
        )
      )
    );
    return;
  }

  // IMPORTANT: only intercept top-level PAGE NAVIGATIONS (to serve an offline
  // shell). Every other same-origin request — JS modules, CSS, images, /api —
  // is left ALONE so the browser fetches it directly from the network. The
  // worker can therefore never turn a transient hiccup into a hard "Failed to
  // fetch" that strands the app (the bug that left a dead screen). Network-first
  // is the browser's default, so deploys still show fresh.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match("/index.html").then((shell) => shell || fetch(event.request)))
  );
});

/* ===================================================================
 * Web Push alarms — fire even when the app/tab is fully closed.
 * The backend sends an encrypted push (RFC 8291/8292); the OS wakes this
 * worker, which shows the notification. No page needs to be open.
 * =================================================================== */

self.addEventListener("push", (event) => {
  /** @type {{title?:string,body?:string,tag?:string,url?:string,requireInteraction?:boolean,renotify?:boolean,kind?:string}} */
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Inkling", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Inkling alarm";
  const options = {
    body: data.body || "",
    tag: data.tag || `inkling-${data.kind || "alarm"}`,
    // Alarms should persist until the user acts; reminders can auto-dismiss.
    requireInteraction: data.requireInteraction ?? data.kind === "alarm",
    renotify: data.renotify ?? true,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/index.html", kind: data.kind || "alarm" },
    // 8.4 vibrate where supported (Android) — short alarm pattern.
    vibrate: data.kind === "alarm" ? [200, 100, 200, 100, 400] : [120]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/index.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // Focus an existing tab if one is already open, else open a new one.
      for (const client of clientsArr) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(targetUrl).catch(() => {});
          return undefined;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});

// Re-subscribe transparently if the push service rotates the subscription.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        client.postMessage({ type: "inkling-pushsubscriptionchange" });
      }
    })
  );
});
