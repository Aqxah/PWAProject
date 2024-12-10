import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

export const DB_NAME = "destinationsDB";
export const DB_VERSION = 1;  // Database version
export const STORE_NAME = "destinations";  // Object store name

let db;

// Ensure we have a valid connection to IndexedDB before proceeding
function ensureDB() {
    if (!db) {
        return openDB();
    }
    return Promise.resolve(db);
}

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

// Add a new destination to IndexedDB, linked to user UID
export async function addDestinationToIndexedDB(destination) {
    const user = getAuth().currentUser;  // Get the current Firebase user
    if (!user) {
        console.error("No user is signed in.");
        return;
    }
    destination.userId = user.uid;  // Link the destination with the user's UID

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

// Get all destinations from IndexedDB, filtered by user UID
export async function getDestinationsFromIndexedDB(callback) {
    const user = getAuth().currentUser;  // Get the current Firebase user
    if (!user) {
        console.error("No user is signed in.");
        return;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function () {
                // Filter the data by user UID
                const userDestinations = getAllRequest.result.filter(destination => destination.userId === user.uid);
                resolve(userDestinations);
            };

            getAllRequest.onerror = function (event) {
                console.error("Error fetching destinations from IndexedDB", event);
                reject(event);
            };
        };

        request.onerror = function (event) {
            console.error("Error opening IndexedDB", event);
            reject(event);
        };
    });
}

// Update a destination in IndexedDB, ensuring it's linked to the correct user
export async function updateDestinationInIndexedDB(id, updatedData) {
    const user = getAuth().currentUser;  // Get the current Firebase user
    if (!user) {
        console.error("No user is signed in.");
        return;
    }

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

            if (data.userId !== user.uid) {
                console.error("User ID mismatch");
                reject(new Error("Cannot update data for another user"));
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

// Delete a destination from IndexedDB, ensuring it's linked to the correct user
export async function deleteDestinationFromIndexedDB(id) {
    const user = getAuth().currentUser;  // Get the current Firebase user
    if (!user) {
        console.error("No user is signed in.");
        return;
    }

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

            if (data.userId !== user.uid) {
                console.error("User ID mismatch");
                reject(new Error("Cannot delete data for another user"));
                return;
            }

            store.delete(id);

            transaction.oncomplete = function () {
                console.log("Destination deleted from IndexedDB");
                resolve();
            };
        };

        request.onerror = function (event) {
            console.error("Error deleting destination from IndexedDB", event);
            reject(event);
        };
    });
}

