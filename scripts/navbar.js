document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  console.log("hamburgerBtn:", hamburgerBtn);
  console.log("navLinks:", navLinks);

  if (!hamburgerBtn || !navLinks) {
    console.warn("Navbar elements not found — script exiting.");
    return;
  }

  // safe to attach listeners now
  hamburgerBtn.addEventListener("click", () => {
    console.log("Hamburger clicked");
  });
});
