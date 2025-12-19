// ------------------------------
// Navbar Injection + Auth Control
// ------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Skip navbar injection on login page
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    // Reserve space + hide until ready
    placeholder.style.minHeight = "60px"; // adjust to your navbar height
    placeholder.style.opacity = "0";
    placeholder.style.transition = "opacity 0.3s ease";

    // ✅ Root-relative fetch
    const res = await fetch("/navbar.html");
    const html = await res.text();
    placeholder.innerHTML = html;

    // Smooth reveal
    requestAnimationFrame(() => {
      placeholder.style.opacity = "1";
    });

    // Grab elements
    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const avatarTag = document.getElementById("user-avatar");
    const logoutBtn = document.getElementById("logoutBtn");
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
        logoutSection?.classList.add("active");

        // Show avatar + welcome
        if (welcomeTag && avatarTag) {
          const email = user.email || "User";
          const initials = email.substring(0, 2).toUpperCase();
          avatarTag.textContent = initials;
          avatarTag.style.display = "inline-flex";
          welcomeTag.textContent = email;
          welcomeTag.style.display = "inline";
        }

        // Restrict Ahmad’s nav links
        if (user.email === "ahmadmanj40@gmail.com") {
          protectedLinks.forEach(link => {
            const href = link.querySelector("a")?.getAttribute("href") || "";
            if (href.includes("inbound.html") || href.includes("stock.html")) {
              link.style.display = "list-item";
            } else {
              link.style.display = "none";
            }
          });

          const restrictedPages = [
            "/forms/outbound.html",
            "/forms/sales.html",
            "/forms/stock.html",
            "/revenue.html"            
          ];
          if (restrictedPages.includes(window.location.pathname)) {
            window.location.href = "/forms/inbound.html";
          }
        } else {
          protectedLinks.forEach(link => link.style.display = "list-item");
        }

        // Bind logout button safely
        if (logoutBtn && !logoutBtn.dataset.bound) {
          logoutBtn.dataset.bound = "true";
          logoutBtn.addEventListener("click", async () => {
            try {
              await signOut(auth);
              sessionStorage.removeItem("drophome-auth");
              window.location.href = "/forms/login.html";
            } catch (err) {
              console.error("❌ Logout failed:", err);
            }
          });
        }
      } else {
        window.location.href = "/forms/login.html";
      }
    });
  } catch (err) {
    console.error("❌ Navbar injection failed:", err);
  }
});
