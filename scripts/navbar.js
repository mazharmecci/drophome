// scripts/navbar.js
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (hamburgerBtn && navLinks) {
    // Toggle menu open/close
    hamburgerBtn.addEventListener("click", () => {
      hamburgerBtn.classList.toggle("active");
      navLinks.classList.toggle("show");

      // Optional: add overlay when menu is open
      toggleOverlay(navLinks.classList.contains("show"));
    });
  }

  // Close menu when a link is clicked (mobile UX polish)
  document.querySelectorAll("#navLinks a").forEach(link => {
    link.addEventListener("click", () => {
      if (navLinks.classList.contains("show")) {
        navLinks.classList.remove("show");
        hamburgerBtn.classList.remove("active");
        toggleOverlay(false);
      }
    });
  });

  // Optional: close menu if user clicks outside
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("show") &&
        !navLinks.contains(e.target) &&
        !hamburgerBtn.contains(e.target)) {
      navLinks.classList.remove("show");
      hamburgerBtn.classList.remove("active");
      toggleOverlay(false);
    }
  });

  // Overlay helper
  function toggleOverlay(show) {
    let overlay = document.getElementById("navOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "navOverlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.4)";
      overlay.style.zIndex = "999";
      overlay.style.transition = "opacity 0.3s ease";
      document.body.appendChild(overlay);
    }
    overlay.style.display = show ? "block" : "none";
  }
});
