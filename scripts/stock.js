import { db } from './firebase.js';
import { showToast } from './popupHandler.js';
import {
  doc,
  getDoc,
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
  await loadMasterList();

  // Auto-compute when filters change
  productSelector.addEventListener("change", computeStock);
  locationFilter.addEventListener("change", computeStock);
});

// Load products and locations from masterList document
async function loadMasterList() {
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
      productSelector.appendChild(opt);
    });

    // Populate location dropdown
    data.locations.forEach(location => {
      const opt = document.createElement("option");
      opt.value = location;
      opt.textContent = location;
      locationFilter.appendChild(opt);
    });

  } catch (err) {
    console.error("❌ Error loading masterList:", err);
    showToast("❌ Failed to load master data.");
  }
}

// Compute stock = inbound - outbound
async function computeStock() {
  const product = productSelector.value;
  const location = locationFilter.value;

  if (!product || !location) {
    availableQty.value = "";
    return;
  }

  try {
    console.log("🔍 Computing stock for:", { product, location });

    // Fetch inbound records
    let inboundTotal = 0;
    try {
      const inboundQuery = query(
        collection(db, "inbound"),
        where("productName", "==", product),
        where("storageLocation", "==", location)
      );
      console.log("📥 Inbound query:", inboundQuery);
      const inboundSnapshot = await getDocs(inboundQuery);
      console.log("📥 Inbound records found:", inboundSnapshot.size);

      inboundSnapshot.forEach(doc => {
        inboundTotal += parseInt(doc.data().quantityReceived || 0);
      });
    } catch (inboundErr) {
      console.error("❌ Error fetching inbound records:", inboundErr);
      showToast("❌ Failed to fetch inbound data.");
      return;
    }

    // Fetch outbound records
    let outboundTotal = 0;
    try {
      const outboundQuery = query(
        collection(db, "outbound"),
        where("productName", "==", product),
        where("storageLocation", "==", location)
      );
      console.log("📤 Outbound query:", outboundQuery);
      const outboundSnapshot = await getDocs(outboundQuery);
      console.log("📤 Outbound records found:", outboundSnapshot.size);

      outboundSnapshot.forEach(doc => {
        outboundTotal += parseInt(doc.data().quantity || 0);
      });
    } catch (outboundErr) {
      console.error("❌ Error fetching outbound records:", outboundErr);
      showToast("❌ Failed to fetch outbound data.");
      return;
    }

    // Compute available stock
    const stock = inboundTotal - outboundTotal;
    console.log("✅ Computed stock:", stock);
    availableQty.value = stock >= 0 ? stock : 0;

  } catch (err) {
    console.error("❌ Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}
