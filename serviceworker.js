const CACHE_NAME = "PWACache";
const urlsToCache = [
    "/",
    "/index.html",
    "/nextvacation.html",
    "/destinations.html",
    "/contact.html",
    "/services.html",
    "/js/firebase.js",
    "/js/indexedDB.js",
    "/js/sync.js",
    "/js/main.js",
    "/css/main.css",
    "/css/materialize.min.css",
    "/js/materialize.min.js",
    "/img/mountains.avif",
    "/img/favicon.ico",
    "/img/arrowhead.jpg",
    "/img/cruise.jpg",
    "/img/hawaii.jpg",
    "/img/italy.jpg",
    "/img/kauffman.jpg",
    "/img/snowboarding.jpg",
    "/img/worldsoffun.jpg",
    "/img/zoo.jpg"
];

// Install Service Worker and cache resources
self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Caching essential resources");
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("Failed to cache resources:", error);
        });
      })
    );
  });
  
  // Fetch resources from cache when offline
  self.addEventListener("fetch", (event) => {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response) {
            return response; // Return network response if online
          }
        })
        .catch((error) => {
          console.log("Network request failed. Serving from cache.", error);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse; // Serve from cache if offline
            }
            return caches.match('/offline.html'); // Optional: serve an offline page
          });
        })
    );
  });
  
  // Activate and clean up old caches
  self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      )
    );
  });

// Sync IndexedDB with Firebase when online
async function syncIndexedDBWithFirebase() {
    if (!navigator.onLine) return; // Don't sync if offline

    // Get destinations from IndexedDB
    getDestinationsFromIndexedDB(async function (destinations) {
        if (destinations.length > 0) {
            for (const destination of destinations) {
                try {
                    // Sync each destination to Firebase
                    await createRecord(destination);  // Assuming createRecord is from Firebase
                    console.log(`Destination ${destination.name} synced with Firebase`);
                    await deleteDestinationFromIndexedDB(destination.id); // Delete from IndexedDB after syncing
                } catch (error) {
                    console.error("Error syncing destination to Firebase:", error);
                }
            }
        }
    });
}