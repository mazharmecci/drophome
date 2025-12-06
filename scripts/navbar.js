document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    const res = await fetch("/drophome/navbar.html");
    const html = await res.text();
    placeholder.innerHTML = html;

    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const logoutBtn = document.getElementById("logoutBtn");
    const protectedLinks = document.querySelectorAll(".protected-link");

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

    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (logoutSection) logoutSection.style.display = "flex";

        if (welcomeTag) {
          let name = user.displayName || user.email || "User";
          let shortName = name.includes("@") ? name.split("@")[0] : name;
          welcomeTag.textContent = `Welcome, ${shortName}`;
        }

        if (user.email === "ahmadmanj40@gmail.com") {
          protectedLinks.forEach(link => {
            const id = link.getAttribute("id");
            if (id === "orders-link" || id === "orderHistory-link") {
              link.style.display = "list-item";
            } else {
              link.style.display = "none";
            }
          });

          // ✅ Page-level guard for restricted user
          const restrictedPages = [
            "/drophome/forms/shipping.html",
            "/drophome/forms/sales.html",            
            "/drophome/revenue.html",
            "/drophome/dashboard.html"
          ];
          if (restrictedPages.includes(window.location.pathname)) {
            window.location.href = "/drophome/forms/orders.html";
            import("./popupHandler.js").then(({ showToast }) => {
              showToast("⚠️ You don’t have access to this page. Redirected to Orders.");
            });
          }
        } else {
          protectedLinks.forEach(link => link.style.display = "list-item");
        }

        if (logoutBtn) {
          logoutBtn.addEventListener("click", async () => {
            try {
              await signOut(auth);
              sessionStorage.removeItem("drophome-auth");
              window.location.href = "/drophome/forms/login.html";
            } catch (err) {
              console.error("❌ Logout failed:", err);
              import("./popupHandler.js").then(({ showToast }) => {
                showToast("⚠️ Failed to log out. Please try again.");
              });
            }
          });
        }
      } else {
        window.location.href = "/drophome/forms/login.html";
      }
    });
  } catch (err) {
    console.error("❌ Navbar injection failed:", err);
  }
});
