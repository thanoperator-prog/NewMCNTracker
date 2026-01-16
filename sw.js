const CACHE_NAME = 'mcn-tracker-v5'; // Updated version to v5 to force refresh new config
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://esm.sh/lucide-react@0.263.1'
];

// Install Event
self.addEventListener('install', (event) => {
  // Force this service worker to become the active one, bypassing the waiting state
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(error => {
            console.warn('Failed to cache:', url, error);
          });
        })
      );
    })
  );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(clients.claim());

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignore Firebase/Google API requests (let network handle them directly)
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Network-first strategy for HTML to ensure latest version
      if (event.request.headers.get('accept').includes('text/html')) {
         return fetch(event.request)
            .then(response => {
               return caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, response.clone());
                  return response;
               });
            })
            .catch(() => cachedResponse);
      }

      // Stale-while-revalidate for other assets
      return cachedResponse || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
           if (response.status === 200) {
             cache.put(event.request, response.clone());
           }
           return response;
        });
      });
    })
  );
});