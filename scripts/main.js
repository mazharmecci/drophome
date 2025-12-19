document.addEventListener("DOMContentLoaded", () => {
  // Existing meta.json logic
  fetch("/drophome/meta.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load meta.json: ${response.status}`);
      }
      return response.json();
    })
    .then(meta => {
      console.log("📦 Drophome Metadata Loaded:");
      console.log(`Name: ${meta.name}`);
      console.log(`Version: ${meta.version}`);

      const footer = document.querySelector("footer");
      if (footer && meta.version) {
        const versionTag = document.createElement("span");
        versionTag.textContent = `Version ${meta.version}`;
        versionTag.className = "meta-version";
        footer.appendChild(versionTag);
      }
    })
    .catch(error => {
      console.warn("⚠️ meta.json not found or invalid:", error.message);
    });

  // 🔻 Navbar hamburger toggle (runs after navbar.html is in the DOM)
  const navToggle = document.getElementById("nav-toggle");
  const navLinks  = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }
});
