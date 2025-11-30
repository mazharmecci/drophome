// scripts/navbar.js
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", () => {
      // Toggle active state for hamburger animation
      hamburgerBtn.classList.toggle("active");

      // Toggle visibility of nav links
      navLinks.classList.toggle("show");
    });
  }

  // Optional: close menu when a link is clicked (mobile UX polish)
  document.querySelectorAll("#navLinks a").forEach(link => {
    link.addEventListener("click", () => {
      if (navLinks.classList.contains("show")) {
        navLinks.classList.remove("show");
        hamburgerBtn.classList.remove("active");
      }
    });
  });
});
