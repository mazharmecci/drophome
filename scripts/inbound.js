import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import { loadDropdowns } from './dropdownLoader.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc
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

  const data = {
    inboundId: document.getElementById('inboundId').value,
    dateReceived: document.getElementById('dateReceived').value,
    supplierName: document.getElementById('supplierName').value,
    sku: document.getElementById('sku').value,
    productName: document.getElementById('productName').value,
    quantityReceived: parseInt(document.getElementById('quantityReceived').value),
    storageLocation: document.getElementById('storageLocation').value,
    receivingNotes: document.getElementById('receivingNotes').value,
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, 'inbound'), data);

    // Refresh ID for next submission
    generateId('INB', 'inbound', 'inboundId');

    // Show success toast
    showToast("Inbound record submitted successfully.");
    
    // Optionally reset form fields (except ID)
    form.reset();
    document.getElementById('inboundId').value = ""; 
    generateId('INB', 'inbound', 'inboundId'); // regenerate ID after reset
  } catch (err) {
    console.error("Error adding inbound record:", err);
    showToast("❌ Failed to submit inbound record.");
  }
});
