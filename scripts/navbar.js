document.addEventListener("DOMContentLoaded", async () => {
  // Skip navbar injection on login page
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    const res = await fetch("/drophome/navbar.html");
    const html = await res.text();
    placeholder.innerHTML = html;

    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    const protectedLinks = document.getElementById("protected-links");
    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const logoutBtn = document.getElementById("logoutBtn");

    // Load Firebase once
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

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

    // 🔒 Show/hide protected links + logout section
    if (sessionStorage.getItem("drophome-auth")) {
      if (protectedLinks) protectedLinks.style.display = "contents";
      if (logoutSection) logoutSection.style.display = "flex";

      const user = auth.currentUser;
      if (user && welcomeTag) {
        const name = user.displayName || user.email || "Welcome back";
        welcomeTag.textContent = `Welcome, ${name}`;
        welcomeTag.style.display = "inline-block";
      }

      // 🚪 Attach logout handler
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await signOut(auth);
            sessionStorage.removeItem("drophome-auth");
            window.location.href = "/drophome/forms/login.html";
          } catch (err) {
            console.error("❌ Logout failed:", err.message);
          }
        });
      }
    } else {
      if (protectedLinks) protectedLinks.style.display = "none";
      if (logoutSection) logoutSection.style.display = "none";
    }

    // 🍔 Mobile toggle
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        links.classList.toggle("active");
      });

      const navItems = links.querySelectorAll("a");
      navItems.forEach(link => {
        link.addEventListener("click", () => {
          links.classList.remove("active");
        });
      });
    }
  } catch (err) {
    console.error("❌ Failed to load navbar or Firebase:", err.message);
  }
});
