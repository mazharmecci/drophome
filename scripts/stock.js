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

    console.log("✅ Master list loaded:", { products: data.products.length, locations: data.locations.length });

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
      console.log("📥 Querying inbound collection:", "inbound");
      const inboundQuery = query(
        collection(db, "inbound"),
        where("productName", "==", product),
        where("storageLocation", "==", location)
      );
      console.log("📥 Inbound query object:", inboundQuery);

      const inboundSnapshot = await getDocs(inboundQuery);
      console.log("📥 Inbound records found:", inboundSnapshot.size);

      inboundSnapshot.forEach(doc => {
        console.log("📥 Inbound record:", doc.id, doc.data());
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
      console.log("📤 Querying outbound collection:", "outbound_orders"); // adjust if using 'outbound'
      const outboundQuery = query(
        collection(db, "outbound_orders"), // ✅ use correct collection name
        where("productName", "==", product),
        where("storageLocation", "==", location)
      );
      console.log("📤 Outbound query object:", outboundQuery);

      const outboundSnapshot = await getDocs(outboundQuery);
      console.log("📤 Outbound records found:", outboundSnapshot.size);

      outboundSnapshot.forEach(doc => {
        console.log("📤 Outbound record:", doc.id, doc.data());
        outboundTotal += parseInt(doc.data().quantity || 0);
      });
    } catch (outboundErr) {
      console.error("❌ Error fetching outbound records:", outboundErr);
      showToast("❌ Failed to fetch outbound data.");
      return;
    }

    // Compute available stock
    const stock = inboundTotal - outboundTotal;
    console.log("✅ Computed stock:", { inboundTotal, outboundTotal, stock });
    availableQty.value = stock >= 0 ? stock : 0;

  } catch (err) {
    console.error("❌ Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}
