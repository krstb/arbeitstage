const CACHE_NAME = 'arbeitstage-v2';
const ASSETS = [
  'arbeitstage.html',
  'manifest.json',
  'icon-192.png',
  'favicon.svg'
];

// 1. Installation: Dateien beim ersten Start cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Aktivierung: Alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.claim();
});

// 3. Fetch-Event: Offline-First Strategie
self.addEventListener('fetch', (event) => {
  // Wir beantworten Anfragen primär aus dem Cache (schnell & funktioniert immer offline)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Optional: Im Hintergrund versuchen, die Datei zu aktualisieren, falls Netz da ist
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignorieren, wenn kein Netz da ist (wir sind ja offline / im Flugmodus)
        });

        return cachedResponse;
      }

      // Falls die Datei nicht im Cache ist, ganz normal aus dem Netz laden
      return fetch(event.request);
    })
  );
});
