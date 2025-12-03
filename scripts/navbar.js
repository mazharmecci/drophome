document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  fetch("/drophome/navbar.html")
    .then(res => res.text())
    .then(html => {
      placeholder.innerHTML = html;

      const toggle = document.getElementById("nav-toggle");
      const links = document.getElementById("nav-links");

      // 🔒 Hide protected links by default
      const protectedLinks = document.getElementById("protected-links");
      if (protectedLinks) {
        if (sessionStorage.getItem("drophome-auth")) {
          protectedLinks.style.display = "block";
        } else {
          protectedLinks.style.display = "none";
        }
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
