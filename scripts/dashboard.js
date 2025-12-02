import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✨ Animate sales summary table
function animateSalesTable() {
  const table = document.querySelector(".summary-table");
  if (table) {
    table.style.opacity = "0.3";
    setTimeout(() => {
      table.style.opacity = "1";
    }, 300);
  }
}

// 📊 Render sales summary rows from unified document
async function renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct) {
  for (const entry of entries) {
    const {
      AccountName = "-",
      Date = "",
      ProductName = "-",
      Quantity = 0,
      Status = "-"
    } = entry;

    // Apply filters
    if (selectedProduct && ProductName !== selectedProduct) continue;
    if (fromDate && Date < fromDate) continue;
    if (toDate && Date > toDate) continue;

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr class="summary-row">
        <td>${ProductName}</td>
        <td>${AccountName}</td>
        <td>${Date}</td>
        <td>${Quantity}</td>
        <td>${Status}</td>
      </tr>
    `);
  }
}

// 📦 Load full sales summary
async function loadSalesSummary() {
  const summaryBody = document.getElementById("summaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      entries.push(data);
    });

    await renderSalesSummary(entries, summaryBody);
    console.log("✅ Sales summary loaded.");
  } catch (err) {
    console.error("❌ Error loading sales summary:", err);
    showToast("❌ Failed to load sales summary.");
  }
}

// 🔍 Load product filter from inventory
async function loadProductFilter() {
  const productFilter = document.getElementById("filterProduct");
  if (!productFilter) return;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const productSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.ProductName) productSet.add(data.ProductName);
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

// 🧮 Apply product + date filters
async function applyFilters() {
  const productFilter = document.getElementById("filterProduct");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const summaryBody = document.getElementById("summaryBody");

  if (!productFilter || !summaryBody) return;

  const selectedProduct = productFilter.value;
  const fromDate = fromInput?.value || "";
  const toDate = toInput?.value || "";

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      entries.push(data);
    });

    await renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct);
    console.log("✅ Filtered sales summary loaded.");
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showToast("❌ Failed to apply filters.");
  }
}

// 🔄 DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadSalesSummary();
  await loadProductFilter();

  const productFilter = document.getElementById("filterProduct");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const resetBtn = document.getElementById("resetFiltersBtn");

  if (productFilter) productFilter.addEventListener("change", applyFilters);
  if (fromInput) fromInput.addEventListener("change", applyFilters);
  if (toInput) toInput.addEventListener("change", applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      productFilter.selectedIndex = 0;
      if (fromInput) fromInput.value = "";
      if (toInput) toInput.value = "";
      loadSalesSummary();
      showToast("🔄 Filters reset — full sales summary restored.");
    });
  }
});
