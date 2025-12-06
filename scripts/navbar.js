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
    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const avatarTag = document.getElementById("user-avatar");
    const logoutBtn = document.getElementById("logoutBtn");

    // All protected links (class-based)
    const protectedLinks = document.querySelectorAll(".protected-link");

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
        // Always show logout section
        if (logoutSection) logoutSection.style.display = "flex";

        // Welcome message
        if (welcomeTag) {
          let name = user.displayName || user.email || "User";
          let shortName = name;
          if (shortName.includes("@")) shortName = shortName.split("@")[0];
          welcomeTag.textContent = `Welcome, ${shortName}`;
        }

        // Restrict nav links for specific user
        if (user.email === "ahmadmanj40@gmail.com") {
          protectedLinks.forEach(link => {
            const id = link.getAttribute("id");
            if (id === "orders-link" || id === "orderHistory-link") {
              link.style.display = "list-item"; // ✅ Only show Orders + Order History
            } else {
              link.style.display = "none"; // Hide all other links
            }
          });

          // ✅ Extra page-level guard
          const restrictedPages = [
            "/drophome/forms/shipping.html",
            "/drophome/forms/sales.html",
            "/drophome/forms/admin.html",
            "/drophome/forms/stock.html"
          ];
          if (restrictedPages.includes(window.location.pathname)) {
            window.location.href = "/drophome/forms/orders.html";
          }
        } else {
          // Default: show all protected links
          protectedLinks.forEach(link => link.style.display = "list-item");
        }

        // Logout button
        if (logoutBtn) {
          logoutBtn.addEventListener("click", async () => {
            try {
              await signOut(auth);
              sessionStorage.removeItem("drophome-auth");
              window.location.href = "/drophome/forms/login.html";
            } catch (err) {
              console.error("❌ Logout failed:", err);
              showToast("⚠️ Failed to log out. Please try again.");
            }
          });
        }
      } else {
        // Not logged in → redirect to login
        window.location.href = "/drophome/forms/login.html";
      }
    });
  } catch (err) {
    console.error("❌ Navbar injection failed:", err);
  }
});
