import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { showSuccessPopup, showToast } from "./popupHandler.js";

let allRecords = [];
let hasInitialLoadCompleted = false;

// 🔄 Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadAndRenderRecords({ showErrorToast: false }); // no toast on first load

  const applyBtn = document.getElementById("applyFilters");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);

  hasInitialLoadCompleted = true;
});

// 🔄 Generic loader + renderer
async function loadAndRenderRecords({ showErrorToast = true } = {}) {
  try {
    allRecords = await fetchRecords();
    renderTable(allRecords);
  } catch (err) {
    console.error("❌ loadAndRenderRecords failed:", err);

    if (showErrorToast && hasInitialLoadCompleted && err.code !== "permission-denied") {
      showToast("⚠️ Failed to load records. Please check your connection or Firestore rules.");
    }

    renderTable([]); // fallback UI
  }
}

// 📥 Fetch inventory records (data only)
async function fetchRecords() {
  console.log("🔄 Starting fetchRecords...");
  const snapshot = await getDocs(collection(db, "inventory"));

  const records = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data };
  });

  console.log("✅ Total records fetched:", records.length);
  return records;
}

// 💲 Dollar-format helper (reused logic)
function setupDollarInput(input) {
  if (!input) return;

  input.addEventListener("focus", () => {
    const raw = input.value.replace(/[^0-9.]/g, "");
    input.value = raw;
  });

  input.addEventListener("input", () => {
    let raw = input.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += "." + parts[1].slice(0, 2);
    }
    input.value = sanitized;
  });

  input.addEventListener("blur", () => {
    const raw = input.value.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    input.value = isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
  });
}

// 📊 Render inventory table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="13" style="text-align:center; padding:20px; color:#888;">
        🚫 No records found. Try adjusting your filters or check back later.
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  records.forEach(record => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.orderId || ""}</td>
      <td>${record.date || ""}</td>
      <td>${record.accountName || ""}</td>
      <td>${record.productName || ""}</td>
      <td>${record.sku || ""}</td>
      <td>${record.quantity || ""}</td>
      <td><img src="${record.prodpic || ""}" alt="Product" style="max-width:60px"/></td>

      <td>
        <input
          class="compact-input"
          type="number"
          value="${record.labelqty ?? 0}"
          onchange="updateField('${record.id}','labelqty',this.value,this)"
        />
      </td>
      <td>
        <input
          class="compact-input"
          type="text"
          name="labelcost"
          value="${formatDollarCell(record.labelcost)}"
          placeholder="$0.00"
          onchange="updateField('${record.id}','labelcost',this.value,this)"
        />
      </td>
      <td>
        <input
          class="compact-input"
          type="text"
          name="threePLcost"
          value="${formatDollarCell(record.threePLcost)}"
          placeholder="$0.00"
          onchange="updateField('${record.id}','threePLcost',this.value,this)"
        />
      </td>

      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          ${renderStatusOptions(record.status)}
        </select>
      </td>

      <td><button onclick="saveRecord('${record.id}')">💾 Save</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Attach dollar formatting to cost inputs after rows are in the DOM
  tbody.querySelectorAll('input[name="labelcost"], input[name="threePLcost"]').forEach(setupDollarInput);
}

// Helper to display existing numeric values as $x.xx
function formatDollarCell(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return "$0.00";
  return `$${num.toFixed(2)}`;
}

// 🧠 Status options renderer
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
    .map(
      s =>
        `<option value="${s}" ${current === s ? "selected" : ""}>${s
          .replace(/([A-Z])/g, " $1")
          .trim()}</option>`
    )
    .join("");
}

// 🔍 Apply filters (no toast here)
function applyFilters() {
  const searchId = document.getElementById("searchOrderId")?.value.trim();
  const status = document.getElementById("filterStatus")?.value;

  const filtered = allRecords.filter(r =>
    (!searchId || (r.orderId && r.orderId.includes(searchId))) &&
    (!status || r.status === status)
  );

  renderTable(filtered);
}

// ✏️ Track edits + highlight
window.updateField = function (recordId, field, value, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record) return;

  record[field] = value;
  record._dirty = true;

  if (element) element.style.backgroundColor = "#fff3cd";
};

// 💾 Save changes (user action → show toast)
window.saveRecord = async function (recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

  // Sanitize currency fields to numbers before saving
  const labelCostRaw = (record.labelcost || "").toString().replace(/[^0-9.]/g, "");
  const threePLCostRaw = (record.threePLcost || "").toString().replace(/[^0-9.]/g, "");

  const labelcostNum = parseFloat(labelCostRaw) || 0;
  const threePLcostNum = parseFloat(threePLCostRaw) || 0;

  try {
    await updateDoc(doc(db, "inventory", recordId), {
      labelqty: Number(record.labelqty) || 0,
      labelcost: labelcostNum,
      threePLcost: threePLcostNum,
      status: record.status || "OrderPending",
      updatedAt: new Date()
    });

    showToast(`✅ Record updated for ${record.orderId || record.id}`);
    showSuccessPopup();
    record._dirty = false;

    // reload after save; allow error toast now
    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
