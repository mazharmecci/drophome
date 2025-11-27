import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import { loadDropdowns } from './dropdownLoader.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc
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

  const data = {
    orderId: document.getElementById('orderId').value,
    date: document.getElementById('date').value,
    accountName: document.getElementById('accountName').value,
    sku: document.getElementById('sku').value,
    productName: document.getElementById('productName').value,
    quantity: parseInt(document.getElementById('quantity').value),
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, 'outbound'), data);

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
