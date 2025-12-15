// scripts/inventory.js
import { db } from "./firebase.js";
import { loadDropdowns } from "./dropdownLoader.js";
import { showToast, showSuccessPopup } from "./popupHandler.js";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let allRecords = [];
let hasInitialLoadCompleted = false;

document.addEventListener("DOMContentLoaded", async () => {
  // Load master list values into dropdowns
  await loadDropdowns();

  // Auto-generate outbound ID (simple timestamp; tweak as needed)
  const inboundIdEl = document.getElementById("inboundId");
  if (inboundIdEl) {
    // 5-character random ID, e.g. OUT-3f9kq
    const shortId = Math.random().toString(36).substring(2, 7);
    inboundIdEl.value = `OUT-${shortId}`;
  }

  // Wire form submit
  const form = document.getElementById("inboundForm");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Subtotal calculator
  hookSubtotalCalculator();

  // Initial load of table
  await loadAndRenderRecords({ showErrorToast: false });

  document.getElementById("applyFilters")?.addEventListener("click", applyFilters);
  document.getElementById("clearFilters")?.addEventListener("click", clearFilters);

  hasInitialLoadCompleted = true;
});

// 📝 Handle form submit -> add to Firestore -> refresh table
async function handleFormSubmit(event) {
  event.preventDefault();

  const data = collectFormData();
  if (!data) return;

  try {
    const colRef = collection(db, "inventory");
    const docRef = await addDoc(colRef, {
      outboundId: data.inboundId,
      ordDate: data.orderedDate,
      delDate: data.deliveryDate,
      clientName: data.clientName,
      dispatchLocation: data.dispatchLocation,
      productName: data.productName,
      sku: data.sku,
      prodpic: data.prodpic,
      labellink: data.labellink,
      price: data.price,
      quantityReceived: data.quantityReceived,
      tax: data.tax,
      shipping: data.shipping,
      subtotal: data.subtotal,
      trackingNumber: data.trackingNumber,
      receivingNotes: data.receivingNotes,
      status: "OrderPending",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    showToast(`✅ Order saved with ID ${docRef.id}`);
    showSuccessPopup();

    event.target.reset();
    const subtotalInput = document.getElementById("subtotal");
    if (subtotalInput) subtotalInput.value = "0.00";

    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ handleFormSubmit failed:", err);
    showToast("⚠️ Failed to submit order. Please try again.");
  }
}

// Collect and normalize form data
function collectFormData() {
  const inboundId = document.getElementById("inboundId")?.value || "";
  const orderedDate = document.getElementById("orderedDate")?.value || "";
  const deliveryDate = document.getElementById("deliveryDate")?.value || "";
  const clientName = document.getElementById("clientName")?.value || "";
  const dispatchLocation = document.getElementById("dispatchLocation")?.value || "";
  const productName = document.getElementById("productName")?.value || "";
  const priceStr = document.getElementById("price")?.value || "0";
  const sku = document.getElementById("sku")?.value || "";
  const prodpic = document.getElementById("prodpic")?.value || "";
  const labellink = document.getElementById("labellink")?.value || "";
  const qtyStr = document.getElementById("quantityReceived")?.value || "0";
  const taxStr = document.getElementById("tax")?.value || "0";
  const shippingStr = document.getElementById("shipping")?.value || "0";
  const subtotalStr = document.getElementById("subtotal")?.value || "0";
  const trackingNumber = document.getElementById("trackingNumber")?.value || "";
  const receivingNotes = document.getElementById("receivingNotes")?.value || "";

  const price = parseFloat(priceStr) || 0;
  const quantityReceived = parseFloat(qtyStr) || 0;
  const tax = parseFloat(taxStr) || 0;
  const shipping = parseFloat(shippingStr) || 0;
  const subtotal = parseFloat(subtotalStr) || 0;

  if (!orderedDate || !deliveryDate || !clientName || !dispatchLocation || !productName) {
    showToast("⚠️ Please fill all required fields.");
    return null;
  }

  return {
    inboundId,
    orderedDate,
    deliveryDate,
    clientName,
    dispatchLocation,
    productName,
    sku,
    prodpic,
    labellink,
      price,
    quantityReceived,
    tax,
    shipping,
    subtotal,
    trackingNumber,
    receivingNotes
  };
}

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

// 📊 Render orders table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:20px; color:#888;">
          🚫 No records found. Try adjusting your filters or check back later.
        </td>
      </tr>`;
    return;
  }

  records.forEach(record => {
    const price = record.price != null ? parseFloat(record.price) : 0;
    const quantity = record.quantityReceived != null
      ? parseFloat(record.quantityReceived)
      : 0;
    const tax = record.tax != null ? parseFloat(record.tax) : 0;
    const shipping = record.shipping != null ? parseFloat(record.shipping) : 0;

    const subtotalValue =
      record.subtotal != null
        ? parseFloat(record.subtotal)
        : (quantity * price) + tax + shipping;

    const priceDisplay = price ? `$${price.toFixed(2)}` : "$0.00";
    const taxDisplay = tax ? `$${tax.toFixed(2)}` : "$0.00";
    const shippingDisplay = shipping ? `$${shipping.toFixed(2)}` : "$0.00";
    const subtotalDisplay = `$${subtotalValue.toFixed(2)}`;

    const mainTr = document.createElement("tr");
    const detailsTr = document.createElement("tr");
    detailsTr.classList.add("details-row");
    detailsTr.style.display = "none";

    // Summary row (compact)
    mainTr.innerHTML = `
      <td>${record.outboundId || record.inboundId || ""}</td>
      <td>${record.ordDate || record.orderedDate || record.orderDate || record.date || ""}</td>
      <td>${record.clientName || record.accountName || ""}</td>
      <td>${record.dispatchLocation || ""}</td>
      <td>${record.productName || ""}</td>
      <td>${quantity || 0}</td>
      <td>${subtotalDisplay}</td>
      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          ${renderStatusOptions(record.status)}
        </select>
      </td>
      <td>
        <button class="btn-secondary details-toggle">Details</button>
        <button class="btn-save" onclick="saveRecord('${record.id}')">💾 Save</button>
      </td>
    `;

    // Details row (full-width)
    detailsTr.innerHTML = `
      <td colspan="9">
        <div class="order-details">
          <div><strong>Outbound ID:</strong> ${record.outboundId || record.inboundId || ""}</div>
          <div><strong>Ordered Date:</strong> ${record.ordDate || record.orderedDate || ""}</div>
          <div><strong>Delivery Date:</strong> ${record.delDate || record.deliveryDate || ""}</div>
          <div><strong>Tracking #:</strong> ${record.trackingNumber || ""}</div>
          <div><strong>Unit Price:</strong> ${priceDisplay}</div>
          <div><strong>Tax:</strong> ${taxDisplay}</div>
          <div><strong>Shipping:</strong> ${shippingDisplay}</div>
          <div><strong>Subtotal:</strong> ${subtotalDisplay}</div>
          <div><strong>Notes:</strong> ${record.receivingNotes || ""}</div>
          <div style="margin-top:6px;">
            <strong>Product Picture:</strong>
            ${
              record.prodpic
                ? `<br><img src="${record.prodpic}" alt="Product" style="max-width:120px; margin-top:4px;" />`
                : " N/A"
            }
          </div>
          <div style="margin-top:6px;">
            <strong>Label Link:</strong>
            ${
              record.labellink
                ? ` <a href="${record.labellink}" target="_blank">${record.labellink}</a>`
                : " N/A"
            }
          </div>
        </div>
      </td>
    `;

    // Wire toggle
    mainTr.querySelector(".details-toggle").addEventListener("click", () => {
      detailsTr.style.display = detailsTr.style.display === "none" ? "table-row" : "none";
    });

    tbody.appendChild(mainTr);
    tbody.appendChild(detailsTr);
  });
}

// Subtotal calculator hook
function hookSubtotalCalculator() {
  const quantityInput = document.getElementById("quantityReceived");
  const priceInput = document.getElementById("price");
  const taxInput = document.getElementById("tax");
  const shippingInput = document.getElementById("shipping");
  const subtotalInput = document.getElementById("subtotal");

  if (!quantityInput || !priceInput || !taxInput || !shippingInput || !subtotalInput) return;

  function calculateSubtotal() {
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const shipping = parseFloat(shippingInput.value) || 0;
    subtotalInput.value = ((quantity * price) + tax + shipping).toFixed(2);
  }

  [quantityInput, priceInput, taxInput, shippingInput].forEach(input => {
    input.addEventListener("input", calculateSubtotal);
  });
}

// Render status options
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

// Filters (optional – same as your previous)
function applyFilters() {
  const client = (document.getElementById("filterClient")?.value || "").trim().toLowerCase();
  const fromDate = document.getElementById("filterStart")?.value || "";
  const toDate = document.getElementById("filterEnd")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const location = document.getElementById("filterLocation")?.value || "";

  const filtered = allRecords.filter(record => {
    const recordClient = (record.clientName || record.accountName || "").toLowerCase();
    const recordLocation = record.dispatchLocation || "";
    const recordDate = record.ordDate || record.orderedDate || record.dateReceived || record.date || "";

    const matchClient = !client || recordClient.includes(client);
    const matchLocation = !location || recordLocation === location;
    const matchStart = !fromDate || recordDate >= fromDate;
    const matchEnd = !toDate || recordDate <= toDate;
    const matchStatus = !status || record.status === status;

    return matchClient && matchLocation && matchStart && matchEnd && matchStatus;
  });

  renderTable(filtered);
}

function clearFilters() {
  ["filterClient", "filterStart", "filterEnd", "filterStatus", "filterLocation"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderTable(allRecords);
  showToast("🔄 Filters cleared. Showing all records.");
}

// Track edits and save
window.updateField = function (recordId, field, value, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record) return;
  record[field] = value;
  record._dirty = true;
  if (element) element.style.backgroundColor = "#fff3cd";
};

window.saveRecord = async function (recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

  try {
    await updateDoc(doc(db, "inventory", recordId), {
      status: record.status || "OrderPending",
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
