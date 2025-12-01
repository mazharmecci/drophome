import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✨ Animate stock summary table
function animateStockTable() {
  const table = document.querySelector(".summary-table");
  if (table) {
    table.style.opacity = "0.3";
    setTimeout(() => {
      table.style.opacity = "1";
    }, 300);
  }
}

// 📊 Render stock summary rows (product-level only)
async function renderStockSummary(products, summaryBody) {
  for (const product of products) {
    const inboundTotal = await computeInbound(product);
    const outboundTotal = await computeOutbound(product);
    const available = inboundTotal - outboundTotal;

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr style="background-color:#007bff; color:white; font-weight:bold;">
        <td>${product}</td>
        <td>-</td>
        <td>${inboundTotal}</td>
        <td>${outboundTotal}</td>
        <td>${available >= 0 ? available : 0}</td>
      </tr>
    `);
  }
}

// 🔢 Compute inbound totals (product only)
async function computeInbound(product) {
  const snapshot = await getDocs(collection(db, "inbound"));
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName === product) {
      total += parseInt(data.quantityReceived || 0, 10);
    }
  });
  return total;
}

// 🔢 Compute outbound totals (product only)
async function computeOutbound(product) {
  const snapshot = await getDocs(collection(db, "outbound_orders"));
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName === product) {
      total += parseInt(data.quantity || 0, 10);
    }
  });
  return total;
}

// 📦 Load full stock summary
async function loadStockSummary() {
  const summaryBody = document.getElementById("summaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateStockTable();

  try {
    const snapshot = await getDocs(collection(db, "inbound"));
    const productSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) productSet.add(data.productName);
    });

    const sortedProducts = [...productSet].sort();
    await renderStockSummary(sortedProducts, summaryBody);
    console.log("✅ Stock summary loaded.");
  } catch (err) {
    console.error("❌ Error loading stock summary:", err);
    showToast("❌ Failed to load stock summary.");
  }
}

// 🔍 Load product filter
async function loadProductFilter() {
  const productFilter = document.getElementById("filterProduct");
  if (!productFilter) return;

  try {
    const snapshot = await getDocs(collection(db, "inbound"));
    const productSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) productSet.add(data.productName);
    });

    productFilter.innerHTML = `<option value="" disabled selected>Choose product name 📦</option>`;
    [...productSet].sort().forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productFilter.appendChild(opt);
    });

    console.log("✅ Product filter loaded.");
  } catch (err) {
    console.error("❌ Error loading product filter:", err);
    showToast("❌ Failed to load product options.");
  }
}

// 🧮 Apply product filter
async function applyProductFilter() {
  const productFilter = document.getElementById("filterProduct");
  const summaryBody = document.getElementById("summaryBody");
  if (!productFilter || !summaryBody) return;

  const selectedProduct = productFilter.value;

  summaryBody.innerHTML = "";
  animateStockTable();

  try {
    const snapshot = await getDocs(collection(db, "inbound"));
    const productSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) productSet.add(data.productName);
    });

    const filteredProducts = selectedProduct ? [selectedProduct] : [...productSet];
    await renderStockSummary(filteredProducts, summaryBody);
    console.log("✅ Filtered stock summary loaded.");
  } catch (err) {
    console.error("❌ Error applying product filter:", err);
    showToast("❌ Failed to apply product filter.");
  }
}

// 🔄 DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadStockSummary();
  await loadProductFilter();

  const productFilter = document.getElementById("filterProduct");
  const resetBtn = document.getElementById("resetFiltersBtn");

  if (productFilter) productFilter.addEventListener("change", applyProductFilter);
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      productFilter.selectedIndex = 0;
      loadStockSummary();
      showToast("🔄 Filter reset — full stock summary restored.");
    });
  }
});
