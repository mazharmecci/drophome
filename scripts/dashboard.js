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

// 📊 Render stock summary rows
async function renderStockSummary(products, accounts, summaryBody) {
  for (const product of products) {
    let inboundSubtotal = 0;
    let outboundSubtotal = 0;

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr style="background-color:#007bff; color:white; font-weight:bold;">
        <td colspan="5">${product}</td>
      </tr>
    `);

    for (const account of accounts) {
      const inboundTotal = await computeInbound(product, account);
      const outboundTotal = await computeOutbound(product, account);
      const available = inboundTotal - outboundTotal;

      inboundSubtotal += inboundTotal;
      outboundSubtotal += outboundTotal;

      summaryBody.insertAdjacentHTML("beforeend", `
        <tr>
          <td></td>
          <td>${account}</td>
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

// 🔢 Compute inbound totals
async function computeInbound(product, account) {
  const snapshot = await getDocs(collection(db, "inbound"));
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName === product && data.accountName === account) {
      total += parseInt(data.quantityReceived || 0, 10);
    }
  });
  return total;
}

// 🔢 Compute outbound totals
async function computeOutbound(product, account) {
  const snapshot = await getDocs(collection(db, "outbound_orders"));
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName === product && data.accountName === account) {
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
    const accountSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) productSet.add(data.productName);
      if (data.accountName) accountSet.add(data.accountName);
    });

    const sortedProducts = [...productSet].sort();
    const sortedAccounts = [...accountSet].sort();

    await renderStockSummary(sortedProducts, sortedAccounts, summaryBody);
    console.log("✅ Stock summary loaded.");
  } catch (err) {
    console.error("❌ Error loading stock summary:", err);
    showToast("❌ Failed to load stock summary.");
  }
}

// 🔍 Load product/account filters
async function loadStockFilters() {
  const productFilter = document.getElementById("filterProduct");
  const accountFilter = document.getElementById("filterLocation");
  if (!productFilter || !accountFilter) return;

  try {
    const snapshot = await getDocs(collection(db, "inbound"));
    const productSet = new Set();
    const accountSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) productSet.add(data.productName);
      if (data.accountName) accountSet.add(data.accountName);
    });

    productFilter.innerHTML = `<option value="" disabled selected>Choose your product 📦</option>`;
    [...productSet].sort().forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productFilter.appendChild(opt);
    });

    accountFilter.innerHTML = `<option value="" disabled selected>Choose your account 🔑</option>`;
    [...accountSet].sort().forEach(account => {
      const opt = document.createElement("option");
      opt.value = account;
      opt.textContent = account;
      accountFilter.appendChild(opt);
    });

    console.log("✅ Filters loaded from inbound records.");
  } catch (err) {
    console.error("❌ Error loading filters:", err);
    showToast("❌ Failed to load filter options.");
  }
}

// 🧮 Apply stock filters
async function applyStockFilters() {
  const productFilter = document.getElementById("filterProduct");
  const accountFilter = document.getElementById("filterLocation");
  const summaryBody = document.getElementById("summaryBody");
  if (!productFilter || !accountFilter || !summaryBody) return;

  const selectedProduct = productFilter.value;
  const selectedAccount = accountFilter.value;

  summaryBody.innerHTML = "";
  animateStockTable();

  try {
    const snapshot = await getDocs(collection(db, "inbound"));
    const allProducts = new Set();
    const allAccounts = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productName) allProducts.add(data.productName);
      if (data.accountName) allAccounts.add(data.accountName);
    });

    const filteredProducts = selectedProduct ? [selectedProduct] : [...allProducts];
    const filteredAccounts = selectedAccount ? [selectedAccount] : [...allAccounts];

    await renderStockSummary(filteredProducts, filteredAccounts, summaryBody);
    console.log("✅ Filtered stock summary loaded.");
  } catch (err) {
    console.error("❌ Error applying stock filters:", err);
    showToast("❌ Failed to apply stock filters.");
  }
}

// 🔄 DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadStockSummary();
  await loadStockFilters();

  const productFilter = document.getElementById("filterProduct");
  const accountFilter = document.getElementById("filterLocation");
  const resetBtn = document.getElementById("resetFiltersBtn");

  if (productFilter) productFilter.addEventListener("change", applyStockFilters);
  if (accountFilter) accountFilter.addEventListener("change", applyStockFilters);
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      productFilter.selectedIndex = 0;
      accountFilter.selectedIndex = 0;
      loadStockSummary();
      showToast("🔄 Filters reset — full stock summary restored.");
    });
  }
});
