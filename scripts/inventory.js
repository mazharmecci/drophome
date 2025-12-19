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

// In‑memory state
let allRecords = [];
let hasInitialLoadCompleted = false;

// pagination state
let currentPage = 1;
const pageSize = 10;

// 🔧 simple stock updater (replace with your own logic if needed)
async function updateStock(productName, quantity) {
  try {
    console.log(`📦 Stock update for ${productName}: +${quantity}`);
    // Example pattern if you later add a stock collection:
    // const stockRef = doc(db, "stock", productName);
    // await updateDoc(stockRef, { quantity: increment(quantity) });
  } catch (err) {
    console.warn("⚠️ Stock update skipped:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadDropdowns();

// Auto-generate inbound ID (e.g., IN-00564)
const inboundIdEl = document.getElementById("inboundId");
if (inboundIdEl) {
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const padded = String(randomNum).padStart(5, "0");
  inboundIdEl.value = `IN-${padded}`;
}

  const form = document.getElementById("inboundForm");
  if (form) {
    // ✅ Correct handler name
    form.addEventListener("submit", handleSubmit);
  }

  // subtotal live calculator
  hookSubtotalCalculator();

  // Initial load
  await loadAndRenderRecords({ showErrorToast: false });

  // Filters
  document.getElementById("applyFilters")?.addEventListener("click", applyFilters);
  document.getElementById("clearFilters")?.addEventListener("click", clearFilters);

  // Pagination buttons
  document.getElementById("prevPage")?.addEventListener("click", () => {
    setPage(currentPage - 1);
  });
  document.getElementById("nextPage")?.addEventListener("click", () => {
    setPage(currentPage + 1);
  });

  hasInitialLoadCompleted = true;
});

// 📝 handle submit
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = collectFormData();
  if (!data) return;

  try {
    // 1️⃣ Save inbound record
    const inboundRef = await addDoc(collection(db, "inbound"), data);

    // 2️⃣ Update stock quantity
    await updateStock(data.productName, data.quantityReceived);

    // 3️⃣ Auto-sync to inventory (same schema as inbound)
    const inventoryData = {
      // IDs
      inboundId: data.inboundId,
      orderId: data.inboundId,

      // dates
      ordDate: data.ordDate,
      delDate: data.delDate,
      date: data.ordDate,

      // account / product
      accountName: data.accountName,
      clientName: data.clientName,
      productName: data.productName,
      dispatchLocation: data.dispatchLocation,
      sku: data.sku,

      // quantities / media
      quantity: data.quantityReceived,
      quantityReceived: data.quantityReceived,
      prodpic: data.prodpic,
      labellink: data.labellink,

      // pricing
      price: data.price,
      tax: data.tax,
      shipping: data.shipping,
      subtotal: data.subtotal,

      // workflow
      status: data.status || "OrderPending",
      labelqty: 0,
      labelcost: "",
      threePLcost: "",

      // tracking / notes
      trackingNumber: data.trackingNumber,
      receivingNotes: data.receivingNotes,

      // system
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const invRef = await addDoc(collection(db, "inventory"), inventoryData);
    console.log("📦 Auto-synced to inventory:", inventoryData);

    showToast(`✅ Order saved with ID ${invRef.id}`);
    showSuccessPopup();

    form.reset();
    const subtotalInput = document.getElementById("subtotal");
    if (subtotalInput) subtotalInput.value = "0.00";

    currentPage = 1;
    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ handleSubmit failed:", err);
    showToast("⚠️ Failed to submit order. Please try again.");
  }
}

// 🧾 collect form data
function collectFormData() {
  const inboundId = document.getElementById("inboundId")?.value || "";
  const ordDate = document.getElementById("orderedDate")?.value || "";
  const delDate = document.getElementById("deliveryDate")?.value || "";
  const clientName = document.getElementById("clientName")?.value || "";
  const accountName = document.getElementById("accountName")?.value || "";
  const dispatchLocation = document.getElementById("dispatchLocation")?.value || "";
  const productName = document.getElementById("productName")?.value || "";
  const priceStr = document.getElementById("price")?.value || "0";
  const sku = document.getElementById("sku")?.value || "";
  const labellink = document.getElementById("labellink")?.value || "";
  const qtyStr = document.getElementById("quantityReceived")?.value || "0";
  const taxStr = document.getElementById("tax")?.value || "0";
  const shippingStr = document.getElementById("shipping")?.value || "0";
  const trackingNumber = document.getElementById("trackingNumber")?.value || "";
  const receivingNotes = document.getElementById("receivingNotes")?.value || "";
  const status = document.getElementById("orderStatus")?.value || "OrderPending";

  const price = parseFloat(priceStr) || 0;
  const quantityReceived = parseInt(qtyStr, 10) || 0;
  const tax = parseFloat(taxStr) || 0;
  const shipping = parseFloat(shippingStr) || 0;
  const subtotal = price * quantityReceived + tax + shipping;

  // prodpic comes from master; stored on record, not a text input
  const prodpicPreview = document.getElementById("prodpicPreview");
  let prodpic = "";
  if (prodpicPreview) {
    const img = prodpicPreview.querySelector("img");
    if (img && img.src) prodpic = img.src;
  }

  if (!ordDate || !delDate || !clientName || !dispatchLocation || !productName) {
    showToast("⚠️ Please fill all required fields.");
    return null;
  }

  return {
    // IDs
    inboundId,
    orderId: inboundId,

    // Dates
    ordDate,
    delDate,
    date: ordDate, // fallback

    // Account / Client
    accountName,
    clientName,

    // Product / Warehouse
    productName,
    dispatchLocation,
    sku,

    // Quantities / Media
    quantity: quantityReceived,
    quantityReceived,
    prodpic,
    labellink,

    // Pricing
    price,
    tax,
    shipping,
    subtotal,

    // Workflow
    status,
    labelqty: 0,
    labelcost: "",
    threePLcost: "",

    // Tracking / Notes
    trackingNumber,
    receivingNotes,

    // System
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// 🔄 load + render from Firestore
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
    allRecords = [];
    renderTable(allRecords);
  }
}

// 📄 pagination helpers
function getTotalPages() {
  return Math.max(1, Math.ceil(allRecords.length / pageSize));
}

function setPage(page) {
  const totalPages = getTotalPages();
  currentPage = Math.min(Math.max(1, page), totalPages);
  renderTable(allRecords);
}

function updatePaginationControls() {
  const totalPages = getTotalPages();
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }
}

