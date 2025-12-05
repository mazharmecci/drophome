// scripts/navbar.js
document.addEventListener("DOMContentLoaded", async () => {
  // Skip navbar on login page
  if (window.location.pathname.includes("login.html")) return;

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    // Work both on root and /forms/
    const isInForms = window.location.pathname.includes("/forms/");
    const navbarPath = isInForms
      ? "https://mazharmecci.github.io/drophome/navbar.html"
      : "navbar.html";

    const res = await fetch(navbarPath);
    if (!res.ok) throw new Error("Navbar load failed");
    const html = await res.text();
    placeholder.innerHTML = html;

    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    const logoutSection = document.getElementById("logout-section");
    const welcomeTag = document.getElementById("welcome-message");
    const avatarTag = document.getElementById("user-avatar");
    const logoutBtn = document.getElementById("logoutBtn");
    const overlay = document.getElementById("navOverlay");

    function filterNavLinks(role, allowedPages) {
      const items = document.querySelectorAll(".protected-link");

      console.log("🔍 Role:", role);
      console.log("🔍 Allowed Pages:", allowedPages);

      items.forEach(item => {
        const a = item.querySelector("a");
        if (!a) {
          console.warn("⚠️ Skipping item without <a>:", item);
          return;
        }

        const href = a.getAttribute("href");
        if (!href) {
          console.warn("⚠️ Skipping link without href:", a);
          return;
        }

        const normalized = href.split("/").pop().replace(/^(\.\.\/)?/, "");
        console.log("🔗 Checking:", href, "→", normalized);

        if (role === "limited" && !allowedPages.includes(normalized)) {
          console.log("❌ Hiding link:", normalized);
          item.style.display = "none";
        } else {
          console.log("✅ Showing link:", normalized);
          item.style.display = "list-item";
        }
      });
    }

    // Firebase auth for navbar avatar/welcome + role-based UI
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
        const role = sessionStorage.getItem("userRole");
        const allowedPages = JSON.parse(sessionStorage.getItem("allowedPages") || "[]");

        filterNavLinks(role, allowedPages);

        if (logoutSection) logoutSection.style.display = "flex";

        if (welcomeTag) {
          let name = user.displayName || user.email || "User";
          let shortName = name.includes("@") ? name.split("@")[0] : name;
          welcomeTag.textContent = `Welcome, ${shortName}`;
          welcomeTag.style.display = "inline-block";

          let initials = shortName
            .split(/[\s._-]+/)
            .map(p => p[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2);

          if (avatarTag) {
            avatarTag.textContent = initials;
            avatarTag.style.display = "inline-flex";
          }
        }
      } else {
        // Not logged in: hide all protected links
        document.querySelectorAll(".protected-link").forEach(li => {
          li.style.display = "none";
        });
        if (logoutSection) logoutSection.style.display = "none";
        if (welcomeTag) welcomeTag.style.display = "none";
        if (avatarTag) avatarTag.style.display = "none";
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          sessionStorage.clear();
          window.location.href = "/drophome/forms/login.html";
        } catch (err) {
          console.error("❌ Logout failed:", err.message);
        }
      });
    }

    // Mobile drawer
    if (toggle && links && overlay) {
      function closeDrawer() {
        links.classList.remove("active");
        toggle.classList.remove("active");
        overlay.style.display = "none";
      }

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = links.classList.toggle("active");
        toggle.classList.toggle("active", open);
        overlay.style.display = open ? "block" : "none";
      });

      links.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", () => closeDrawer());
      });

      document.addEventListener("click", (e) => {
        if (!links.classList.contains("active")) return;
        if (!links.contains(e.target) && !toggle.contains(e.target)) {
          closeDrawer();
        }
      });

      overlay.addEventListener("click", () => closeDrawer());
    }
  } catch (err) {
    console.error("❌ Failed to load navbar or Firebase:", err.message);
  }
});
