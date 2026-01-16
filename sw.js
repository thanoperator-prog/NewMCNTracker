const CACHE_NAME = 'mcn-tracker-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache all assets, but don't fail if some optional ones fail
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
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Check if the request is for an external resource that shouldn't be handled by the cache
  // specifically Firebase Firestore interactions (googleapis)
  const url = new URL(event.request.url);
  
  if (url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('firebaseinstallations.googleapis.com')) {
    return; // Let the network handle Firestore data requests directly
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, otherwise fetch from network
      return cachedResponse || fetch(event.request);
    })
  );
});