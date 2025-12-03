document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  fetch("/drophome/navbar.html")
    .then(res => res.text())
    .then(html => {
      placeholder.innerHTML = html;

      const toggle = document.getElementById("nav-toggle");
      const links = document.getElementById("nav-links");
      const protectedLinks = document.getElementById("protected-links");
      const logoutSection = document.getElementById("logout-section");

      // 🔒 Show/hide protected links + logout section
      if (sessionStorage.getItem("drophome-auth")) {
        if (protectedLinks) protectedLinks.style.display = "block";
        if (logoutSection) logoutSection.style.display = "flex";
      } else {
        if (protectedLinks) protectedLinks.style.display = "none";
        if (logoutSection) logoutSection.style.display = "none";
      }

      if (toggle && links) {
        // Toggle menu on hamburger click
        toggle.addEventListener("click", () => {
          links.classList.toggle("active");
        });

        // Auto-collapse on link click
        const navItems = links.querySelectorAll("a");
        navItems.forEach(link => {
          link.addEventListener("click", () => {
            links.classList.remove("active");
          });
        });
      }
    })
    .catch(err => console.error("❌ Failed to load navbar:", err));
});
