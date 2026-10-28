const CACHE_NAME = 'rental-app-v1'; // Naikkan versi setiap update
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install: Simpan ke cache
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Membuka cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Langsung aktifkan SW baru
  );
});

// Activate: Hapus cache lama & klaim halaman
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ambil kendali halaman
  );
});

// Fetch: Strategi Cache First, fallback ke network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Ada di cache
        }
        return fetch(event.request).catch(() => {
          // Jika offline & tidak ada di cache, tampilkan index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});