const CACHE_NAME = 'pixel-art-generator-cache-v4';
const urlsToCache = [
  // Core App Shell
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  // Icons & Manifest
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon.svg',
  // Preloaded game and UI assets
  '/assets/images/default_player.png',
  '/assets/images/default_obstacle.png',
  '/assets/music/bgm.mp3',
  // External Dependencies
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://esm.sh/zone.js@0.14.8',
  'https://esm.sh/@angular/core@18.1.0',
  'https://esm.sh/@angular/common@18.1.0',
  'https://esm.sh/@angular/compiler@18.1.0',
  'https://esm.sh/@angular/platform-browser@18.1.0',
  'https://esm.sh/@angular/platform-browser-dynamic@18.1.0',
  'https://esm.sh/rxjs@7.8.1',
  'https://esm.sh/rxjs@7.8.1/operators',
  'https://esm.sh/@google/genai@^1.13.0',
  'https://aistudiocdn.com/react@^19.1.1'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        
        const fetchAndCache = (url) => fetch(url, { cache: 'no-store' }).then(response => {
          if (!response.ok) {
            // Don't cache failed responses, but don't fail the entire install
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return;
          }
          return cache.put(url, response);
        }).catch(err => {
            console.error(`Fetch error for ${url}: ${err}`);
        });

        const promises = urlsToCache.map(fetchAndCache);
        return Promise.all(promises);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy to get the latest HTML.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Cache hit - return response
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response to cache
            // We don't cache ranges or non-200 responses for assets.
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // For third-party resources (opaque), cache them but don't fail if they can't be cloned.
            if (response.type === 'opaque' || event.request.url.startsWith('https://')) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        );
      })
  );
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});