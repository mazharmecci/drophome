import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
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
      <td><button onclick="saveStockChanges('${docId}')">Save</button></td>
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

loadStockData();
