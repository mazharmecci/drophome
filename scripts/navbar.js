document.addEventListener("DOMContentLoaded", () => {
const hamburger = document.getElementById("hamburgerBtn");
const navLinks = document.getElementById("navLinks");
const overlay = document.getElementById("navOverlay");

if (!hamburger || !navLinks || !overlay) {
console.warn("Navbar elements not found.");
return;
}

const toggleMenu = () => {
hamburger.classList.toggle("active");
navLinks.classList.toggle("show");
overlay.classList.toggle("show");
};

// Open / close on hamburger click
hamburger.addEventListener("click", toggleMenu);

// Close when clicking on overlay
overlay.addEventListener("click", toggleMenu);
});
