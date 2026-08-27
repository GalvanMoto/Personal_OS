// DLRS Personal OS Service Worker — PWA: offline cache + push + badge + background sync
const CACHE = "dlrs-v1";
const CORE = ["/manifest.json", "/favicon.ico", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Offline + cache strategy: NetworkFirst for navigations, CacheFirst for assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigations (pages) — NetworkFirst with offline fallback to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/dashboard")))
    );
    return;
  }

  // Assets (js/css/img/font) — CacheFirst
  if (url.pathname.startsWith("/_next/") || url.pathname.match(/\.(?:js|css|png|jpg|jpeg|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});

// Background Sync — retry queued captures when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "dlrs-capture-queue") {
    event.waitUntil(
      // Open pending queue from IndexedDB via clients message if needed; for now just claim and let app retry on next RealtimeRefresh
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "dlrs-sync" }));
      })
    );
  }
});

// Periodic Sync (if granted)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "dlrs-refresh") {
    event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => clients.forEach((c) => c.postMessage({ type: "dlrs-refresh" }))));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const p = event.data.json();
    const title = p.title || "DLRS Personal OS";
    const tag = p.tag || "dlrs-notification";
    const options = {
      body: p.body || "You have a new update from your AI Chief-of-Staff.",
      icon: p.icon || "/favicon.ico",
      badge: p.badge || "/favicon.ico",
      data: { url: p.url || "/dashboard" },
      tag,
      renotify: true,
      requireInteraction: !!p.requireInteraction,
      actions: p.actions || [
        { action: "open", title: "Open" },
        { action: "snooze", title: "Snooze" },
      ],
      vibrate: p.vibrate || [100, 50, 100],
    };
    // App badge — count of actionable items if supplied
    if (p.badgeCount && "setAppBadge" in navigator) {
      try { navigator.setAppBadge(p.badgeCount); } catch {}
    } else if (p.badgeCount === 0 && "clearAppBadge" in navigator) {
      try { navigator.clearAppBadge(); } catch {}
    }
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("push parse", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;

  // Action handling
  if (action === "snooze") {
    // Let app handle snooze via message; keep notification closed
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "dlrs-snooze", notificationId: data.id }));
      })
    );
    return;
  }

  const targetUrl = data.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(new URL(targetUrl, self.location.origin).pathname) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("notificationclose", () => {
  // no-op, placeholder for dismissal analytics
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title || "DLRS Personal OS", {
      body: event.data.body || "",
      icon: event.data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: event.data.data || { url: "/" },
      vibrate: [100, 50, 100],
    });
  }
  if (event.data && event.data.type === "SET_BADGE" && "setAppBadge" in navigator) {
    const n = event.data.count;
    try { if (n > 0) navigator.setAppBadge(n); else navigator.clearAppBadge(); } catch {}
  }
  if (event.data && event.data.type === "CLEAR_BADGE" && "clearAppBadge" in navigator) {
    try { navigator.clearAppBadge(); } catch {}
  }
});
