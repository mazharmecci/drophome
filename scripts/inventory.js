// scripts/inventory.js
import { db } from "./firebase.js";
import { loadDropdowns } from "./dropdownLoader.js";
import { showToast, showSuccessPopup } from "./popupHandler.js";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// In‑memory state
let allRecords = [];
let hasInitialLoadCompleted = false;

// Pagination state
let currentPage = 1;
const pageSize = 10;

// masterList ref for stock adjustment
const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

// 🔧 simple stock updater (used on inbound create – adds stock)
async function updateStock(productName, quantity) {
  try {
    console.log(`📦 Stock update for ${productName}: +${quantity}`);
  } catch (err) {
    console.warn("⚠️ Stock update skipped:", err);
  }
}

// 🔧 adjust stock when status becomes Completed (delta can be negative)
async function adjustStockForProduct(productName, deltaQty) {
  if (!deltaQty || deltaQty === 0 || !productName) return;

  try {
    // 1️⃣ adjust stock/{productName} if exists
    try {
      const stockRef = doc(db, "stock", productName);
      const stockSnap = await getDoc(stockRef);
      if (stockSnap.exists()) {
        const current = stockSnap.data().availableQuantity || 0;
        await updateDoc(stockRef, {
          availableQuantity: current + deltaQty
        });
      }
    } catch (e) {
      console.warn("ℹ️ stock doc adjust skipped:", e);
    }

    // 2️⃣ adjust masterList.products[].stock / availableQuantity
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) return;

    const products = snapshot.data()?.products || [];
    const updatedProducts = products.map(p =>
      p.name === productName || p.productName === productName
        ? {
            ...p,
            stock: (p.stock ?? 0) + deltaQty,
            availableQuantity: (p.availableQuantity ?? p.stock ?? 0) + deltaQty
          }
        : p
    );

    await updateDoc(masterRef, { products: updatedProducts });
  } catch (err) {
    console.error("❌ adjustStockForProduct failed:", err);
    showToast("⚠️ Failed to adjust stock for completed order.");
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
    form.addEventListener("submit", handleSubmit);
  }

  // Subtotal live calculator
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

