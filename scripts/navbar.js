// scripts/navbar.js
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburgerBtn || !navLinks) return;

  // Toggle menu open/close
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburgerBtn.classList.toggle("active");
    navLinks.classList.toggle("show");
    toggleOverlay(navLinks.classList.contains("show"));
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!navLinks.classList.contains("show")) return;
    if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      closeMenu();
    }
  });

  function closeMenu() {
    navLinks.classList.remove("show");
    hamburgerBtn.classList.remove("active");
    toggleOverlay(false);
  }

  function toggleOverlay(show) {
    let overlay = document.getElementById("navOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "navOverlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.4)";
      overlay.style.zIndex = "900";
      document.body.appendChild(overlay);

      overlay.addEventListener("click", () => {
        closeMenu();
      });
    }
    overlay.style.display = show ? "block" : "none";
  }
});
