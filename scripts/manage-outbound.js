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
function renderTable(orders) {
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  orders.forEach(order => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.orderId}</td>
      <td>${order.date}</td>
      <td>${order.accountName}</td>
      <td>${order.productName}</td>
      <td>${order.storageLocation}</td>
      <td>${order.quantity}</td>
      <td>
        <select onchange="updateStatus('${order.id}', this.value)">
          <option value="OrderPending" ${order.status==="OrderPending"?"selected":""}>Order-Pending</option>
          <option value="OrderDelivered" ${order.status==="OrderDelivered"?"selected":""}>Order-Delivered</option>
          <option value="OrderCompleted" ${order.status==="OrderCompleted"?"selected":""}>Order-Completed</option>
          <option value="CancelCompleted" ${order.status==="CancelCompleted"?"selected":""}>Cancel-Completed</option>
          <option value="Refunded" ${order.status==="Refunded"?"selected":""}>Refunded</option>
          <option value="Shipped" ${order.status==="Shipped"?"selected":""}>Shipped</option>
          <option value="LabelsPrinted" ${order.status==="LabelsPrinted"?"selected":""}>LabelsPrinted</option>
        </select>
      </td>
      <td><button onclick="saveStatus('${order.id}')">Save</button></td>
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
