document.addEventListener("DOMContentLoaded", () => {
  console.log("Navbar script loaded");

  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");
  const overlay = document.getElementById("navOverlay");

  console.log("hamburgerBtn:", hamburgerBtn);
  console.log("navLinks:", navLinks);
  console.log("overlay:", overlay);

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
    if (!navLinks.classList.contains("active")) return;
    if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      console.log("Outside click detected — closing drawer");
      closeDrawer();
    }
  });

  // Close drawer on overlay click
  overlay.addEventListener("click", () => {
    console.log("Overlay clicked — closing drawer");
    closeDrawer();
  });

  function closeDrawer() {
    navLinks.classList.remove("active");
    hamburgerBtn.classList.remove("active");
    overlay.style.display = "none";
  }
});
