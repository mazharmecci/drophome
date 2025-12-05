document.addEventListener("DOMContentLoaded", async () => {
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
    const changePwdBtn = document.getElementById("changePwdBtn"); // 🔑 new button

    const protectedLinks = document.querySelectorAll(".protected-link");

    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getAuth, signOut, onAuthStateChanged, updatePassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

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

        protectedLinks.forEach(link => {
          const href = link.getAttribute("href");
          if (role === "limited" && !allowedPages.includes(href)) {
            link.style.display = "none";
          } else {
            link.style.display = "list-item";
          }
        });

        if (logoutSection) logoutSection.style.display = "flex";

        if (welcomeTag) {
          let name = user.displayName || user.email || "User";
          let shortName = name.includes("@") ? name.split("@")[0] : name;
          welcomeTag.textContent = `Welcome, ${shortName}`;
          welcomeTag.style.display = "inline-block";

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

    // 🔑 Change Password handler
    if (changePwdBtn) {
      changePwdBtn.addEventListener("click", async () => {
        const newPwd = prompt("Enter your new password:");
        if (!newPwd) return;

        try {
          const user = auth.currentUser;
          await updatePassword(user, newPwd);
          alert("✅ Password updated successfully. Please use the new password next time you log in.");
        } catch (err) {
          console.error("❌ Password update failed:", err.message);
          alert("Password update failed. You may need to re-login before changing your password.");
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
