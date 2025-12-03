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
    const { getAuth, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

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

    // 🔒 Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (protectedLinks) protectedLinks.style.display = "contents";
        if (logoutSection) logoutSection.style.display = "flex";

        if (welcomeTag) {
          // Use displayName if available, else username part of email
          let name = user.displayName || user.email;
          if (name && name.includes("@")) {
            name = name.split("@")[0]; // take only part before @
          }
          welcomeTag.textContent = `Welcome, ${name}`;
          welcomeTag.style.display = "inline-block";
        }
      } else {
        if (protectedLinks) protectedLinks.style.display = "none";
        if (logoutSection) logoutSection.style.display = "none";
      }
    });

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
