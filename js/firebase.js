import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
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
const auth = getAuth(app);

// Sign In Function
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Signed in:', user.uid);
        // Optionally sync data on sign-in
    } catch (error) {
        console.error('Sign-in error:', error.message);
    }
}

// Sign Out Function
export async function signOutUser() {
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Sign-out error:', error.message);
    }
}

// Track Authentication State
export function onAuthStateChangedListener(callback) {
  onAuthStateChanged(auth, callback);
}

// Create a Record in Firestore
export async function createRecord(data) {
  const user = auth.currentUser;
  if (user) {
    try {
      // Add the user's UID to associate data with the user
      data.userId = user.uid;
      const docRef = await addDoc(collection(db, "destinations"), data);
      return docRef.id;  // Return the document ID for future reference
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }
}

// Get Records from Firestore (user-specific)
export async function getRecords() {
  const user = auth.currentUser;
  let records = [];
  if (user) {
    try {
      const querySnapshot = await getDocs(collection(db, "destinations"));
      querySnapshot.forEach((doc) => {
        if (doc.data().userId === user.uid) {
          records.push({ id: doc.id, ...doc.data() });
        }
      });
    } catch (error) {
      console.error("Error retrieving documents: ", error);
    }
  }
  return records;
}

// Delete a Record from Firestore (user-specific)
export async function deleteRecord(docId) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "destinations", docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  }
}

// Update a Record in Firestore (user-specific)
export async function updateRecord(docId, data) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "destinations", docId);
      await updateDoc(docRef, data);
      console.log("Document updated successfully!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }
}

// Sync IndexedDB with Firebase when online
export async function syncIndexedDBWithFirebase() {
  if (!navigator.onLine) return;  // Don't sync if offline
  const user = auth.currentUser;
  if (user) {
    getDestinationsFromIndexedDB(async function (destinations) {
      if (destinations.length > 0) {
        for (const destination of destinations) {
          try {
            destination.userId = user.uid; // Make sure data is associated with the user
            const docRef = await createRecord(destination);
            console.log(`Destination ${destination.name} synced with Firebase`);
            // Optional: delete from IndexedDB after syncing
          } catch (error) {
            console.error("Error syncing destination to Firebase:", error);
          }
        }
      }
    });
  }
}