import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import { loadDropdowns } from './dropdownLoader.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const form = document.getElementById('stockForm');

document.addEventListener("DOMContentLoaded", () => {
  // Generate initial ID on load
  generateId('STK', 'stock', 'stockId');

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
    stockId: document.getElementById('stockId').value,
    date: document.getElementById('date').value,
    supplierName: document.getElementById('supplierName').value,
    sku: document.getElementById('sku').value,
    productName: document.getElementById('productName').value,
    quantityAvailable: parseInt(document.getElementById('quantityAvailable').value),
    storageLocation: document.getElementById('storageLocation').value,
    notes: document.getElementById('notes').value,
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, 'stock'), data);

    // Refresh ID for next entry
    generateId('STK', 'stock', 'stockId');

    // Show success toast
    showToast("Stock record submitted successfully.");

    // Reset form fields (except ID)
    form.reset();
    document.getElementById('stockId').value = "";
    generateId('STK', 'stock', 'stockId'); // regenerate ID after reset
  } catch (err) {
    console.error("Error adding stock record:", err);
    showToast("❌ Failed to submit stock record.");
  }
});

