importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBfQVUquBMAHS6yfSfQCpB-si-n_pW45zY",
  authDomain: "sopra-fs25-group40-server.firebaseapp.com",
  projectId: "sopra-fs25-group40-server",
  storageBucket: "sopra-fs25-group40-server.firebasestorage.app",
  messagingSenderId: "752801667243",
  appId: "1:752801667243:web:c9e3cc3a0019d05648bfee",
  measurementId: "G-03TGS79RB1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    // icon: "/icon.png", // Optional: Notification icon
  });
});
