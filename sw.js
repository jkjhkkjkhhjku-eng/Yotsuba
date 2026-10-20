// Simple service worker for To Moon.
// It tries the internet first, so you always get the newest page,
// and falls back to the saved copy when you are offline.

var CACHE = "to-moon-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;               // only handle normal page loads
  if (req.headers.has("range")) return;           // let the background video stream normally
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave Firebase and other sites alone

  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req)
        .then(function (hit) { return hit || caches.match("index.html"); })
        .then(function (hit) { return hit || Response.error(); });
    })
  );
});
