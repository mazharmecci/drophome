document.addEventListener("DOMContentLoaded", async () => {
  // Skip navbar injection on login page
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    const res = await fetch("/navbar.html");
    const html = await res.text();
    placeholder.innerHTML = html;

    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const avatarTag = document.getElementById("user-avatar");
    const logoutBtn = document.getElementById("logoutBtn");

    // All protected links
    const protectedLinks = document.querySelectorAll(".protected-link");

    // Firebase imports
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
        // Show logout section
        if (logoutSection) logoutSection.style.display = "flex";

        // Show avatar + welcome message
        if (welcomeTag && avatarTag) {
          const email = user.email || "User";
          const initials = email.substring(0, 2).toUpperCase(); // first two letters
          avatarTag.textContent = initials;
          avatarTag.style.display = "inline-flex";
          welcomeTag.textContent = email;
          welcomeTag.style.display = "inline";
        }

        // Restrict Ahmad's nav links
        if (user.email === "ahmadmanj40@gmail.com") {
          protectedLinks.forEach(link => {
            const anchor = link.querySelector("a");
            const href = anchor ? anchor.getAttribute("href") : "";

            if (href.includes("orders.html") || href.includes("order-history.html")) {
              link.style.display = "list-item"; // ✅ Only show Orders + Order History
            } else {
              link.style.display = "none"; // Hide all other links
            }
          });

          // ✅ Extra page-level guard
          const restrictedPages = [
            "/drophome/forms/shipping.html",
            "/drophome/forms/sales.html",
            "/drophome/forms/stock.html",
            "/drophome/revenue.html",
            "/drophome/dashboard.html"
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