// 📊 render table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:20px; color:#888;">
          🚫 No records found.
        </td>
      </tr>`;
    updatePaginationControls();
    return;
  }

  const totalPages = getTotalPages();
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRecords = records.slice(startIndex, endIndex);

  pageRecords.forEach(record => {
    const inboundId = record.inboundId || record.orderId || "";
    const orderDate = record.ordDate || record.orderedDate || record.date || "";
    const deliveredDate = record.delDate || record.deliveryDate || "";
    const clientName = record.clientName || "";
    const accountName = record.accountName || "";
    const warehouse = record.dispatchLocation || "";
    const productName = record.productName || "";
    const qty = record.quantityReceived != null
      ? parseFloat(record.quantityReceived)
      : record.quantity != null
        ? parseFloat(record.quantity)
        : 0;
    const subtotal = record.subtotal != null
      ? parseFloat(record.subtotal)
      : (record.price || 0) * qty;

    const tr = document.createElement("tr");
    const detailsTr = document.createElement("tr");
    detailsTr.classList.add("details-row");
    detailsTr.style.display = "none";

    // summary row
    tr.innerHTML = `
      <td>${inboundId}</td>
      <td>${orderDate}</td>
      <td>${deliveredDate}</td>
      <td>${clientName || accountName}</td>
      <td>${warehouse}</td>
      <td>${productName}</td>
      <td>${qty || 0}</td>
      <td>$${subtotal.toFixed(2)}</td>
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

    // details row with extended fields
    detailsTr.innerHTML = `
      <td colspan="10">
        <div class="order-details">
          <div><strong>Inbound ID:</strong> ${inboundId}</div>
          <div><strong>Order Date:</strong> ${orderDate}</div>
          <div><strong>Delivered Date:</strong> ${deliveredDate}</div>
          <div><strong>Client:</strong> ${clientName}</div>
          <div><strong>Account:</strong> ${accountName}</div>
          <div><strong>Warehouse:</strong> ${warehouse}</div>
          <div><strong>Product:</strong> ${productName}</div>
          <div><strong>SKU:</strong> ${record.sku || ""}</div>
          <div><strong>Qty:</strong> ${qty || 0}</div>
          <div><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</div>
    
          <div><strong>Total Labels:</strong>
            <input type="number" value="${record.totalLabels ?? ""}" 
                   onchange="updateField('${record.id}','totalLabels',this.value,this)" />
          </div>
    
          <div><strong>Cost per Label ($):</strong>
            <input type="number" step="0.01" value="${record.costPerLabel ?? ""}" 
                   onchange="updateField('${record.id}','costPerLabel',this.value,this)" />
          </div>
    
          <div><strong>Pack#s:</strong>
            <input type="number" value="${record.packCount ?? ""}" 
                   onchange="updatePackAndThreePL('${record.id}',this.value,this)" />
          </div>
    
          <div><strong>Total Units:</strong>
            <input type="number" value="${record.totalUnits ?? ""}" 
                   onchange="updateField('${record.id}','totalUnits',this.value,this)" />
          </div>
    
          <div><strong>3PL Cost ($):</strong>
            <span id="threePL-${record.id}">$${record.threePLcost ?? "—"}</span>
          </div>
    
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
    
          <div style="margin-top:6px;">
            <strong>Tracking #:</strong> ${record.trackingNumber || ""}
          </div>
          <div style="margin-top:6px;">
            <strong>Notes:</strong> ${record.receivingNotes || ""}
          </div>
        </div>
      </td>
    `;

    tr.querySelector(".details-toggle").addEventListener("click", () => {
      detailsTr.style.display =
        detailsTr.style.display === "none" ? "table-row" : "none";
    });

    tbody.appendChild(tr);
    tbody.appendChild(detailsTr);
  });

  updatePaginationControls();
}

