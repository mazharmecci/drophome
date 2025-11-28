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
  const locationDropdown = document.getElementById('storageLocation'); // ✅ new

  // Generate initial ID on load
  generateId('ORD', 'outbound_orders', 'orderId');

  // Load products + locations into dropdowns
  await loadMasterList(productDropdown, locationDropdown);

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
    const storageLocation = locationDropdown?.value?.trim(); // ✅ new
    const quantity = parseInt(document.getElementById('quantity')?.value);
    const status = document.getElementById('status')?.value?.trim();
    const notes = document.getElementById('notes')?.value?.trim();

    // Basic validation
    if (!orderId || !date || !accountName || !sku || !productName || !storageLocation || !quantity || !status) {
      showToast("❌ Please fill all required fields.");
      return;
    }

    const data = {
      orderId,
      date,
      accountName,
      sku,
      productName,
      storageLocation, // ✅ included
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

// Helper: Load products + locations from masterList
async function loadMasterList(productDropdown, locationDropdown) {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const data = masterSnap.data();

    // Populate product dropdown
    data.products.forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productDropdown.appendChild(opt);
    });

    // Populate location dropdown
    data.locations.forEach(location => {
      const opt = document.createElement("option");
      opt.value = location;
      opt.textContent = location;
      locationDropdown.appendChild(opt);
    });

    console.log("✅ Master list loaded:", { products: data.products.length, locations: data.locations.length });

  } catch (err) {
    console.error("❌ Error loading masterList:", err);
    showToast("❌ Failed to load master data.");
  }
}
