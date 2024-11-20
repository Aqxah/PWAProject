/*
const CACHE_NAME = 'PWA-Cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/destinations.html',
    '/contact.html',
    '/services.html',
    '/js/main.js',
    '/js/sync.js', 
    '/js/firebase.js',
    '/js/indexedDB.js',
    '/css/main.css',
    '/css/materialize.min.css', 
    '/js/materialize.min.js',  
    '/img/mountains.avif',
    '/img/favicon.ico', 
];

// Install the service worker and cache essential resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching essential resources');
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch event to serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                console.log('Serving from cache:', event.request.url);
            } else {
                console.log('Fetching from network:', event.request.url);
            }
            return response || fetch(event.request);
        })
    );
});

// Activate event to remove old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
*/