import { signIn, signOutUser, createRecord, getRecords, deleteRecord, updateRecord, syncIndexedDBWithFirebase } from './firebase.js';
import { addDestinationToIndexedDB, getDestinationsFromIndexedDB, updateDestinationInIndexedDB, deleteDestinationFromIndexedDB } from './indexedDB.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const destinationForm = document.getElementById('destination-form');
    const destinationInput = document.getElementById('destination-input');
    const destinationList = document.getElementById('destination-list');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const dropdownGetStartedBtn = document.getElementById('dropdownGetStartedBtn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signInForm = document.getElementById('signInForm');

    // Ensure getStartedBtn exists before adding event listener
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (getStartedBtn.textContent === 'Get Started') {
                // Show sign-in form
                signInForm.style.display = 'block';
                getStartedBtn.textContent = 'Sign In'; // Change button text to 'Sign In'
            } else {
                // Sign in if email/password provided
                if (email && password) {
                    try {
                        await signIn(email, password);
                        getStartedBtn.textContent = 'Sign Out'; // Change button to Sign Out after successful sign in
                        
                        // Clear the email and password fields after successful sign-in
                        emailInput.value = '';
                        passwordInput.value = '';
                    } catch (error) {
                        console.error("Sign-in failed:", error);
                    }
                } else {
                    try {
                        await signOutUser();
                        getStartedBtn.textContent = 'Get Started'; // Change button to Get Started after sign out
                    } catch (error) {
                        console.error("Sign-out failed:", error);
                    }
                }
            }
        });
    }

    if (dropdownGetStartedBtn) {
        dropdownGetStartedBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
    
            if (dropdownGetStartedBtn.textContent === 'Get Started') {
                // Show sign-in form in dropdown
                signInForm.style.display = 'block';
                dropdownGetStartedBtn.textContent = 'Sign In'; // Change button text to 'Sign In'
            } else {
                // Sign-in if email/password provided
                if (email && password) {
                    try {
                        await signIn(email, password); // Sign in
                        dropdownGetStartedBtn.textContent = 'Sign Out'; // Change to Sign Out
                        
                        // Clear the email and password fields after successful sign-in
                        emailInput.value = '';
                        passwordInput.value = '';
                    } catch (error) {
                        console.error("Sign-in failed:", error);
                    }
                } else {
                    try {
                        await signOutUser(); // Sign out
                        dropdownGetStartedBtn.textContent = 'Get Started'; // Change to Get Started after sign-out
                        
                        // Clear the email and password fields after sign-out
                        emailInput.value = '';
                        passwordInput.value = '';
                    } catch (error) {
                        console.error("Sign-out failed:", error);
                    }
                }
            }
        });
    }

    // Handle Add Destination (sync to IndexedDB or Firebase depending on connection status)
    if (destinationForm) {
        destinationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const destinationName = destinationInput.value.trim();
            if (!destinationName) return;

            const newDestination = { name: destinationName };
            const user = getAuth().currentUser;  // Ensure user is authenticated

            if (!user) {
                console.error("No user is signed in. Data cannot be added.");
                return;
            }

            if (navigator.onLine) {
                try {
                    // Add to Firebase
                    const docRef = await createRecord({ ...newDestination, userId: user.uid });  // Save with user ID
                    console.log(`Destination added to Firebase with ID: ${docRef}`);

                    // Update the UI with the new destination
                    addDestinationToUI(newDestination, docRef);
                } catch (error) {
                    console.error("Error adding destination to Firebase:", error);
                }
            } else {
                // Offline, save to IndexedDB
                try {
                    await addDestinationToIndexedDB({ ...newDestination, userId: user.uid });  // Save with user ID
                    console.log("Destination added to IndexedDB");

                    // Update the UI with the new destination
                    addDestinationToUI(newDestination);
                } catch (error) {
                    console.error("Error adding destination to IndexedDB:", error);
                }
            }

            destinationInput.value = ''; // Clear the input field
        });
    }

    // Handle Edit Destination
    if (destinationList) {
        destinationList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit')) {
                const li = e.target.parentElement;
                const docId = li.getAttribute('data-id');
                const currentName = li.textContent.replace("EditDelete", "").trim(); // Get current name

                const newName = prompt("Enter the new destination name:", currentName);
                if (newName && newName !== currentName) {
                    try {
                        const user = getAuth().currentUser;

                        if (!user) {
                            console.error("No user is signed in. Data cannot be edited.");
                            return;
                        }

                        if (navigator.onLine) {
                            // Update Firebase record
                            await updateRecord(docId, { name: newName, userId: user.uid });

                            // Update UI
                            li.querySelector('span').textContent = newName;
                        } else {
                            // Update IndexedDB record
                            await updateDestinationInIndexedDB(docId, { name: newName, userId: user.uid });

                            // Update UI
                            li.querySelector('span').textContent = newName;
                        }
                    } catch (error) {
                        console.error("Error updating destination:", error);
                    }
                }
            }
        });
    }

    // Handle Delete Destination
    if (destinationList) {
        destinationList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete')) {
                const li = e.target.parentElement;
                const docId = li.getAttribute('data-id');

                try {
                    const user = getAuth().currentUser;

                    if (!user) {
                        console.error("No user is signed in. Data cannot be deleted.");
                        return;
                    }

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
    }

    // Fetch destinations and update UI based on online/offline status
    async function fetchDestinations() {
        const user = getAuth().currentUser;

        if (!user) {
            console.error("No user is signed in. Cannot fetch data.");
            return;
        }

        if (navigator.onLine) {
            try {
                const firebaseDestinations = await getRecords();
                console.log("Fetched destinations from Firebase:", firebaseDestinations);

                // Clear and repopulate the UI with Firebase data
                destinationList.innerHTML = '';  // Clear current list
                firebaseDestinations.forEach((destination) => {
                    if (destination.userId === user.uid) {
                        addDestinationToUI(destination, destination.id);
                    }
                });

                // Sync IndexedDB data to Firebase when online
                syncIndexedDBWithFirebase(user.uid);

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
                    if (destination.userId === user.uid) {
                        addDestinationToUI(destination);
                    }
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