import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { app } from "../firebase.js";

const db = getFirestore(app);

async function loadData() {
  const snapshot = await getDocs(collection(db, "outboundOrders"));
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.orderNumber}</td>
      <td>
        <select id="status-${docId}">
          <option value="Pending" ${data.orderStatus === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Shipped" ${data.orderStatus === "Shipped" ? "selected" : ""}>Shipped</option>
          <option value="Delivered" ${data.orderStatus === "Delivered" ? "selected" : ""}>Delivered</option>
        </select>
      </td>
      <td><input type="number" id="qty-${docId}" value="${data.quantity}" /></td>
      <td><button onclick="saveChanges('${docId}')">Save</button></td>
    `;

    tbody.appendChild(row);
  });
}

window.saveChanges = async function (docId) {
  const newStatus = document.getElementById(`status-${docId}`).value;
  const newQty = Number(document.getElementById(`qty-${docId}`).value);

  try {
    const ref = doc(db, "outboundOrders", docId);
    await updateDoc(ref, {
      orderStatus: newStatus,
      quantity: newQty
    });
    alert("Record updated!");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update record.");
  }
};
