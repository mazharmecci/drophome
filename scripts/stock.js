import { db } from './firebase.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const productSelector = document.getElementById('productName');
const locationFilter = document.getElementById('location');
const availableQty = document.getElementById('availableQuantity');

// Load dropdowns on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  await loadLocations();

  // Auto-compute when filters change
  productSelector.addEventListener("change", computeStock);
  locationFilter.addEventListener("change", computeStock);
});

// Load product list from masterList
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "masterList"));
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === "product") {   // filter only product entries
        const opt = document.createElement("option");
        opt.value = data.name;
        opt.textContent = data.name;
        productSelector.appendChild(opt);
      }
    });
  } catch (err) {
    console.error("Error loading products:", err);
    showToast("❌ Failed to load products.");
  }
}

// Load location list from masterList
async function loadLocations() {
  try {
    const snapshot = await getDocs(collection(db, "masterList"));
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === "location") {  // filter only location entries
        const opt = document.createElement("option");
        opt.value = data.name;
        opt.textContent = data.name;
        locationFilter.appendChild(opt);
      }
    });
  } catch (err) {
    console.error("Error loading locations:", err);
    showToast("❌ Failed to load locations.");
  }
}

// Compute stock = inbound - outbound
async function computeStock() {
  const product = productSelector.value;
  const location = locationFilter.value;

  if (!product) {
    availableQty.value = "";
    return;
  }

  try {
    // Fetch inbound records
    let inboundTotal = 0;
    const inboundQuery = query(
      collection(db, "inbound"),
      where("productName", "==", product),
      ...(location ? [where("storageLocation", "==", location)] : [])
    );
    const inboundSnapshot = await getDocs(inboundQuery);
    inboundSnapshot.forEach(doc => {
      inboundTotal += parseInt(doc.data().quantityReceived || 0);
    });

    // Fetch outbound records
    let outboundTotal = 0;
    const outboundQuery = query(
      collection(db, "outbound"),
      where("productName", "==", product),
      ...(location ? [where("storageLocation", "==", location)] : [])
    );
    const outboundSnapshot = await getDocs(outboundQuery);
    outboundSnapshot.forEach(doc => {
      outboundTotal += parseInt(doc.data().quantity || 0);
    });

    // Compute available stock
    const stock = inboundTotal - outboundTotal;
    availableQty.value = stock >= 0 ? stock : 0;

  } catch (err) {
    console.error("Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}
