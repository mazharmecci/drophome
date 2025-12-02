import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   SALES SUMMARY (PRODUCT-LEVEL)
   ========================== */

// ✨ Animate sales summary table
function animateSalesTable() {
  const table = document.querySelector("#sales .summary-table");
  if (table) {
    table.style.opacity = "0.3";
    setTimeout(() => {
      table.style.opacity = "1";
    }, 300);
  }
}

// 📊 Render sales summary rows
async function renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct) {
  for (const entry of entries) {
    const {
      AccountName = "-",
      Date = "",
      ProductName = "-",
      Quantity = 0,
      Status = "-"
    } = entry;

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
export async function loadSalesSummary() {
  const summaryBody = document.getElementById("salesSummaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];
    snapshot.forEach(doc => entries.push(doc.data()));

    await renderSalesSummary(entries, summaryBody);
    console.log("✅ Sales summary loaded.");
  } catch (err) {
    console.error("❌ Error loading sales summary:", err);
    showToast("❌ Failed to load sales summary.");
  }
}

// 🔍 Load product filter
export async function loadProductFilter() {
  const productFilter = document.getElementById("filterProduct");
  if (!productFilter) return;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const productSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("📦 Inventory record:", data); // DEBUG
      if (data.ProductName) {
        productSet.add(data.ProductName);
      } else if (data.product) {
        productSet.add(data.product); // fallback if schema uses lowercase
      }
    });

    productFilter.innerHTML = `<option value="" disabled selected>Choose product name 📦</option>`;
    [...productSet].sort().forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productFilter.appendChild(opt);
    });

    console.log("✅ Product filter loaded with:", [...productSet]);
  } catch (err) {
    console.error("❌ Error loading product filter:", err);
    showToast("❌ Failed to load product options.");
  }
}

// 🧮 Apply filters
export async function applySalesFilters() {
  const productFilter = document.getElementById("filterProduct");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const summaryBody = document.getElementById("salesSummaryBody");

  if (!productFilter || !summaryBody) return;

  const selectedProduct = productFilter.value;
  const fromDate = fromInput?.value || "";
  const toDate = toInput?.value || "";

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];
    snapshot.forEach(doc => entries.push(doc.data()));

    await renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct);
    console.log("✅ Filtered sales summary loaded.");
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showToast("❌ Failed to apply filters.");
  }
}

/* ==========================
   INIT (Scoped to Sales Tab)
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadSalesSummary();
  await loadProductFilter();

  const productFilter = document.getElementById("filterProduct");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");

  productFilter?.addEventListener("change", applySalesFilters);
  fromInput?.addEventListener("change", applySalesFilters);
  toInput?.addEventListener("change", applySalesFilters);
});
