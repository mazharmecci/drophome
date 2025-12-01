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

  const applyBtn = document.getElementById("applyFilters");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) clearBtn.addEventListener("click", clearFilters);
});

// 🔄 Load and render inventory records
async function loadAndRenderRecords(options) {
  const opts = options || {};
  const showErrorToast = opts.showErrorToast !== undefined ? opts.showErrorToast : true;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    allRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(allRecords);

    hasInitialLoadCompleted = true;
  } catch (err) {
    console.error("❌ loadAndRenderRecords failed:", err);
    if (showErrorToast && hasInitialLoadCompleted) {
      showToast("⚠️ Failed to load records. Please check your connection or Firestore rules.");
    }
    renderTable([]);
  }
}

// 📊 Render inventory table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(records) || records.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="13" style="text-align:center; padding:20px; color:#888;">' +
      "🚫 No records found. Try adjusting your filters or check back later." +
      "</td></tr>";
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
          value="${record.labelqty != null ? record.labelqty : 0}"
          onchange="updateField('${record.id}','labelqty',this.value,this)"
        />
      </td>

      <td>
        <input
          class="compact-input"
          type="text"
          name="labelcost"
          value="${formatDollar(record.labelcost)}"
          placeholder="$0.00"
          onchange="updateField('${record.id}','labelcost',this.value,this)"
        />
      </td>

      <td>
        <input
          class="compact-input"
          type="text"
          name="threePLcost"
          value="${formatDollar(record.threePLcost)}"
          placeholder="$0.00"
          onchange="updateField('${record.id}','threePLcost',this.value,this)"
        />
      </td>

      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          ${renderStatusOptions(record.status)}
        </select>
      </td>

      <td>
        <button class="btn-save" onclick="saveRecord('${record.id}')">💾 Save</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const costInputs = tbody.querySelectorAll('input[name="labelcost"], input[name="threePLcost"]');
  costInputs.forEach(input => setupDollarInput(input));
}

// 💲 Format dollar values
function formatDollar(value) {
  const num = parseFloat(value);
  return isNaN(num) || num === 0 ? "$0.00" : "$" + num.toFixed(2);
}

// 💲 Setup dollar input formatting
function setupDollarInput(input) {
  if (!input) return;

  input.addEventListener("focus", () => {
    input.value = input.value.replace(/[^0-9.]/g, "");
  });

  input.addEventListener("input", () => {
    const raw = input.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const whole = parts[0];
    const decimal = parts[1];
    input.value = decimal ? whole + "." + decimal.slice(0, 2) : whole;
  });

  input.addEventListener("blur", () => {
    const num = parseFloat(input.value.replace(/[^0-9.]/g, ""));
    input.value = isNaN(num) ? "$0.00" : "$" + num.toFixed(2);
  });
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

// 🔍 Apply filters
function applyFilters() {
  const clientInput = document.getElementById("filterClient");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const statusSelect = document.getElementById("filterStatus");

  const client =
    clientInput && clientInput.value ? clientInput.value.trim().toLowerCase() : "";
  const fromDate = fromInput && fromInput.value ? fromInput.value : "";
  const toDate = toInput && toInput.value ? toInput.value : "";
  const status = statusSelect && statusSelect.value ? statusSelect.value : "";

  const filtered = allRecords.filter(record => {
    const recordClient = (record.accountName || "").toLowerCase();
    const recordDate = record.date || "";
    const matchClient = !client || recordClient.includes(client);
    const matchStart = !fromDate || recordDate >= fromDate;
    const matchEnd = !toDate || recordDate <= toDate;
    const matchStatus = !status || record.status === status;
    return matchClient && matchStart && matchEnd && matchStatus;
  });

  renderTable(filtered);
}

// 🧹 Clear filters
function clearFilters() {
  const clientInput = document.getElementById("filterClient");
  const fromInput = document.getElementById("filterStart");
  const toInput = document.getElementById("filterEnd");
  const statusSelect = document.getElementById("filterStatus");

  if (clientInput) clientInput.value = "";
  if (fromInput) fromInput.value = "";
  if (toInput) toInput.value = "";
  if (statusSelect) statusSelect.value = "";

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

// 💾 Save record
window.saveRecord = async function (recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

  const labelCost =
    parseFloat(String(record.labelcost || "").replace(/[^0-9.]/g, "")) || 0;
  const threePLCost =
    parseFloat(String(record.threePLcost || "").replace(/[^0-9.]/g, "")) || 0;

  try {
    await updateDoc(doc(db, "inventory", recordId), {
      labelqty: Number(record.labelqty) || 0,
      labelcost: labelCost,
      threePLcost: threePLCost,
      status: record.status || "OrderPending",
      updatedAt: new Date()
    });

    showToast("✅ Record updated for " + (record.orderId || record.id));
    showSuccessPopup();
    record._dirty = false;

    await loadAndRenderRecords({ showErrorToast: true });
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
