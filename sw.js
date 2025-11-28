const CACHE_NAME = 'promocity-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/comercio.html',
  '/planos.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  '/assets/img/app-icon.png',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
