import { createRecord, getRecords, deleteRecord, updateRecord, syncIndexedDBWithFirebase } from './firebase.js';
import { addDestinationToIndexedDB, getDestinationsFromIndexedDB, updateDestinationInIndexedDB, deleteDestinationFromIndexedDB } from './indexedDB.js';

document.addEventListener('DOMContentLoaded', () => {
    const destinationForm = document.getElementById('destination-form');
    const destinationInput = document.getElementById('destination-input');
    const destinationList = document.getElementById('destination-list');

    // Fetch and display destinations from Firebase when online or from IndexedDB when offline
    fetchDestinations();

    // Handle Add Destination (sync to IndexedDB or Firebase depending on connection status)
    destinationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destinationName = destinationInput.value.trim();
        if (!destinationName) return;

        const newDestination = { name: destinationName };

        if (navigator.onLine) {
            try {
                // Add to Firebase
                const docRef = await createRecord(newDestination);
                console.log(`Destination added to Firebase with ID: ${docRef}`);

                // Update the UI with the new destination
                addDestinationToUI(newDestination, docRef);
            } catch (error) {
                console.error("Error adding destination to Firebase:", error);
            }
        } else {
            // Offline, save to IndexedDB
            try {
                await addDestinationToIndexedDB(newDestination);
                console.log("Destination added to IndexedDB");

                // Update the UI with the new destination
                addDestinationToUI(newDestination);
            } catch (error) {
                console.error("Error adding destination to IndexedDB:", error);
            }
        }

        destinationInput.value = ''; // Clear the input field
    });

    // Handle Edit Destination
    destinationList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit')) {
            const li = e.target.parentElement;
            const docId = li.getAttribute('data-id');
            const currentName = li.textContent.replace("EditDelete", "").trim(); // Get current name

            const newName = prompt("Enter the new destination name:", currentName);
            if (newName && newName !== currentName) {
                try {
                    if (navigator.onLine) {
                        // Update Firebase record
                        await updateRecord(docId, { name: newName });

                        // Update UI
                        li.querySelector('span').textContent = newName;
                    } else {
                        // Update IndexedDB record
                        await updateDestinationInIndexedDB(docId, { name: newName });

                        // Update UI
                        li.querySelector('span').textContent = newName;
                    }
                } catch (error) {
                    console.error("Error updating destination:", error);
                }
            }
        }
    });

    // Handle Delete Destination
    destinationList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete')) {
            const li = e.target.parentElement;
            const docId = li.getAttribute('data-id');

            try {
                if (navigator.onLine) {
                    // Delete from Firebase
                    await deleteRecord(docId);

                    // Remove from UI
                    li.remove();
                } else {
                    // Delete from IndexedDB
                    await deleteDestinationFromIndexedDB(docId);

                    // Remove from UI
                    li.remove();
                }
            } catch (error) {
                console.error("Error deleting destination:", error);
            }
        }
    });

    // Fetch destinations and update UI based on online/offline status
    async function fetchDestinations() {
        if (navigator.onLine) {
            try {
                const firebaseDestinations = await getRecords();
                console.log("Fetched destinations from Firebase:", firebaseDestinations);

                // Clear and repopulate the UI with Firebase data
                destinationList.innerHTML = '';  // Clear current list
                firebaseDestinations.forEach((destination) => {
                    addDestinationToUI(destination, destination.id);
                });

                // Sync IndexedDB data to Firebase when online
                syncIndexedDBWithFirebase();

            } catch (error) {
                console.error("Error fetching destinations from Firebase:", error);
            }
        } else {
            try {
                const indexedDBDestinations = await getDestinationsFromIndexedDB();
                console.log("Fetched destinations from IndexedDB:", indexedDBDestinations);

                // Clear and repopulate the UI with IndexedDB data
                destinationList.innerHTML = '';  // Clear current list
                indexedDBDestinations.forEach((destination) => {
                    addDestinationToUI(destination);
                });
            } catch (error) {
                console.error("Error fetching destinations from IndexedDB:", error);
            }
        }
    }

    // Utility function to add destination to the UI
    function addDestinationToUI(destination, docId = null) {
        const li = document.createElement('li');
        li.setAttribute('data-id', docId || destination.id);
        li.innerHTML = `
            <span>${destination.name}</span>
            <button class="delete">Delete</button>
            <button class="edit">Edit</button>
        `;
        destinationList.appendChild(li);
    }
});

if (navigator.onLine) {
    console.log("The app is online.");
} else {
    console.log("The app is offline.");
}