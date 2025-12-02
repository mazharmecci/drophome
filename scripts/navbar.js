document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  const isInForms = window.location.pathname.includes("/forms/");
  const navbarPath = isInForms
    ? "https://mazharmecci.github.io/drophome/navbar.html"
    : "navbar.html";

  fetch(navbarPath)
    .then(res => {
      if (!res.ok) throw new Error("Navbar load failed");
      return res.text();
    })
    .then(html => {
      placeholder.innerHTML = html;

      // Now safely query elements AFTER injection
      const hamburgerBtn = document.getElementById("hamburgerBtn");
      const navLinks = document.getElementById("navLinks");
      const overlay = document.getElementById("navOverlay");

      if (!hamburgerBtn || !navLinks || !overlay) {
        console.warn("Navbar elements not found — script exiting.");
        return;
      }

      // Toggle drawer
      hamburgerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle("active");
        hamburgerBtn.classList.toggle("active", isOpen);
        overlay.style.display = isOpen ? "block" : "none";
      });

      // Close on link click
      navLinks.querySelectorAll("a").forEach(link =>
        link.addEventListener("click", () => closeDrawer())
      );

      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!navLinks.classList.contains("active")) return;
        if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          closeDrawer();
        }
      });

      // Close on overlay click
      overlay.addEventListener("click", () => closeDrawer());

      function closeDrawer() {
        navLinks.classList.remove("active");
        hamburgerBtn.classList.remove("active");
        overlay.style.display = "none";
      }

      console.log("✅ Navbar script loaded successfully.");
    })
    .catch(err => console.error("Navbar load error:", err));
});
