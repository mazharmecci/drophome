import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { app } from "../firebase.js";

const db = getFirestore(app);

async function loadStockData() {
  const snapshot = await getDocs(collection(db, "stockAvailability"));
  const tbody = document.querySelector("#stockTable tbody");
  tbody.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.sku}</td>
      <td>${data.productName}</td>
      <td><input type="number" id="qty-${docId}" value="${data.availableQuantity}" /></td>
      <td><input type="text" id="loc-${docId}" value="${data.location}" /></td>
      <td>
        <button onclick="saveStockChanges('${docId}')">Save</button>
        <button onclick="deleteStockRecord('${docId}')">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

window.saveStockChanges = async function (docId) {
  const newQty = Number(document.getElementById(`qty-${docId}`).value);
  const newLoc = document.getElementById(`loc-${docId}`).value;

  try {
    const ref = doc(db, "stockAvailability", docId);
    await updateDoc(ref, {
      availableQuantity: newQty,
      location: newLoc
    });
    alert("Stock record updated!");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update stock record.");
  }
};

window.deleteStockRecord = async function (docId) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    await deleteDoc(doc(db, "stockAvailability", docId));
    alert("Record deleted.");
    loadStockData(); // Refresh table
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete record.");
  }
};

loadStockData();
