document.addEventListener("DOMContentLoaded", async () => {
  // Skip navbar injection on login page
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  fetch("/drophome/navbar.html")
    .then(res => res.text())
    .then(async html => {
      placeholder.innerHTML = html;

      const toggle = document.getElementById("nav-toggle");
      const links = document.getElementById("nav-links");
      const protectedLinks = document.getElementById("protected-links");
      const logoutSection = document.getElementById("logout-section");
      const welcomeTag = document.getElementById("welcome-message");

      // 🔒 Show/hide protected links + logout section
      if (sessionStorage.getItem("drophome-auth")) {
        if (protectedLinks) protectedLinks.style.display = "block";
        if (logoutSection) logoutSection.style.display = "flex";

        // Load Firebase auth and show welcome message
        try {
          const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
          const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

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

          const user = auth.currentUser;
          if (user && welcomeTag) {
            welcomeTag.textContent = `Welcome, ${user.email}`;
            welcomeTag.style.display = "inline-block";
          }
        } catch (err) {
          console.warn("⚠️ Failed to load Firebase or user info:", err.message);
        }
      } else {
        if (protectedLinks) protectedLinks.style.display = "none";
        if (logoutSection) logoutSection.style.display = "none";
      }

      if (toggle && links) {
        // Toggle menu on hamburger click
        toggle.addEventListener("click", () => {
          links.classList.toggle("active");
        });

        // Auto-collapse on link click
        const navItems = links.querySelectorAll("a");
        navItems.forEach(link => {
          link.addEventListener("click", () => {
            links.classList.remove("active");
          });
        });
      }
    })
    .catch(err => console.error("❌ Failed to load navbar:", err));
});