window.updatePackAndThreePL = function (recordId, packValue, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record) return;

  const packs = parseInt(packValue || "0", 10);
  let cost = 0;

  if (packs <= 0) cost = 0;
  else if (packs <= 2) cost = 1.0;
  else cost = (packs * 0.20) + 1.0;

  record.packCount = packs;
  record.threePLcost = cost.toFixed(2);
  record._dirty = true;

  if (element) element.style.backgroundColor = "#fff3cd";

  const costSpan = document.getElementById(`threePL-${recordId}`);
  if (costSpan) costSpan.textContent = `$${record.threePLcost}`;
};

// 🧮 subtotal calculator
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
    subtotalInput.value = (quantity * price + tax + shipping).toFixed(2);
  }

  [quantityInput, priceInput, taxInput, shippingInput].forEach(input => {
    input.addEventListener("input", calculateSubtotal);
  });
}

// 🎛 status options
function renderStatusOptions(current) {
  const statuses = [
    "OrderPending",
    "WarehouseDelivered",
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

// 🔍 filters: order date + status
function applyFilters() {
  const fromDate = document.getElementById("filterStart")?.value || "";
  const toDate = document.getElementById("filterEnd")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";

  const filtered = allRecords.filter(record => {
    const recordDate =
      record.ordDate ||
      record.orderedDate ||
      record.orderDate ||
      record.date ||
      "";

    const recordStatus = record.status || "";

    const matchFrom = !fromDate || recordDate >= fromDate;
    const matchTo = !toDate || recordDate <= toDate;
    const matchStatus = !status || recordStatus === status;

    return matchFrom && matchTo && matchStatus;
  });

  currentPage = 1;
  renderTable(filtered);
}

function clearFilters() {
  ["filterStart", "filterEnd", "filterStatus"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
  });

  currentPage = 1;
  renderTable(allRecords);
  showToast("🔄 Filters cleared. Showing all records.");
}

// ✏️ edit + save
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

    showToast(`✅ Record updated for ${record.inboundId || record.id}`);
    showSuccessPopup();
    record._dirty = false;
    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
