This project is a PWA designed to help users plan their vacations by showcasing and allowing them to book various destinations. To view the prototype, download the files and open the index.html file locally on your computer or create a repository to run the website through VS Code. 

Service Worker
The service worker in this project is responsible for caching essential assets and enabling offline functionality. It caches files during the install phase, serves them from the cache during fetch requests, and clears old caches during activation. This ensures the app remains functional offline, allowing users to view destinations even without an internet connection.

IndexedDB & Firebase Database
IndexedDB is used for offline storage, enabling users to add, update, and delete destinations while offline. Data is stored locally and synced with Firebase when the app is online, ensuring data persistence. Firebase, on the other hand, is used to store and manage user-specific destination data in the cloud, offering real-time synchronization across devices.

User Authentication
The app implements Firebase Authentication to handle user sign-ins and sign-outs. Users can create an account or sign in using their email and password. Once authenticated, data is linked to the user's Firebase account, allowing them to access and manage their destination list. When users sign out, their session is terminated, and the data is no longer accessible unless they sign in again.