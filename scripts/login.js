import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

// -----------------------------
// Firebase Configuration
// -----------------------------
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

// -----------------------------
// Utility Functions
// -----------------------------
function showMessage(text, color = "black") {
  const messageBox = document.getElementById("loginMessage");
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.classList.remove("hidden");
  messageBox.style.color = color;
}

function redirectTo(path) {
  if (!window.location.pathname.includes(path)) {
    window.location.href = `/drophome/forms/${path}`;
  }
}

// -----------------------------
// Login Form Handler
// -----------------------------
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
      // Redirect handled by auth listener
    } catch (error) {
      showMessage(`❌ ${error.message}`, "red");
    }
  });
}

// -----------------------------
// Auth State Listener
// -----------------------------
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Logged in:", user.email);
      showMessage(`Welcome back, ${user.email}`, "green");
      redirectTo("unified-dashboard.html");
    } else {
      console.log("❌ No user logged in");
      showMessage("Please log in to continue.", "red");
      redirectTo("login.html");
    }
  });
}

// -----------------------------
// Logout Button Handler
// -----------------------------
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("✅ User logged out");
      redirectTo("login.html");
    } catch (error) {
      console.error("❌ Logout failed:", error.message);
      showMessage(`❌ Logout failed: ${error.message}`, "red");
    }
  });
}

// -----------------------------
// Initialize Handlers
// -----------------------------
setupLoginForm();
setupAuthListener();
setupLogoutButton();
