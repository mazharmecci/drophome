import { db } from "./firebase.js";
import { showToast, showSuccessPopup } from "./popupHandler.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let allRecords = [];
let hasInitialLoadCompleted = false;

// 🔄 DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadAndRenderRecords({ showErrorToast: false });

  document.getElementById("applyFilters")?.addEventListener("click", applyFilters);
  document.getElementById("clearFilters")?.addEventListener("click", clearFilters);

  hasInitialLoadCompleted = true;
});

// 🔄 Load and render order records
async function loadAndRenderRecords(options) {
  const { showErrorToast = true } = options || {};

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    allRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(allRecords);
  } catch (err) {
    console.error("❌ loadAndRenderRecords failed:", err);
    if (showErrorToast && hasInitialLoadCompleted) {
      showToast("⚠️ Failed to load records. Please check your connection or Firestore rules.");
    }
    renderTable([]);
  }
}

// 📊 Render orders table (matches form fields)
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="16" style="text-align:center; padding:20px; color:#888;">
          🚫 No records found. Try adjusting your filters or check back later.
        </td>
      </tr>`;
    return;
  }

  records.forEach(record => {
    const tr = document.createElement("tr");

    const price = record.price != null ? parseFloat(record.price) : 0;
    const quantity = record.quantityReceived != null
      ? parseFloat(record.quantityReceived)
      : 0;
    const tax = record.tax != null ? parseFloat(record.tax) : 0;
    const shipping = record.shipping != null ? parseFloat(record.shipping) : 0;

    // If subtotal not stored, compute like the form
    const subtotalValue =
      record.subtotal != null
        ? parseFloat(record.subtotal)
        : (quantity * price) + tax + shipping;

    const priceDisplay = price ? `$${price.toFixed(2)}` : "$0.00";
    const taxDisplay = tax ? `$${tax.toFixed(2)}` : "$0.00";
    const shippingDisplay = shipping ? `$${shipping.toFixed(2)}` : "$0.00";
    const subtotalDisplay = `$${subtotalValue.toFixed(2)}`;

    tr.innerHTML = `
      <!-- Outbound ID -->
      <td>${record.outboundId || record.inboundId || ""}</td>

      <!-- Date Received -->
      <td>${record.dateReceived || record.date || ""}</td>

      <!-- Client Name -->
      <td>${record.clientName || record.accountName || ""}</td>

      <!-- Delivered Warehouse -->
      <td>${record.dispatchLocation || ""}</td>

      <!-- Product Name -->
      <td>${record.productName || ""}</td>

      <!-- SKU -->
      <td>${record.sku || ""}</td>

      <!-- Product Picture -->
      <td>
        ${
          record.prodpic
            ? `<img src="${record.prodpic}" alt="Product" style="max-width:60px" />`
            : ""
        }
      </td>

      <!-- Label Link -->
      <td>
        ${
          record.labellink
            ? `<a href="${record.labellink}" target="_blank">Open</a>`
            : ""
        }
      </td>

      <!-- Unit Price ($) -->
      <td>${priceDisplay}</td>

      <!-- Quantity -->
      <td>${quantity || 0}</td>

      <!-- Tax ($) -->
      <td>${taxDisplay}</td>

      <!-- Shipping ($) -->
      <td>${shippingDisplay}</td>

      <!-- Subtotal ($) -->
      <td>${subtotalDisplay}</td>

      <!-- Tracking # -->
      <td>${record.trackingNumber || ""}</td>

      <!-- Status (editable) -->
      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          ${renderStatusOptions(record.status)}
        </select>
      </td>

      <!-- Action -->
      <td>
        <button class="btn-save" onclick="saveRecord('${record.id}')">💾 Save</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// 💲 Format dollar values (if you later make tax/shipping editable as currency)
function formatDollar(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return "$0.00";
  return "$" + num.toFixed(2);
}

// 🧠 Render status options
function renderStatusOptions(current) {
  const statuses = [
    "OrderPending",
    "OrderDelivered",
    "OrderCompleted",
    "CancelCompleted",
    "Refunded",
    "Shipped",
    "LabelsPrinted"
  ];

  return statuses
    .map(status => {
      const label = status.replace(/([A-Z])/g, " $1").trim();
      const selected = current === status ? "selected" : "";
      return `<option value="${status}" ${selected}>${label}</option>`;
    })
    .join("");
}

// 🔍 Apply filters (adapted to new field names)
function applyFilters() {
  const client = (document.getElementById("filterClient")?.value || "").trim().toLowerCase();
  const fromDate = document.getElementById("filterStart")?.value || "";
  const toDate = document.getElementById("filterEnd")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const location = document.getElementById("filterLocation")?.value || "";

  const filtered = allRecords.filter(record => {
    const recordClient = (record.clientName || record.accountName || "").toLowerCase();
    const recordLocation = record.dispatchLocation || "";
    const recordDate = record.dateReceived || record.date || "";

    const matchClient = !client || recordClient.includes(client);
    const matchLocation = !location || recordLocation === location;
    const matchStart = !fromDate || recordDate >= fromDate;
    const matchEnd = !toDate || recordDate <= toDate;
    const matchStatus = !status || record.status === status;

    return matchClient && matchLocation && matchStart && matchEnd && matchStatus;
  });

  renderTable(filtered);
}

// 🧹 Clear filters
function clearFilters() {
  ["filterClient", "filterStart", "filterEnd", "filterStatus", "filterLocation"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  renderTable(allRecords);
  showToast("🔄 Filters cleared. Showing all records.");
}

// ✏️ Track edits
window.updateField = function (recordId, field, value, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record) return;

  record[field] = value;
  record._dirty = true;
  if (element) element.style.backgroundColor = "#fff3cd";
};

// 💾 Save record (status + monetary fields if you decide to store them)
window.saveRecord = async function (recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

  try {
    await updateDoc(doc(db, "inventory", recordId), {
      status: record.status || "OrderPending",
      // If you later want to persist recalculated subtotal/tax/shipping, add here.
      updatedAt: new Date()
    });

    showToast(`✅ Record updated for ${record.outboundId || record.inboundId || record.id}`);
    showSuccessPopup();
    record._dirty = false;

    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
