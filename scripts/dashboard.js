import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   SALES SUMMARY
   ========================== */

function animateSalesTable() {
  const table = document.querySelector("#sales .summary-table");
  if (table) {
    table.style.opacity = "0.3";
    setTimeout(() => {
      table.style.opacity = "1";
    }, 300);
  }
}

async function renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct, selectedStatus) {
  for (const entry of entries) {
    const {
      accountName = "-",
      date = "",
      productName = "-",
      quantity = 0,
      status = "-"
    } = entry;

    if (selectedProduct && productName !== selectedProduct) continue;
    if (fromDate && date < fromDate) continue;
    if (toDate && date > toDate) continue;
    if (selectedStatus !== "__all__" && status !== selectedStatus) continue;

    const displayStatus = status.replace(/([a-z])([A-Z])/g, "$1 $2");

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr class="summary-row">
        <td>${productName}</td>
        <td>${accountName}</td>
        <td>${date}</td>
        <td>${quantity}</td>
        <td>${displayStatus}</td>
      </tr>
    `);
  }
}

export async function loadSalesSummary() {
  const summaryBody = document.getElementById("salesSummaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];
    snapshot.forEach(doc => entries.push(doc.data()));
    await renderSalesSummary(entries, summaryBody, "", "", "", "__all__");
  } catch (err) {
    console.error("❌ Error loading sales summary:", err);
    showToast("❌ Failed to load sales summary.");
  }
}

export async function loadProductFilter() {
  const productFilter = document.getElementById("filterProduct");
  if (!productFilter) return;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
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
  } catch (err) {
    console.error("❌ Error loading product filter:", err);
    showToast("❌ Failed to load product options.");
  }
}

export async function applySalesFilters() {
  const productFilter = document.getElementById("filterProduct");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const statusFilter = document.getElementById("filterStatus");
  const summaryBody = document.getElementById("salesSummaryBody");

  if (!productFilter || !summaryBody || !statusFilter) return;

  const selectedProduct = productFilter.value;
  const fromDate = fromInput?.value || "";
  const toDate = toInput?.value || "";
  const selectedStatus = statusFilter?.value || "__all__";

  summaryBody.innerHTML = "";
  animateSalesTable();

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const entries = [];
    snapshot.forEach(doc => entries.push(doc.data()));
    await renderSalesSummary(entries, summaryBody, fromDate, toDate, selectedProduct, selectedStatus);
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showToast("❌ Failed to apply filters.");
  }
}

/* ==========================
   HELP MODAL TOGGLE
   ========================== */

function setupHelpModal() {
  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const closeHelpBtn = document.getElementById("closeHelpBtn");

  if (!helpBtn || !helpModal || !closeHelpBtn) return;

  helpBtn.addEventListener("click", () => {
    helpModal.classList.remove("hidden");
  });

  closeHelpBtn.addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });

  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add("hidden");
    }
  });
}

/* ==========================
   RESET FILTERS
   ========================== */

function setupResetFilters() {
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (!resetBtn) return;

  resetBtn.addEventListener("click", async () => {
    const productFilter = document.getElementById("filterProduct");
    const fromInput = document.getElementById("filterStart");
    const toInput = document.getElementById("filterEnd");
    const statusFilter = document.getElementById("filterStatus");

    if (productFilter) productFilter.value = "";
    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";
    if (statusFilter) statusFilter.value = "__all__";

    await loadSalesSummary();
  });
}

/* ==========================
   INIT
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadSalesSummary();
  await loadProductFilter();

  document.getElementById("filterProduct")?.addEventListener("change", applySalesFilters);
  document.getElementById("filterStart")?.addEventListener("change", applySalesFilters);
  document.getElementById("filterEnd")?.addEventListener("change", applySalesFilters);
  document.getElementById("filterStatus")?.addEventListener("change", applySalesFilters);

  setupHelpModal();
  setupResetFilters();
});
