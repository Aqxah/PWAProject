import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getDestinationsFromIndexedDB } from './indexedDB.js';

const firebaseConfig = {
    apiKey: "AIzaSyBulS8AeiJ9BWbU0wt7xqi6H4S-3kIqI2Q",
    authDomain: "my-travel-pwa.firebaseapp.com",
    projectId: "my-travel-pwa",
    storageBucket: "my-travel-pwa.firebasestorage.app",
    messagingSenderId: "156646768721",
    appId: "1:156646768721:web:eaabf3a9b0439c0e143870",
    measurementId: "G-Q38YZ2DHDC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add a Record to Firestore
export async function createRecord(data) {
  try {
    const docRef = await addDoc(collection(db, "destinations"), data);
    return docRef.id;  // Return the document ID for future reference
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

// Get Records from Firestore
export async function getRecords() {
    let records = [];
    try {
      // Ensure that 'destinations' is passed as the collection name
      const querySnapshot = await getDocs(collection(db, "destinations"));
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });  // Store document ID along with data
      });
    } catch (error) {
      console.error("Error retrieving documents: ", error);
    }
    return records;  // Return the array of records
  }

// Delete a Record from Firestore
export async function deleteRecord(docId) {
  try {
    const docRef = doc(db, "destinations", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
}

// Update a Record in Firestore
export async function updateRecord(docId, data) {
    try {
      const docRef = doc(db, "destinations", docId);  // Get a reference to the document using docId
      await updateDoc(docRef, data);  // Update the document with new data
      console.log("Document updated successfully!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }

// Sync IndexedDB with Firebase when online
export async function syncIndexedDBWithFirebase() {
    if (!navigator.onLine) return; // Don't sync if offline
    // Get destinations from IndexedDB and sync to Firebase
    getDestinationsFromIndexedDB(async function (destinations) {
        if (destinations.length > 0) {
            for (const destination of destinations) {
                try {
                    const docRef = await createRecord(destination);
                    console.log(`Destination ${destination.name} synced with Firebase`);
                    deleteDestinationFromIndexedDB(destination.id); // Optional: delete from IndexedDB after syncing
                } catch (error) {
                    console.error("Error syncing destination to Firebase:", error);
                }
            }
        }
    });
}