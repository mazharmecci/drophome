document.addEventListener("DOMContentLoaded", () => {
  console.log("Navbar loader started");

  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) {
    console.warn("No #navbar-placeholder found in DOM");
    return;
  }

  // Fetch and inject navbar HTML
  fetch("/drophome/navbar.html")
    .then(res => {
      if (!res.ok) throw new Error("Navbar load failed");
      return res.text();
    })
    .then(html => {
      placeholder.innerHTML = html;
      console.log("Navbar HTML injected");

      // Now attach behavior
      setupNavbar();
    })
    .catch(err => console.error("Navbar injection error:", err));
});

function setupNavbar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  console.log("hamburgerBtn:", hamburgerBtn);
  console.log("navLinks:", navLinks);

  if (!hamburgerBtn || !navLinks) {
    console.warn("Navbar elements not found — skipping setup");
    return;
  }

  const overlay = setupOverlay();

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
      closeDrawer(hamburgerBtn, navLinks, overlay);
    })
  );

  // Close drawer on outside click
  document.addEventListener("click", (e) => {
    if (!navLinks.classList.contains("active")) return;
    if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      console.log("Outside click detected — closing drawer");
      closeDrawer(hamburgerBtn, navLinks, overlay);
    }
  });
}

function closeDrawer(hamburgerBtn, navLinks, overlay) {
  navLinks.classList.remove("active");
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
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const navLinks = document.getElementById("navLinks");
    if (hamburgerBtn && navLinks) {
      closeDrawer(hamburgerBtn, navLinks, div);
    }
  });
  document.body.appendChild(div);
  return div;
}
