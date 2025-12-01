import { db } from './firebase.js';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { showSuccessPopup, showToast } from "./popupHandler.js";

let allRecords = [];

document.addEventListener("DOMContentLoaded", async () => {
  await fetchRecords();
  const applyBtn = document.getElementById("applyFilters");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);
});

// 🔄 Fetch all inventory records
async function fetchRecords() {
  const snapshot = await getDocs(collection(db, "inventory"));
  allRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTable(allRecords);
}

// 📊 Render table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

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
      <td><input type="number" value="${record.labelqty || 0}" 
          onchange="updateField('${record.id}','labelqty',this.value,this)" /></td>
      <td><input type="text" value="${record.labelcost || ''}" placeholder="$00.00" 
          onchange="updateField('${record.id}','labelcost',this.value,this)" /></td>
      <td><input type="text" value="${record.threePLcost || ''}" placeholder="$00.00" 
          onchange="updateField('${record.id}','threePLcost',this.value,this)" /></td>

      <!-- Status dropdown -->
      <td>
        <select onchange="updateField('${record.id}','status',this.value,this)">
          <option value="OrderPending" ${record.status==="OrderPending"?"selected":""}>Order-Pending</option>
          <option value="OrderDelivered" ${record.status==="OrderDelivered"?"selected":""}>Order-Delivered</option>
          <option value="OrderCompleted" ${record.status==="OrderCompleted"?"selected":""}>Order-Completed</option>
          <option value="CancelCompleted" ${record.status==="CancelCompleted"?"selected":""}>Cancel-Completed</option>
          <option value="Refunded" ${record.status==="Refunded"?"selected":""}>Refunded</option>
          <option value="Shipped" ${record.status==="Shipped"?"selected":""}>Shipped</option>
          <option value="LabelsPrinted" ${record.status==="LabelsPrinted"?"selected":""}>LabelsPrinted</option>
        </select>
      </td>

      <!-- Save button -->
      <td><button onclick="saveRecord('${record.id}')">💾 Save</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// Store temporary edits + highlight
window.updateField = function(recordId, field, value, element) {
  const record = allRecords.find(r => r.id === recordId);
  if (record) {
    record[field] = value;
    record._dirty = true; // mark as changed
    if (element) element.style.backgroundColor = "#fff3cd"; // highlight edited cell
  }
};

// Save changes to Firestore
window.saveRecord = async function(recordId) {
  const record = allRecords.find(r => r.id === recordId);
  if (!record || !record._dirty) return;

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

  // Refresh table to clear highlights
  await fetchRecords();
};

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
