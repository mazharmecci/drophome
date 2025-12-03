import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

// Firebase config for drophome
const firebaseConfig = {
  apiKey: "AIzaSyDqFJ85euyPb4QV863AmBF9zHv34WIdmrg",
  authDomain: "drophome-1cb76.firebaseapp.com",
  projectId: "drophome-1cb76",
  storageBucket: "drophome-1cb76.appspot.com",
  messagingSenderId: "268666785164",
  appId: "1:268666785164:web:6b02f3242b9e21fad25aa9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Utility: Show message in loginMessage box
 */
function showMessage(text, color = "black") {
  const messageBox = document.getElementById("loginMessage");
  if (messageBox) {
    messageBox.textContent = text;
    messageBox.classList.remove("hidden");
    messageBox.style.color = color;
  }
}

/**
 * Handle login form submission
 */
function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("✅ Login successful!", "green");
      // Redirect handled by onAuthStateChanged
    } catch (error) {
      showMessage(`❌ ${error.message}`, "red");
    }
  });
}

/**
 * Listen for auth state changes
 */
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Logged in:", user.email);
      showMessage(`Welcome back, ${user.email}`, "green");

      // Redirect to dashboard if not already there
      if (!window.location.pathname.includes("unified-dashboard.html")) {
        window.location.href = "/drophome/forms/unified-dashboard.html";
      }
    } else {
      console.log("❌ No user logged in");
      showMessage("Please log in to continue.", "red");

      // Redirect to login if not already there
      if (!window.location.pathname.includes("login.html")) {
        window.location.href = "/drophome/forms/login.html";
      }
    }
  });
}

/**
 * Setup logout button
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("✅ User logged out");
      window.location.href = "/drophome/forms/login.html";
    } catch (error) {
      console.error("❌ Logout failed:", error.message);
      showMessage(`❌ Logout failed: ${error.message}`, "red");
    }
  });
}

// Initialize all handlers
setupLoginForm();
setupAuthListener();
setupLogoutButton();
