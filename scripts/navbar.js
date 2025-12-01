document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburgerBtn || !navLinks) return;

  const overlay = setupOverlay();

  // Toggle drawer
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle("show");
    hamburgerBtn.classList.toggle("active", isOpen);
    overlay.style.display = isOpen ? "block" : "none";
  });

  // Close drawer on nav link click
  navLinks.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", closeDrawer)
  );

  // Close drawer on outside click
  document.addEventListener("click", (e) => {
    if (!navLinks.classList.contains("show")) return;
    if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      closeDrawer();
    }
  });

  function closeDrawer() {
    navLinks.classList.remove("show");
    hamburgerBtn.classList.remove("active");
    overlay.style.display = "none";
  }

  function setupOverlay() {
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
      transition: opacity 0.3s ease-in-out;
    `;
    div.addEventListener("click", closeDrawer);
    document.body.appendChild(div);
    return div;
  }
});
