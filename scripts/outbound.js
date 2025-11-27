import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const form = document.getElementById('outboundForm');

// Generate initial ID on load
generateId('ORD', 'outbound', 'orderId');

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
  } catch (err) {
    console.error("Error adding outbound record:", err);
  }
});
