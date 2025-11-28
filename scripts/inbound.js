import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import { loadDropdowns } from './dropdownLoader.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const form = document.getElementById('inboundForm');

document.addEventListener("DOMContentLoaded", () => {
  // Generate ID on load
  generateId('INB', 'inbound', 'inboundId');

  // Load dropdowns from master list
  loadDropdowns();

  // If redirected from master.html, show toast
  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productName = document.getElementById('productName').value;
  const location = document.getElementById('storageLocation').value;
  const qty = parseInt(document.getElementById('quantityReceived').value);

  const data = {
    inboundId: document.getElementById('inboundId').value,
    dateReceived: document.getElementById('dateReceived').value,
    supplierName: document.getElementById('supplierName').value,
    productName,
    quantityReceived: qty,
    storageLocation: location,
    receivingNotes: document.getElementById('receivingNotes').value,
    timestamp: new Date()
  };

  try {
    // 1. Add inbound record
    await addDoc(collection(db, 'inbound'), data);

    // 2. Update stock (increment available quantity)
    await updateStock(productName, location, qty);

    // Refresh ID for next submission
    generateId('INB', 'inbound', 'inboundId');

    // Show success toast
    showToast("Inbound record submitted successfully.");

    // Reset form fields (except ID)
    form.reset();
    document.getElementById('inboundId').value = "";
    generateId('INB', 'inbound', 'inboundId'); // regenerate ID after reset
  } catch (err) {
    console.error("Error adding inbound record:", err);
    showToast("❌ Failed to submit inbound record.");
  }
});

// Helper: Update stock collection
async function updateStock(productName, location, qty) {
  try {
    const stockQuery = query(
      collection(db, "stock"),
      where("productName", "==", productName),
      where("location", "==", location)
    );
    const snapshot = await getDocs(stockQuery);

    if (!snapshot.empty) {
      // Update existing stock record
      const stockDoc = snapshot.docs[0];
      const currentQty = stockDoc.data().availableQuantity || 0;
      await updateDoc(doc(db, "stock", stockDoc.id), {
        availableQuantity: currentQty + qty,
        timestamp: new Date()
      });
    } else {
      // Create new stock record
      await addDoc(collection(db, "stock"), {
        productName,
        location,
        availableQuantity: qty,
        timestamp: new Date()
      });
    }
  } catch (err) {
    console.error("Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}
