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

    // ✅ Modular function to filter links
    function filterNavLinks(role, allowedPages) {
      const protectedLinks = document.querySelectorAll(".protected-link");

      console.log("🔍 Role:", role);
      console.log("🔍 Allowed Pages:", allowedPages);

      protectedLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (!href) {
          console.warn("⚠️ Skipping link without href:", link);
          return;
        }

        const normalizedHref = href.replace(/^(\.\.\/)?/, ""); // strip ../ if present
        console.log("🔗 Checking link:", href, "→ normalized:", normalizedHref);

        if (role === "limited" && !allowedPages.includes(normalizedHref)) {
          console.log("❌ Hiding link:", normalizedHref);
          link.style.display = "none";
        } else {
          console.log("✅ Showing link:", normalizedHref);
          link.style.display = "list-item";
        }
      });
    }

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
        const role = sessionStorage.getItem("userRole");
        const allowedPages = JSON.parse(sessionStorage.getItem("allowedPages") || "[]");

        // ✅ Apply filtering with logs
        filterNavLinks(role, allowedPages);

        if (logoutSection) logoutSection.style.display = "flex";

        if (welcomeTag) {
          let name = user.displayName || user.email || "User";
          let shortName = name.includes("@") ? name.split("@")[0] : name;
          welcomeTag.textContent = `Welcome, ${shortName}`;
          welcomeTag.style.display = "inline-block";

          // Generate initials
          let initials = shortName
            .split(/[\s._-]+/)
            .map(part => part[0].toUpperCase())
            .join("")
            .slice(0, 2);

          if (avatarTag) {
            avatarTag.textContent = initials;
            avatarTag.style.display = "inline-flex";
          }
        }
      } else {
        // Hide protected links if not logged in
        const protectedLinks = document.querySelectorAll(".protected-link");
        protectedLinks.forEach(link => link.style.display = "none");

        if (logoutSection) logoutSection.style.display = "none";
        if (welcomeTag) welcomeTag.style.display = "none";
        if (avatarTag) avatarTag.style.display = "none";
      }
    });

    // 🚪 Logout handler
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
