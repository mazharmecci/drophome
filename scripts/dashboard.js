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

const masterDocRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

/* ==========================
   STOCK SUMMARY (PRODUCT / LOCATION)
   ========================== */

// 🔢 Compute inbound totals
async function computeInbound(product, location) {
  const q = query(
    collection(db, "inbound"),
    where("productName", "==", product),
    where("storageLocation", "==", location)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(d => {
    total += parseInt(d.data().quantityReceived || 0, 10);
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
  snapshot.forEach(d => {
    const data = d.data();
    if (data.storageLocation === location || !data.storageLocation) {
      total += parseInt(data.quantity || 0, 10);
    }
  });
  return total;
}

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
async function renderStockSummary(products, locations, summaryBody) {
  for (const product of products) {
    let inboundSubtotal = 0;
    let outboundSubtotal = 0;

    summaryBody.insertAdjacentHTML("beforeend", `
      <tr style="background-color:#f0f0f0; font-weight:bold;">
        <td colspan="5">${product}</td>
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

// 📦 Load full stock summary
async function loadStockSummary() {
  const summaryBody = document.getElementById("summaryBody");
  if (!summaryBody) return;

  summaryBody.innerHTML = "";
  animateStockTable();

  try {
    const snapshot = await getDoc(masterDocRef);
    if (!snapshot.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const { products, locations } = snapshot.data();
    const sortedProducts = [...products].sort();
    await renderStockSummary(sortedProducts, locations, summaryBody);
    console.log("✅ Stock summary loaded.");
  } catch (err) {
    console.error("❌ Error loading stock summary:", err);
    showToast("❌ Failed to load stock summary.");
  }
}

// 🔍 Load product/location filters
async function loadStockFilters() {
  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");
  if (!productFilter || !locationFilter) return;

  try {
    const snapshot = await getDoc(masterDocRef);
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
    console.error("❌ Error loading stock filters:", err);
  }
}

// 🧮 Apply stock filters
async function applyStockFilters() {
  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");
  const summaryBody = document.getElementById("summaryBody");
  if (!productFilter || !locationFilter || !summaryBody) return;

  const product = productFilter.value;
  const location = locationFilter.value;

  summaryBody.innerHTML = "";
  animateStockTable();

  try {
    const snapshot = await getDoc(masterDocRef);
    if (!snapshot.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const { products, locations } = snapshot.data();
    const filteredProducts = product ? [product] : products;
    const filteredLocations = location ? [location] : locations;

    await renderStockSummary(filteredProducts, filteredLocations, summaryBody);
    console.log("✅ Filtered stock summary loaded.");
  } catch (err) {
    console.error("❌ Error applying stock filters:", err);
    showToast("❌ Failed to apply stock filters.");
  }
}

/* ==========================
   REVENUE SUMMARY (ACCOUNT)
   ========================== */

// 💰 Load revenue summary (per account)
async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalProductsCell = document.getElementById("totalProductsCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  if (!tbody || !totalProductsCell || !totalLabelCostCell || !total3PLCostCell) return;

  tbody.innerHTML = "";

  let totalProducts = 0;
  let totalLabelCost = 0;
  let total3PLCost = 0;

  try {
    const snapshot = await getDocs(collection(db, "revenue_summary"));

    snapshot.forEach(d => {
      const data = d.data();
      const accountName = data.accountName || "-";
      const products = parseInt(data.totalProducts || 0, 10);
      const labelCost = parseFloat(data.labelCost || 0);
      const threePLCost = parseFloat(data.threePLCost || 0);

      totalProducts += products;
      totalLabelCost += labelCost;
      total3PLCost += threePLCost;

      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${accountName}</td>
          <td>${products}</td>
          <td>₹${labelCost.toFixed(2)}</td>
          <td>₹${threePLCost.toFixed(2)}</td>
        </tr>
      `);
    });

    totalProductsCell.textContent = totalProducts;
    totalLabelCostCell.textContent = `₹${totalLabelCost.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PLCost.toFixed(2)}`;

    console.log("✅ Revenue summary loaded.");
  } catch (err) {
    console.error("❌ Error loading revenue summary:", err);
    showToast("❌ Failed to load revenue summary.");
  }
}

// 🎯 Load revenue filters (accounts + months)
async function loadRevenueFilters() {
  const accountFilter = document.getElementById("filterAccount");
  const monthFilter = document.getElementById("filterMonth");
  if (!accountFilter || !monthFilter) return;

  try {
    // Accounts from revenue_summary
    const snapshot = await getDocs(collection(db, "revenue_summary"));

    const accountsSet = new Set();
    snapshot.forEach(d => {
      const data = d.data();
      if (data.accountName) accountsSet.add(data.accountName);
    });

    accountFilter.innerHTML = `<option value="" disabled selected>Choose account 👤</option>`;
    accountsSet.forEach(acc => {
      const opt = document.createElement("option");
      opt.value = acc;
      opt.textContent = acc;
      accountFilter.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Error loading revenue filters:", err);
  }
}

// 💰 Apply revenue filters
async function applyRevenueFilters() {
  const accountFilter = document.getElementById("filterAccount");
  const monthFilter = document.getElementById("filterMonth");
  const tbody = document.getElementById("revenueSummaryBody");
  const totalProductsCell = document.getElementById("totalProductsCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  if (!accountFilter || !monthFilter || !tbody) return;

  const account = accountFilter.value;
  const month = monthFilter.value; // expecting "01".."12" or ""

  tbody.innerHTML = "";

  let totalProducts = 0;
  let totalLabelCost = 0;
  let total3PLCost = 0;

  try {
    // Basic query: all revenue_summary docs
    let q = collection(db, "revenue_summary");

    // If account filter used, we can narrow down via where
    if (account) {
      q = query(q, where("accountName", "==", account));
    }

    const snapshot = await getDocs(q);

    snapshot.forEach(d => {
      const data = d.data();

      // If you store month in the doc (e.g. data.month = "11"), you can filter:
      if (month && data.month && data.month !== month) {
        return; // skip this row if month filter doesn't match
      }

      const accountName = data.accountName || "-";
      const products = parseInt(data.totalProducts || 0, 10);
      const labelCost = parseFloat(data.labelCost || 0);
      const threePLCost = parseFloat(data.threePLCost || 0);

      totalProducts += products;
      totalLabelCost += labelCost;
      total3PLCost += threePLCost;

      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${accountName}</td>
          <td>${products}</td>
          <td>₹${labelCost.toFixed(2)}</td>
          <td>₹${threePLCost.toFixed(2)}</td>
        </tr>
      `);
    });

    totalProductsCell.textContent = totalProducts;
    totalLabelCostCell.textContent = `₹${totalLabelCost.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PLCost.toFixed(2)}`;

    console.log("✅ Filtered revenue summary loaded.");
  } catch (err) {
    console.error("❌ Error applying revenue filters:", err);
    showToast("❌ Failed to apply revenue filters.");
  }
}

/* ==========================
   INIT
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  // Stock summary
  await loadStockSummary();
  await loadStockFilters();

  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");
  const resetStockBtn = document.getElementById("resetFiltersBtn");

  if (productFilter) {
    productFilter.addEventListener("change", applyStockFilters);
  }
  if (locationFilter) {
    locationFilter.addEventListener("change", applyStockFilters);
  }
  if (resetStockBtn) {
    resetStockBtn.addEventListener("click", () => {
      if (productFilter) productFilter.selectedIndex = 0;
      if (locationFilter) locationFilter.selectedIndex = 0;
      loadStockSummary();
      showToast("🔄 Filters reset — full stock summary restored.");
    });
  }

  // Revenue summary
  await loadRevenueSummary();
  await loadRevenueFilters();

  const accountFilter = document.getElementById("filterAccount");
  const monthFilter = document.getElementById("filterMonth");

  if (accountFilter) {
    accountFilter.addEventListener("change", applyRevenueFilters);
  }
  if (monthFilter) {
    monthFilter.addEventListener("change", applyRevenueFilters);
  }
});
