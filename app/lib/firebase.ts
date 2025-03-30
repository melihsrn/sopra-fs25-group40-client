'use client';

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBfQVUquBMAHS6yfSfQCpB-si-n_pW45zY",
    authDomain: "sopra-fs25-group40-server.firebaseapp.com",
    projectId: "sopra-fs25-group40-server",
    storageBucket: "sopra-fs25-group40-server.firebasestorage.app",
    messagingSenderId: "752801667243",
    appId: "1:752801667243:web:c9e3cc3a0019d05648bfee",
    measurementId: "G-03TGS79RB1"
};

// Ensure Firebase only runs on the client-side
const firebaseApp = typeof window !== "undefined" ? initializeApp(firebaseConfig) : null;

// Prevent SSR errors
export const messaging = firebaseApp ? getMessaging(firebaseApp) : null;

// export const requestNotificationPermission = async () => {
//   if (typeof window === "undefined" || !messaging) return null; // Skip in SSR

//   try {
//     const permission = await Notification.requestPermission();
//     if (permission !== "granted") {
//       console.log("Notification permission denied");
//       return null;
//     }

//     const token = await getToken(messaging, {
//       vapidKey: "BCFIAlIxte5a7Sz72VHWHfAQ2ZM9XrsaReFAviRIsqJyhVKBzgb7gZoFJ9AkMWKDuwoP4jzOOcvcDuxoWZkMxKw",
//     });

//     if (token) {
//       console.log("FCM Token:", token);
//       return token; // Send token to backend
//     } else {
//       console.log("No registration token available.");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error getting notification token:", error);
//     return null;
//   }
// };

export const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !messaging) return null;

    // Check if the user has already granted permission
    if (Notification.permission !== "granted") {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            // Now you can get the FCM token
            const token = await getToken(messaging, { vapidKey: "BCFIAlIxte5a7Sz72VHWHfAQ2ZM9XrsaReFAviRIsqJyhVKBzgb7gZoFJ9AkMWKDuwoP4jzOOcvcDuxoWZkMxKw" });

            if (token) {
                console.log("FCM Token:", token);
                return token; // Send token to backend
            } else {
                console.log("No registration token available.");
                return null;
            }
        } else {
            console.log("Notification permission denied.");
            return null;
        };
    } else {
        // User has already granted permission
        const token = await getToken(messaging, { vapidKey: "BCFIAlIxte5a7Sz72VHWHfAQ2ZM9XrsaReFAviRIsqJyhVKBzgb7gZoFJ9AkMWKDuwoP4jzOOcvcDuxoWZkMxKw" });
        console.log("FCM Token: ", token);
        return token;
    }
};

// Handle incoming messages (Only run on client)
if (typeof window !== "undefined" && messaging) {
    onMessage(messaging, (payload) => {
        console.log("Message received:", payload);
        alert(`New Quiz Invitation: ${payload.notification?.body}`);
    });
}