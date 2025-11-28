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

// Compute inbound totals
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

// Compute outbound totals (with fallback for missing storageLocation)
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

// Load summary table
async function loadSummary() {
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  try {
    const snapshot = await getDoc(docRef);
    const { products, locations } = snapshot.data();

    // Sort products alphabetically
    const sortedProducts = [...products].sort();

    for (const product of sortedProducts) {
      let inboundSubtotal = 0;
      let outboundSubtotal = 0;

      // Group header row
      const groupHeader = `
        <tr style="background-color:#f0f0f0; font-weight:bold;">
          <td colspan="5">${product}</td>
        </tr>
      `;
      summaryBody.insertAdjacentHTML("beforeend", groupHeader);

      for (const location of locations) {
        const inboundTotal = await computeInbound(product, location);
        const outboundTotal = await computeOutbound(product, location);
        const available = inboundTotal - outboundTotal;

        inboundSubtotal += inboundTotal;
        outboundSubtotal += outboundTotal;

        const row = `
          <tr>
            <td></td>
            <td>${location}</td>
            <td>${inboundTotal}</td>
            <td>${outboundTotal}</td>
            <td>${available >= 0 ? available : 0}</td>
          </tr>
        `;
        summaryBody.insertAdjacentHTML("beforeend", row);
      }

      const availableSubtotal = inboundSubtotal - outboundSubtotal;
      const subtotalRow = `
        <tr style="background-color:#ffe6e6; font-weight:bold;">
          <td></td>
          <td>➤ Subtotal</td>
          <td>${inboundSubtotal}</td>
          <td>${outboundSubtotal}</td>
          <td>${availableSubtotal >= 0 ? availableSubtotal : 0}</td>
        </tr>
      `;
      summaryBody.insertAdjacentHTML("beforeend", subtotalRow);
    }

    console.log("✅ Summary with subtotals loaded.");
  } catch (err) {
    console.error("❌ Error loading summary:", err);
    showToast("❌ Failed to load summary.");
  }
}

// Populate filters
async function loadFilters() {
  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");

  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    const { products, locations } = snapshot.data();

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

// Filtered summary
async function applyFilters() {
  const product = document.getElementById("filterProduct").value;
  const location = document.getElementById("filterLocation").value;
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  if (!product || !location) return;

  try {
    let inboundSubtotal = 0;
    let outboundSubtotal = 0;

    // Group header
    const groupHeader = `
      <tr style="background-color:#f0f0f0; font-weight:bold;">
        <td colspan="5">${product}</td>
      </tr>
    `;
    summaryBody.insertAdjacentHTML("beforeend", groupHeader);

    const inboundTotal = await computeInbound(product, location);
    const outboundTotal = await computeOutbound(product, location);
    const available = inboundTotal - outboundTotal;

    inboundSubtotal += inboundTotal;
    outboundSubtotal += outboundTotal;

    const row = `
      <tr>
        <td></td>
        <td>${location}</td>
        <td>${inboundTotal}</td>
        <td>${outboundTotal}</td>
        <td>${available >= 0 ? available : 0}</td>
      </tr>
    `;
    summaryBody.insertAdjacentHTML("beforeend", row);

    const subtotalRow = `
      <tr style="background-color:#ffe6e6; font-weight:bold;">
        <td></td>
        <td>➤ Subtotal</td>
        <td>${inboundSubtotal}</td>
        <td>${outboundSubtotal}</td>
        <td>${inboundSubtotal - outboundSubtotal}</td>
      </tr>
    `;
    summaryBody.insertAdjacentHTML("beforeend", subtotalRow);

    console.log("✅ Filtered summary with subtotal loaded.");
  } catch (err) {
    console.error("❌ Error applying filters:", err);
    showToast("❌ Failed to apply filters.");
  }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await loadSummary();
  await loadFilters();

  const productFilter = document.getElementById("filterProduct");
  const locationFilter = document.getElementById("filterLocation");

  productFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
});