// 🧾 collect form data
function collectFormData() {
  const inboundId = document.getElementById("inboundId")?.value || "";
  const ordDate = document.getElementById("orderedDate")?.value || "";
  const delDate = document.getElementById("deliveryDate")?.value || "";
  const clientName = document.getElementById("clientName")?.value || "";
  const accountName = document.getElementById("accountName")?.value || "";
  const dispatchLocation = document.getElementById("dispatchLocation")?.value || "";
  const productName = document.getElementById("productName")?.value || "";
  const sku = document.getElementById("sku")?.value || "";
  const labellinkInput = document.getElementById("labellink")?.value || "";
  const trackingNumber = document.getElementById("trackingNumber")?.value || "";
  const receivingNotes = document.getElementById("receivingNotes")?.value || "";
  const status = document.getElementById("orderStatus")?.value || "OrderPending";

  // numeric fields
  const price = parseFloat(document.getElementById("price")?.value || "0") || 0;
  const quantityReceived = parseInt(
    document.getElementById("quantityReceived")?.value || "0",
    10
  ) || 0;
  const tax = parseFloat(document.getElementById("tax")?.value || "0") || 0;
  const shipping = parseFloat(document.getElementById("shipping")?.value || "0") || 0;

  const labelqty = parseInt(
    document.getElementById("totalLabels")?.value || "0",
    10
  ) || 0;
  const labelcost = parseFloat(
    document.getElementById("costPerLabel")?.value || "0"
  ) || 0;
  const packCount = parseInt(
    document.getElementById("packCount")?.value || "0",
    10
  ) || 0;
  const totalUnits = parseInt(
    document.getElementById("totalUnits")?.value || "0",
    10
  ) || 0;

  const subtotal = price * quantityReceived + tax + shipping;

  // compute 3PL cost
  let threePLCost = 0;
  if (packCount <= 0) threePLCost = 0;
  else if (packCount <= 2) threePLCost = 1.0;
  else threePLCost = packCount * 0.20 + 1.0;
  threePLCost = parseFloat(threePLCost.toFixed(2));

  // prodpic from preview; ensure string
  let prodpic = "";
  const prodpicPreview = document.getElementById("prodpicPreview");
  if (prodpicPreview) {
    const img = prodpicPreview.querySelector("img");
    if (img && typeof img.src === "string") {
      prodpic = img.src || "";
    }
  }

  // required field validation
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
    date: ordDate,

    // Account / client
    accountName,
    clientName,

    // Product / warehouse
    productName,
    dispatchLocation,
    sku,

    // Quantities / media
    quantityReceived,
    prodpic: prodpic || "",
    labellink: labellinkInput || "",

    // Pricing
    price,
    tax,
    shipping,
    subtotal,

    // Workflow
    status,

    // Label / 3PL
    labelqty,
    labelcost,
    totalLabels: labelqty,
    costPerLabel: labelcost,
    packCount,
    totalUnits,
    threePLCost,

    // Tracking / notes
    trackingNumber,
    receivingNotes,

    // System
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// 📝 handle submit
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const rawData = collectFormData();
  if (!rawData) return;

  // sanitize undefined
  const data = {
    ...rawData,
    prodpic: rawData.prodpic || "",
    labellink: rawData.labellink || ""
  };

  try {
    // inbound
    await addDoc(collection(db, "inbound"), data);

    // stock (add)
    await updateStock(data.productName, data.quantityReceived);

    // inventory mirror
    const inventoryData = {
      ...data,
      totalLabels: data.totalLabels ?? data.labelqty ?? 0,
      costPerLabel: data.costPerLabel ?? data.labelcost ?? 0,
      threePLCost: data.threePLCost ?? 0,
      status: data.status || "OrderPending",
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

// 📊 render table (status inline editable)
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

    // summary row – status as editable select
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
        <select class="status-select" data-id="${record.id}">
          <option value="OrderPending" ${record.status === "OrderPending" ? "selected" : ""}>OrderPending</option>
          <option value="Received" ${record.status === "Received" ? "selected" : ""}>Received</option>
          <option value="InProgress" ${record.status === "InProgress" ? "selected" : ""}>InProgress</option>
          <option value="Completed" ${record.status === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${record.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn-secondary details-toggle">Details</button>
      </td>
    `;

    // wire status change -> updateField + saveRecord
    const statusSelect = tr.querySelector(".status-select");
    if (statusSelect) {
      statusSelect.addEventListener("change", (ev) => {
        const newStatus = ev.target.value;
        updateField(record.id, "status", newStatus, ev.target);
        saveRecord(record.id);
      });
    }

    const threePLDisplay =
      record.threePLCost != null && record.threePLCost !== ""
        ? `$${parseFloat(record.threePLCost).toFixed(2)}`
        : "—";

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

          <div><strong>Total Labels:</strong> ${record.totalLabels ?? record.labelqty ?? "—"}</div>
          <div><strong>Cost per Label ($):</strong> ${record.costPerLabel ?? record.labelcost ?? "—"}</div>
          <div><strong>Pack#s:</strong> ${record.packCount ?? "—"}</div>
          <div><strong>Total Units:</strong> ${record.totalUnits ?? "—"}</div>
          <div><strong>3PL Cost ($):</strong> ${threePLDisplay}</div>

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
          <div style="margin-top:6px;"><strong>Tracking #:</strong> ${record.trackingNumber || ""}</div>
          <div style="margin-top:6px;"><strong>Notes:</strong> ${record.receivingNotes || ""}</div>
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

// 🔧 helpers for inline editing (status only)
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
    // fetch latest doc to know previous status and qty
    const docRef = doc(db, "inventory", recordId);
    const snap = await getDoc(docRef);
    const before = snap.exists() ? snap.data() : {};

    const prevStatus = before.status || "OrderPending";
    const prevQty =
      before.quantityReceived != null
        ? Number(before.quantityReceived)
        : before.quantity != null
        ? Number(before.quantity)
        : 0;

    const newStatus = record.status || "OrderPending";
    const newQty =
      record.quantityReceived != null
        ? Number(record.quantityReceived)
        : record.quantity != null
        ? Number(record.quantity)
        : 0;

    // 1️⃣ update inventory document
    await updateDoc(docRef, {
      status: newStatus,
      threePLCost: record.threePLCost ?? 0,
      packCount: record.packCount ?? 0,
      totalLabels: record.totalLabels ?? record.labelqty ?? 0,
      costPerLabel: record.costPerLabel ?? record.labelcost ?? 0,
      totalUnits: record.totalUnits ?? 0,
      updatedAt: new Date()
    });

    // 2️⃣ if status changed to Completed, reduce stock
    if (prevStatus !== "Completed" && newStatus === "Completed" && newQty > 0) {
      const productName = record.productName || before.productName || "";
      if (productName) {
        await adjustStockForProduct(productName, -newQty);
      }
    }

    showToast(`✅ Record updated for ${record.inboundId || record.id}`);
    showSuccessPopup();
    record._dirty = false;
    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
