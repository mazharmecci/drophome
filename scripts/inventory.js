import { db } from './firebase.js';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let allOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
  await fetchOrders();

  document.getElementById("applyFilters").addEventListener("click", applyFilters);
});

// 🔄 Fetch all outbound orders
async function fetchOrders() {
  const snapshot = await getDocs(collection(db, "outbound_orders"));
  allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTable(allOrders);
}

// 📊 Render table
function renderTable(records) {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) {
    console.warn("⚠️ inboundTableBody not found in DOM");
    return;
  }
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
      <td><a href="${record.labellink || "#"}" target="_blank">Label</a></td>
      <td>${record.labelqty || ""}</td>
      <td>${record.labelcost || ""}</td>
      <td>${record.threePLcost || ""}</td>
      <td>${record.notes || ""}</td>
      <td>
        <select onchange="updateStatus('${record.id}', this.value)">
          <option value="OrderPending" ${record.status==="OrderPending"?"selected":""}>Order-Pending</option>
          <option value="OrderDelivered" ${record.status==="OrderDelivered"?"selected":""}>Order-Delivered</option>
          <option value="OrderCompleted" ${record.status==="OrderCompleted"?"selected":""}>Order-Completed</option>
          <option value="CancelCompleted" ${record.status==="CancelCompleted"?"selected":""}>Cancel-Completed</option>
          <option value="Refunded" ${record.status==="Refunded"?"selected":""}>Refunded</option>
          <option value="Shipped" ${record.status==="Shipped"?"selected":""}>Shipped</option>
          <option value="LabelsPrinted" ${record.status==="LabelsPrinted"?"selected":""}>LabelsPrinted</option>
        </select>
      </td>
      <td><button onclick="saveStatus('${record.id}')">💾 Save</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// 🔄 Update status in Firestore
window.updateStatus = async function(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if (order) order.newStatus = newStatus; // temp store until save
};

window.saveStatus = async function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order || !order.newStatus) return;

  await updateDoc(doc(db, "outbound_orders", orderId), {
    status: order.newStatus,
    updatedAt: new Date()
  });

  alert(`✅ Status updated for ${order.orderId}`);
  await fetchOrders(); // refresh table
};

// 🔍 Apply filters
function applyFilters() {
  const searchId = document.getElementById("searchOrderId").value.trim();
  const status = document.getElementById("filterStatus").value;

  const filtered = allOrders.filter(o =>
    (!searchId || o.orderId.includes(searchId)) &&
    (!status || o.status === status)
  );

  renderTable(filtered);
}
