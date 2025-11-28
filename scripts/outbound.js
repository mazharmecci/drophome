import { db } from './firebase.js';
import { generateId } from './idGenerator.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById('outboundForm');
  const productDropdown = document.getElementById('productName');

  // Generate initial ID on load
  generateId('ORD', 'outbound_orders', 'orderId');

  // Load products into dropdown
  await loadProducts(productDropdown);

  // Show toast if redirected from master.html
  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const orderId = document.getElementById('orderId')?.value?.trim();
    const date = document.getElementById('date')?.value?.trim();
    const accountName = document.getElementById('accountName')?.value?.trim();
    const sku = document.getElementById('sku')?.value?.trim();
    const productName = productDropdown?.value?.trim();
    const quantity = parseInt(document.getElementById('quantity')?.value);
    const status = document.getElementById('status')?.value?.trim();
    const notes = document.getElementById('notes')?.value?.trim();

    // Basic validation
    if (!orderId || !date || !accountName || !sku || !productName || !quantity || !status) {
      showToast("❌ Please fill all required fields.");
      return;
    }

    const data = {
      orderId,
      date,
      accountName,
      sku,
      productName,
      quantity,
      status,
      notes,
      timestamp: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'outbound_orders'), data);
      console.log("✅ Outbound record submitted with ID:", docRef.id);

      // Show success toast
      showToast("Outbound record submitted successfully.");

      // Reset form fields (except ID)
      form.reset();
      document.getElementById('orderId').value = "";
      generateId('ORD', 'outbound_orders', 'orderId'); // regenerate ID after reset
    } catch (err) {
      console.error("❌ Error adding outbound record:", err);
      showToast("❌ Failed to submit outbound record.");
    }
  });
});

// Helper: Load products from masterList
async function loadProducts(productDropdown) {
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
