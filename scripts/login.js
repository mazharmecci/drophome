import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

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

    // Redirect handled by onAuthStateChanged
  } catch (error) {
    messageBox.textContent = `❌ ${error.message}`;
    messageBox.classList.remove("hidden");
    messageBox.style.color = "red";
  }
});

// 🔄 Auth state listener
onAuthStateChanged(auth, (user) => {
  const messageBox = document.getElementById("loginMessage");

  if (user) {
    // User is logged in
    console.log("✅ Logged in:", user.email);
    if (messageBox) {
      messageBox.textContent = `Welcome back, ${user.email}`;
      messageBox.classList.remove("hidden");
      messageBox.style.color = "green";
    }
    // Redirect to dashboard if not already there
    if (!window.location.pathname.includes("unified-dashboard.html")) {
      window.location.href = "/drophome/forms/unified-dashboard.html";
    }
  } else {
    // User is logged out
    console.log("❌ No user logged in");
    if (messageBox) {
      messageBox.textContent = "Please log in to continue.";
      messageBox.classList.remove("hidden");
      messageBox.style.color = "red";
    }
    // Redirect to login if not already there
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "/drophome/forms/login.html";
    }
  }
});
