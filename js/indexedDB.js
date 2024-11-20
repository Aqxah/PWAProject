export const DB_NAME = "destinationsDB";
export const DB_VERSION = 1;  // Database version
export const STORE_NAME = "destinations";  // Object store name

let db;

// Open the IndexedDB database and return a Promise to wait until db is initialized
export async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // Database version upgrade handler
        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onerror = function (event) {
            console.error("Error opening IndexedDB", event);
            reject(event);
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("IndexedDB opened successfully!");
            resolve(db);
        };
    });
}

// Ensure we have a valid connection to IndexedDB before proceeding
function ensureDB() {
    if (!db) {
        return openDB();
    }
    return Promise.resolve(db);
}

// Add a new destination to IndexedDB
export async function addDestinationToIndexedDB(destination) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(destination);

        request.onsuccess = function () {
            console.log("Destination added to IndexedDB");
            resolve();
        };

        request.onerror = function (event) {
            console.error("Error adding destination to IndexedDB", event);
            reject(event);
        };
    });
}

// Get all destinations from IndexedDB
export function getDestinationsFromIndexedDB(callback) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function() {
                resolve(getAllRequest.result);  
            };

            getAllRequest.onerror = function(event) {
                console.error("Error fetching destinations from IndexedDB", event);
                reject(event);
            };
        };

        request.onerror = function(event) {
            console.error("Error opening IndexedDB", event);
            reject(event);
        };
    });
}

// Update a destination in IndexedDB
export async function updateDestinationInIndexedDB(id, updatedData) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id); 

        request.onsuccess = function () {
            const data = request.result;

            if (!data) {
                console.error("No data found for ID:", id);
                reject(new Error("Data not found for ID: " + id));
                return;
            }

            Object.assign(data, updatedData);
            store.put(data); // Save the updated data

            transaction.oncomplete = function () {
                console.log("Destination updated in IndexedDB");
                resolve();
            };
        };

        request.onerror = function (event) {
            console.error("Error fetching data from IndexedDB", event);
            reject(event);
        };
    });
}

// Delete a destination from IndexedDB
export async function deleteDestinationFromIndexedDB(id) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        transaction.oncomplete = function () {
            console.log("Destination deleted from IndexedDB");
            resolve();
        };

        transaction.onerror = function (event) {
            console.error("Error deleting destination from IndexedDB", event);
            reject(event);
        };
    });
}