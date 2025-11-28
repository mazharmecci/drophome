import { db } from './firebase.js';
import { generateId } from './idGenerator.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const form = document.getElementById('outboundForm');
const productDropdown = document.getElementById('productName');

document.addEventListener("DOMContentLoaded", async () => {
  generateId('ORD', 'outbound', 'orderId');
  await loadProducts();

  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }
});

async function loadProducts() {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA"); // your actual doc ID
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const data = masterSnap.data();
    data.products.forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productDropdown.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading products:", err);
    showToast("❌ Failed to load product list.");
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    orderId: document.getElementById('orderId').value,
    date: document.getElementById('date').value,
    accountName: document.getElementById('accountName').value,
    sku: document.getElementById('sku').value,
    productName: productDropdown.value,
    quantity: parseInt(document.getElementById('quantity').value),
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, 'outbound'), data);
    generateId('ORD', 'outbound', 'orderId');
    showToast("Outbound record submitted successfully.");
    form.reset();
    document.getElementById('orderId').value = "";
    generateId('ORD', 'outbound', 'orderId');
  } catch (err) {
    console.error("Error adding outbound record:", err);
    showToast("❌ Failed to submit outbound record.");
  }
});
