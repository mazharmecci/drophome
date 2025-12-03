document.addEventListener("DOMContentLoaded", () => {
  // Load metadata from /drophome/meta.json
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

      // Optional: inject version into footer or header
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
