import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase config for drophome
const firebaseConfig = {
  apiKey: "AIzaSyDqFJ85euyPb4QV863AmBF9zHv34WIdmrg",
  authDomain: "drophome-1cb76.firebaseapp.com",
  projectId: "drophome-1cb76",
  storageBucket: "drophome-1cb76.appspot.com",
  messagingSenderId: "268666785164",
  appId: "1:268666785164:web:6b02f3242b9e21fad25aa9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login form handler
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageBox = document.getElementById("loginMessage");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    messageBox.textContent = "✅ Login successful!";
    messageBox.classList.remove("hidden");
    messageBox.style.color = "green";

    // Redirect to dashboard or show next step
    window.location.href = "/drophome/forms/unified-dashboard.html";
  } catch (error) {
    messageBox.textContent = `❌ ${error.message}`;
    messageBox.classList.remove("hidden");
    messageBox.style.color = "red";
  }
});
