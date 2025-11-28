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

const form = document.getElementById('outboundForm');

document.addEventListener("DOMContentLoaded", () => {
  // Generate initial ID on load
  generateId('ORD', 'outbound', 'orderId');

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
  const qty = parseInt(document.getElementById('quantity').value);

  const data = {
    orderId: document.getElementById('orderId').value,
    date: document.getElementById('date').value,
    accountName: document.getElementById('accountName').value,
    productName,
    quantity: qty,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    storageLocation: location,
    timestamp: new Date()
  };

  try {
    // 1. Add outbound record
    await addDoc(collection(db, 'outbound'), data);

    // 2. Update stock (decrement available quantity)
    await updateStock(productName, location, qty);

    // Refresh ID for next entry
    generateId('ORD', 'outbound', 'orderId');

    // Show success toast
    showToast("Outbound record submitted successfully.");

    // Reset form fields (except ID)
    form.reset();
    document.getElementById('orderId').value = "";
    generateId('ORD', 'outbound', 'orderId'); // regenerate ID after reset
  } catch (err) {
    console.error("Error adding outbound record:", err);
    showToast("❌ Failed to submit outbound record.");
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
      const newQty = currentQty - qty;

      await updateDoc(doc(db, "stock", stockDoc.id), {
        availableQuantity: newQty >= 0 ? newQty : 0,
        timestamp: new Date()
      });
    } else {
      // If no stock record exists, outbound should not create one
      showToast("⚠️ No stock record found for this product/location.");
    }
  } catch (err) {
    console.error("Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}
