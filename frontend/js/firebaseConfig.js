
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3hYAyTLHBZlKCWv6pPWzKlVT-qKZbip0",
  authDomain: "chatbot-f496c.firebaseapp.com",
  databaseURL: "https://chatbot-f496c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chatbot-f496c",
  storageBucket: "chatbot-f496c.firebasestorage.app",
  messagingSenderId: "64356705410",
  appId: "1:64356705410:web:0b0202cdcffb19f34dc09b",
  measurementId: "G-5GVZT2MH0E"
};
// Inicializa la app de Firebase con esa config
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);// Autenticación login, logout
const db = getFirestore(app);

export { app, db, auth };

