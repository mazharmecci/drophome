// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqFJ85euyPb4QV863AmBF9zHv34WIdmrg",
  authDomain: "drophome-1cb76.firebaseapp.com",
  projectId: "drophome-1cb76",
  storageBucket: "drophome-1cb76.appspot.com",
  messagingSenderId: "268666785164",
  appId: "1:268666785164:web:6b02f3242b9e21fad25aa9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
