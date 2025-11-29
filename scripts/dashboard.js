import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

const productIcons = {
  Ballpen: "🖊️",
  umbrella: "🌂",
  Laptop: "💻",
  "Music system": "🎵",
  default: "📦"
};

// 🔢 Compute inbound totals
async function computeInbound(product, location) {
  const q = query(
    collection(db, "inbound"),
    where("productName", "==", product),
    where("storageLocation", "==", location)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(doc => {
    total += parseInt(doc.data().quantityReceived || 0);
  });
  return total;
}

// 🔢 Compute outbound totals
async function computeOutbound(product, location) {
  const q = query(
    collection(db, "outbound_orders"),
    where("productName", "==", product)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.storageLocation === location || !data.storageLocation) {
      total += parseInt(data.quantity || 0);
    }
  });
  return total;
}

// ✨ Animate table refresh
function animateTable() {
  const table = document.querySelector(".summary-table");
  if (table) {
    table.style.opacity = "0.3";
    setTimeout(() => {
      table.style.opacity = "1";
    }, 300);
  }
}

// 📊 Render summary rows
async function renderSummary(products, locations, summaryBody) {
  for (const product of products) {
    let inboundSubtotal = 0;
    let outboundSubtotal = 0;
    const icon = productIcons[product] || productIcons.default;

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr style="background-color:#f0f0f0; font-weight:bold;">
        <td colspan="5">${icon} ${product}</td>
      </tr>
    `);

    for (const location of locations) {
      const inboundTotal = await computeInbound(product, location);
      const outboundTotal = await computeOutbound(product, location);
      const available = inboundTotal - outboundTotal;

      inboundSubtotal += inboundTotal;
      outboundSubtotal += outboundTotal;

      summaryBody.insertAdjacentHTML("beforeend", `
        <tr>
          <td></td>
          <td>${location}</td>
          <td>${inboundTotal}</td>
          <td>${outboundTotal}</td>
          <td>${available >= 0 ? available : 0}</td>
        </tr>
      `);
    }

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr style="background-color:#ffe6e6; font-weight:bold;">
        <td></td>
        <td>➤ Subtotal</td>
        <td>${inboundSubtotal}</td>
        <td>${outboundSubtotal}</td>
        <td>${inboundSubtotal - outboundSubtotal}</td>
      </tr>
    `);
  }
}

// 📦 Load full summary
async function loadSummary() {
  const summaryBody = document.getElementById("summaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateTable();

  try {
    const snapshot = await getDoc(docRef);
    const { products, locations } = snapshot.data();
    const sortedProducts = [...products].sort();
    await renderSummary(sortedProducts, locations, summaryBody);
    console.log("✅ Full summary loaded.");
  } catch (err) {
    console.error("❌ Error loading summary:", err);
    showToast("❌ Failed to load summary.");
  }
}

// 🔍 Load dropdown filters
async function loadFilters() {
  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");

  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    const { products, locations } = snapshot.data();

    productFilter.innerHTML = `<option value="" disabled selected>Choose your product 📦</option>`;
    locationFilter.innerHTML = `<option value="" disabled selected>Choose your location 📍</option>`;

    products.forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productFilter.appendChild(opt);
    });

    locations.forEach(location => {
      const opt = document.createElement("option");
      opt.value = location;
      opt.textContent = location;
      locationFilter.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Error loading filters:", err);
  }
}

// 🧮 Apply filters
async function applyFilters() {
  const product = document.getElementById("filterProduct").value;
  const location = document.getElementById("filterLocation").value;
  const summaryBody = document.getElementById("summaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateTable();

  try {
    const snapshot = await getDoc(docRef);
    const { products, locations } = snapshot.data();

    const filteredProducts = product ? [product] : products;
    const filteredLocations = location ? [location] : locations;

    await renderSummary(filteredProducts, filteredLocations, summaryBody);
    console.log("✅ Filtered summary loaded.");
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showToast("❌ Failed to apply filters.");
  }
}

// 🚀 Init
document.addEventListener("DOMContentLoaded", async () => {
  await loadSummary();
  await loadFilters();

  document.getElementById("filterProduct").addEventListener("change", applyFilters);
  document.getElementById("filterLocation").addEventListener("change", applyFilters);

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterProduct").selectedIndex = 0;
    document.getElementById("filterLocation").selectedIndex = 0;
    loadSummary();
    showToast("🔄 Filters reset — full summary restored.");
  });
});
