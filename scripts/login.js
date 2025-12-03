<script type="module">
  // Import Firebase modules from CDN
  import { initializeApp } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    window.location.href = `/drophome/forms/${path}`;
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
        sessionStorage.setItem("drophome-auth", "true");
        showMessage("✅ Login successful!", "green");
        redirectTo("unified-dashboard.html");
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
      if (!user) {
        sessionStorage.removeItem("drophome-auth");
        if (!window.location.pathname.includes("login.html")) {
          window.location.href = "/drophome/forms/login.html";
        }
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
        sessionStorage.removeItem("drophome-auth");
        window.location.href = "/drophome/forms/login.html";
      } catch (error) {
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
</script>
