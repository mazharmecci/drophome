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
const availableQty = document.getElementById('availableQuantity');

// Load dropdowns on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadMasterList();

  // Auto-compute when product changes
  productSelector.addEventListener("change", computeStock);
});

// Load products from masterList document
async function loadMasterList() {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const data = masterSnap.data();

    // Populate product dropdown (products are objects { sku, name })
    data.products.forEach(product => {
      const opt = document.createElement("option");
      opt.value = product.name;
      opt.textContent = `${product.name} (${product.sku})`;
      productSelector.appendChild(opt);
    });

    console.log("✅ Master list loaded:", { products: data.products.length });

  } catch (err) {
    console.error("❌ Error loading masterList:", err);
    showToast("❌ Failed to load master data.");
  }
}

// Compute stock = inbound - outbound
async function computeStock() {
  const product = productSelector.value;

  if (!product) {
    availableQty.value = "";
    return;
  }

  try {
    console.log("🔍 Computing stock for:", { product });

    // Fetch inbound records
    let inboundTotal = 0;
    try {
      const inboundQuery = query(
        collection(db, "inbound"),
        where("productName", "==", product)
      );

      const inboundSnapshot = await getDocs(inboundQuery);
      inboundSnapshot.forEach(docSnap => {
        inboundTotal += parseInt(docSnap.data().quantityReceived || 0);
      });
      console.log("📥 Inbound total:", inboundTotal);
    } catch (inboundErr) {
      console.error("❌ Error fetching inbound records:", inboundErr);
      showToast("❌ Failed to fetch inbound data.");
      return;
    }

    // Fetch outbound records
    let outboundTotal = 0;
    try {
      const outboundQuery = query(
        collection(db, "outbound_orders"),
        where("productName", "==", product)
      );

      const outboundSnapshot = await getDocs(outboundQuery);
      outboundSnapshot.forEach(docSnap => {
        outboundTotal += parseInt(docSnap.data().quantity || 0);
      });
      console.log("📤 Outbound total:", outboundTotal);
    } catch (outboundErr) {
      console.error("❌ Error fetching outbound records:", outboundErr);
      showToast("❌ Failed to fetch outbound data.");
      return;
    }

    // Compute available stock
    const stock = inboundTotal - outboundTotal;
    availableQty.value = stock >= 0 ? stock : 0;
    console.log("✅ Computed stock:", { inboundTotal, outboundTotal, stock });

  } catch (err) {
    console.error("❌ Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}
