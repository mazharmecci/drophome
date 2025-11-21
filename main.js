// src/services/main.js

// 🔍 Load meta.json for dashboard context
fetch('drophome/meta.json')
  .then(response => response.json())
  .then(data => {
    console.log('Meta loaded:', data);
  })
  .catch(error => {
    console.error('Error loading meta.json:', error);
  });

// 📥 Load HTML content into the center pane
export function loadContent(linkElement) {
  const path = linkElement.getAttribute("data-path");
  const container = document.getElementById("mainPane");

  if (!container) {
    console.error("❌ mainPane not found");
    return;
  }

  fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.text();
    })
    .then((html) => {
      container.innerHTML = html;
      if (window.logAudit) {
        window.logAudit("form_loaded", { form: path });
      }
    })
    .catch((err) => {
      container.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
      console.error("❌ Load error:", err);
    });
}
