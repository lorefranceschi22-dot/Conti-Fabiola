// Service worker: tiene i file dell'app in cache per usarla senza rete.
const CACHE = 'conti-fabiola-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './src/app.js', './src/model.js', './src/categories.js', './src/store.js', './src/form.js',
  './src/html.js', './src/ui-home.js', './src/ui-movement.js', './src/ui-settings.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Prima la rete (così gli aggiornamenti arrivano), se non c'è si usa la cache.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});
