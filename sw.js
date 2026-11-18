const CACHE_NAME = 'arbeitstage-v1';
const ASSETS = [
  'arbeitstage.html',
  'manifest.json',
  'icon-192.png',
  'favicon.svg'
];

// Installation: Dateien cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivierung: Alte Caches aufräumen
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

// Fetch-Event mit GitHub-Erreichbarkeitsprüfung
self.addEventListener('fetch', (event) => {
  // Wir prüfen hier primär HTML-Anfragen (oder alle GET-Requests)
  event.respondWith(
    (async () => {
      try {
        // Versuch 1: Testen, ob GitHub (oder eine externe Ressource) erreichbar ist
        // Wir pingen eine leichte URL an (z.B. die GitHub-Startseite oder die eigene Domain)
        const githubCheck = await fetch('https://github.com', { 
          mode: 'no-cors', 
          cache: 'no-store',
          signal: AbortSignal.timeout(3000) // Timeout nach 3 Sekunden, falls das Portal hängt
        });

        // Wenn GitHub erreichbar ist, versuchen wir die frischeste Version aus dem Netz zu laden
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // Entweder komplett offline ODER im Captive Portal gefangen (GitHub nicht erreichbar)
        // -> Fallback auf den lokalen Cache!
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Falls auch nicht im Cache, Standard-Fehler werfen
        throw error;
      }
    })()
  );
});
