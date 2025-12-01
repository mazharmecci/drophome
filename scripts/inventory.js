import { db } from './firebase.js';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { showSuccessPopup, showToast } from "./popupHandler.js";

let allRecords = [];

// 🔄 Load records on page ready
document.addEventListener("DOMContentLoaded", async () => {
  await fetchRecords();
  const applyBtn = document.getElementById("applyFilters");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);
});

// 📥 Fetch inventory records
async function fetchRecords() {
  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    allRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(allRecords);
  } catch (err) {
    console.error("❌ fetchRecords failed:", err);
    showToast("⚠️ Failed to load records. Check Firestore rules or collection name.");
    renderTable([]); // fallback row
  }
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

      <!-- Editable fields -->
      <td><input type="number" value="${record.labelqty ?? 0}" 
          onchange="updateField('${record.id}','labelqty',this.value,this)" /></td>
      <td><input type="text" value="${record.labelcost ?? ''}" placeholder="$00.00" 
          onchange="updateField('${record.id}','labelcost',this.value,this)" /></td>
      <td><input type="text" value="${record.threePLcost ?? ''}" placeholder="$00.00" 
          onchange="updateField('${record.id}','threePLcost',this.value,this)" /></td>

      <!-- Status dropdown -->
      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          ${renderStatusOptions(record.status)}
        </select>
      </td>

      <!-- Save button -->
      <td><button onclick="saveRecord('${record.id}')">💾 Save</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 🧠 Status options renderer
function renderStatusOptions(current) {
  const statuses = [
    "OrderPending", "OrderDelivered", "OrderCompleted",
    "CancelCompleted", "Refunded", "Shipped", "LabelsPrinted"
  ];
  return statuses.map(s =>
    `<option value="${s}" ${current === s ? "selected" : ""}>${s.replace(/([A-Z])/g, ' $1').trim()}</option>`
  ).join("");
}

// 🔍 Apply filters
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
window.updateField = function(recordId, field, value, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record) return;
  record[field] = value;
  record._dirty = true;
  if (element) element.style.backgroundColor = "#fff3cd";
};

// 💾 Save changes
window.saveRecord = async function(recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

  try {
    await updateDoc(doc(db, "inventory", recordId), {
      labelqty: Number(record.labelqty) || 0,
      labelcost: record.labelcost || "",
      threePLcost: record.threePLcost || "",
      status: record.status || "OrderPending",
      updatedAt: new Date()
    });

    showToast(`✅ Record updated for ${record.orderId || record.id}`);
    showSuccessPopup();
    record._dirty = false;
    await fetchRecords();
  } catch (err) {
    console.error("❌ saveRecord failed:", err);
    showToast("⚠️ Failed to save changes. Please try again.");
  }
};
