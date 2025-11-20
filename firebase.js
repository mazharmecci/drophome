<!-- Firebase App (the core Firebase SDK) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>

<!-- Add other Firebase SDKs as needed -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>

// Firebase v9 Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqFJ85euyPb4QV863AmBF9zHv34WIdmrg",
  authDomain: "drophome-1cb76.firebaseapp.com",
  projectId: "drophome-1cb76",
  storageBucket: "drophome-1cb76.firebasestorage.app",
  messagingSenderId: "268666785164",
  appId: "1:268666785164:web:6b02f3242b9e21fad25aa9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
