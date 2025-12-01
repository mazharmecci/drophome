document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburgerBtn || !navLinks) return;

  const overlay = createOverlay();

  // Toggle menu open/close
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle("show");
    hamburgerBtn.classList.toggle("active", isOpen);
    toggleOverlay(isOpen);
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", closeMenu)
  );

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
    overlay.style.display = show ? "block" : "none";
  }

  function createOverlay() {
    let existing = document.getElementById("navOverlay");
    if (existing) return existing;

    const div = document.createElement("div");
    div.id = "navOverlay";
    div.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 900;
      display: none;
    `;
    div.addEventListener("click", closeMenu);
    document.body.appendChild(div);
    return div;
  }
});
