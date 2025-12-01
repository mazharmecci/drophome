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

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductDropdown();
  const selector = document.getElementById("productName");
  if (selector) selector.addEventListener("change", computeStockBalance);
});

// 🔄 Load product options from masterList
async function loadProductDropdown() {
  const selector = document.getElementById("productName");
  if (!selector) return;

  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const products = masterSnap.data().products || [];
    selector.innerHTML = `<option value="" disabled selected>Choose your product</option>`;
    products.forEach(({ name, sku }) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name} (${sku})`;
      selector.appendChild(opt);
    });

    console.log("✅ Product dropdown loaded:", products.length);
  } catch (err) {
    console.error("❌ Error loading masterList:", err);
    showToast("❌ Failed to load product list.");
  }
}

// 📊 Compute stock = inbound - outbound
async function computeStockBalance() {
  const product = document.getElementById("productName")?.value;
  const qtyField = document.getElementById("availableQuantity");
  if (!product || !qtyField) return;

  try {
    console.log("🔍 Computing stock for:", product);

    const inboundTotal = await getTotal("inbound", "quantityReceived", product);
    const outboundTotal = await getTotal("outbound_orders", "quantity", product);
    const balance = inboundTotal - outboundTotal;

    qtyField.value = balance >= 0 ? balance : 0;
    console.log("✅ Stock computed:", { inboundTotal, outboundTotal, balance });
  } catch (err) {
    console.error("❌ Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}

// 🔢 Helper: get total quantity from a collection
async function getTotal(collectionName, field, productName) {
  try {
    const q = query(collection(db, collectionName), where("productName", "==", productName));
    const snapshot = await getDocs(q);

    let total = 0;
    snapshot.forEach(doc => {
      total += parseInt(doc.data()[field] || 0);
    });

    console.log(`📦 ${collectionName} total:`, total);
    return total;
  } catch (err) {
    console.error(`❌ Error fetching ${collectionName} records:`, err);
    showToast(`❌ Failed to fetch ${collectionName} data.`);
    return 0;
  }
}
