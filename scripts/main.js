// scripts/main.js
document.addEventListener("DOMContentLoaded", () => {
  const role = sessionStorage.getItem("userRole");
  const allowedPages = JSON.parse(sessionStorage.getItem("allowedPages") || "[]");
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  if (role === "limited" && !allowedPages.includes(currentFile)) {
    alert("Access denied: You are not authorized to view this page.");
    window.location.href = "index.html";
    return;
  }

  // Optional meta.json versioning
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
});
