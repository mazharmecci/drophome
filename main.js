// main.js (root)

// 🔍 Load meta.json for dashboard context
async function loadMeta() {
  try {
    const response = await fetch("./meta.json");
    if (!response.ok) throw new Error(`Failed to load meta.json (${response.status})`);
    const data = await response.json();
    console.log("Meta loaded:", data);
  } catch (error) {
    console.error("Error loading meta.json:", error);
  }
}
loadMeta();

// 📥 Load HTML content into the center pane (SPA style)
async function loadContent(linkElement) {
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

  // Show lightweight loader while fetching
  container.innerHTML = '<p style="color:#666;">Loading…</p>';

  try {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Try to find a wrapper (e.g. inboundFormContent, outboundFormContent, stockFormContent)
    const wrapperId = path.includes("inbound") ? "inboundFormContent"
                   : path.includes("outbound") ? "outboundFormContent"
                   : path.includes("stock") ? "stockFormContent"
                   : null;

    const innerContent = (wrapperId && doc.getElementById(wrapperId)) || doc.body;

    container.innerHTML = innerContent.innerHTML;

    if (typeof window.logAudit === "function") {
      window.logAudit("form_loaded", { form: path });
    }
  } catch (error) {
    container.innerHTML = `<p style="color:red;">❌ ${error.message}</p>`;
    console.error("❌ Load error:", error);
  }
}

// 🌐 Expose globally for sidebar use
window.loadContent = loadContent;
