// main.js (root)

// 🔍 Load meta.json for dashboard context
fetch('./meta.json')
  .then(response => response.json())
  .then(data => {
    console.log('Meta loaded:', data);
  })
  .catch(error => {
    console.error('Error loading meta.json:', error);
  });

// 📥 Load HTML content into the center pane (SPA style)

function loadContent(linkElement) {
  const path = linkElement?.getAttribute("data-path");
  const container = document.getElementById("mainContent");

  if (!path) {
    console.warn("⚠️ No data-path found on clicked element.");
    return;
  }

  if (!container) {
    console.error("❌ Target container #mainContent not found.");
    return;
  }

  fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path} (${response.status})`);
      }
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const innerContent = doc.getElementById("inboundFormContent") || doc.body;

      container.innerHTML = innerContent.innerHTML;

      if (typeof window.logAudit === "function") {
        window.logAudit("form_loaded", { form: path });
      }
    })
    .catch((error) => {
      container.innerHTML = `<p style="color:red;">❌ ${error.message}</p>`;
      console.error("❌ Load error:", error);
    });
}

// 🌐 Expose globally for sidebar use
window.loadContent = loadContent;
