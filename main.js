// main.js (root)

// 🔍 Utility: Safe fetch JSON
async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
  return response.json();
}

// 🔍 Utility: Safe fetch HTML
async function fetchHTML(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
  return response.text();
}

// 🔍 Load meta.json for dashboard context
async function loadMeta() {
  try {
    const data = await fetchJSON("./meta.json");
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
    const html = await fetchHTML(path);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Map wrapper IDs by path keywords
    const WRAPPER_MAP = {
      inbound: "inboundFormContent",
      outbound: "outboundFormContent",
      stock: "stockFormContent",
    };

    // Detect wrapper ID based on path
    const wrapperId = Object.keys(WRAPPER_MAP).find(key => path.includes(key));
    const innerContent = (wrapperId && doc.getElementById(WRAPPER_MAP[wrapperId])) || doc.body;

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
