document.addEventListener("DOMContentLoaded", () => {
  console.log("Navbar script loaded");

  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  console.log("hamburgerBtn:", hamburgerBtn);
  console.log("navLinks:", navLinks);

  if (!hamburgerBtn || !navLinks) {
    console.warn("Navbar elements not found — script exiting.");
    return;
  }

  const overlay = setupOverlay();

  // Toggle drawer
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle("show");
    hamburgerBtn.classList.toggle("active", isOpen);
    overlay.style.display = isOpen ? "block" : "none";
    console.log("Hamburger clicked — drawer", isOpen ? "opened" : "closed");
  });

  // Close drawer on nav link click
  navLinks.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", () => {
      console.log("Nav link clicked — closing drawer");
      closeDrawer();
    })
  );

  // Close drawer on outside click
  document.addEventListener("click", (e) => {
    if (!navLinks.classList.contains("show")) return;
    if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      console.log("Outside click detected — closing drawer");
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
    div.addEventListener("click", () => {
      console.log("Overlay clicked — closing drawer");
      closeDrawer();
    });
    document.body.appendChild(div);
    return div;
  }
});
