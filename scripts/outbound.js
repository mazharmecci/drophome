import { db } from './firebase.js';
import { generateId } from './idGenerator.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById('outboundForm');
  const productDropdown = document.getElementById('productName');
  const locationDropdown = document.getElementById('storageLocation');
  const accountDropdown = document.getElementById('accountName');
  const availableQtyField = document.getElementById('availableQuantity');

  // Format dollar inputs
  setupDollarInput(document.getElementById("labelcost"));
  setupDollarInput(document.getElementById("threePLcost")); // updated id

  // Generate initial ID on load
  generateId('ORD', 'outbound_orders', 'orderId');

  // Load dropdowns from master list
  await loadMasterList({ productDropdown, locationDropdown, accountDropdown });

  // Show toast if redirected from master.html
  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }

  // Auto-compute stock when dropdowns change
  productDropdown.addEventListener("change", computeStock);
  locationDropdown.addEventListener("change", computeStock);

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const orderId = document.getElementById('orderId')?.value?.trim();
    const date = document.getElementById('date')?.value?.trim();
    const accountName = accountDropdown?.value?.trim();
    const sku = document.getElementById('sku')?.value?.trim();
    const productName = productDropdown?.value?.trim();
    const storageLocation = locationDropdown?.value?.trim();
    const quantity = parseInt(document.getElementById('quantity')?.value);
    const status = document.getElementById('status')?.value?.trim();
    const notes = document.getElementById('notes')?.value?.trim();

    // Dollar fields: sanitize and parse
    const labelCostRaw = document.getElementById('labelcost')?.value?.replace(/[^0-9.]/g, "");
    const threePLCostRaw = document.getElementById('threePLcost')?.value?.replace(/[^0-9.]/g, "");

    const labelcost = parseFloat(labelCostRaw) || 0;
    const threePLcost = parseFloat(threePLCostRaw) || 0;

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
      storageLocation,
      quantity,
      status,
      notes,
      labelcost,
      threePLcost,
      timestamp: new Date()
    };

    try {
      // 1. Add outbound record
      const docRef = await addDoc(collection(db, 'outbound_orders'), data);
      console.log("✅ Outbound record submitted with ID:", docRef.id);

      // 2. Update revenue summary
      await updateRevenueSummary(accountName, productName, labelcost, threePLcost);

      showToast("Outbound record submitted successfully.");

      // Reset form
      form.reset();
      document.getElementById('orderId').value = "";
      availableQtyField.value = "";
      generateId('ORD', 'outbound_orders', 'orderId');
    } catch (err) {
      console.error("❌ Error adding outbound record:", err);
      showToast("❌ Failed to submit outbound record.");
    }
  });
});

// 🔄 Format dollar inputs
function setupDollarInput(input) {
  if (!input) return;

  input.addEventListener("focus", () => {
    const raw = input.value.replace(/[^0-9.]/g, "");
    input.value = raw;
  });

  input.addEventListener("input", () => {
    let raw = input.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += "." + parts[1].slice(0, 2);
    }
    input.value = sanitized;
  });

  input.addEventListener("blur", () => {
    const raw = input.value.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    input.value = isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
  });
}

// 📦 Compute stock
async function computeStock() {
  const product = document.getElementById('productName')?.value;
  const location = document.getElementById('storageLocation')?.value;
  const availableQtyField = document.getElementById('availableQuantity');

  if (!product || !location) {
    availableQtyField.value = "";
    return;
  }

  try {
    let inboundTotal = 0;
    const inboundQuery = query(
      collection(db, "inbound"),
      where("productName", "==", product),
      where("storageLocation", "==", location)
    );
    const inboundSnapshot = await getDocs(inboundQuery);
    inboundSnapshot.forEach(d => {
      inboundTotal += parseInt(d.data().quantityReceived || 0);
    });

    let outboundTotal = 0;
    const outboundQuery = query(
      collection(db, "outbound_orders"),
      where("productName", "==", product)
    );
    const outboundSnapshot = await getDocs(outboundQuery);
    outboundSnapshot.forEach(d => {
      const row = d.data();
      if (row.storageLocation === location || !row.storageLocation) {
        outboundTotal += parseInt(row.quantity || 0);
      }
    });

    const available = inboundTotal - outboundTotal;
    availableQtyField.value = available >= 0 ? available : 0;
  } catch (err) {
    console.error("❌ Error computing stock:", err);
    availableQtyField.value = "";
  }
}

// 📊 Update revenue summary
async function updateRevenueSummary(accountName, productName, labelcost, threePLcost) {
  try {
    const revenueQuery = query(
      collection(db, "revenue_summary"),
      where("accountName", "==", accountName)
    );
    const snapshot = await getDocs(revenueQuery);

    if (!snapshot.empty) {
      // Update existing account record
      const revenueDoc = snapshot.docs[0];
      const current = revenueDoc.data();
      await updateDoc(doc(db, "revenue_summary", revenueDoc.id), {
        totalProducts: (current.totalProducts || 0) + 1,
        labelCost: (current.labelCost || 0) + labelcost,
        threePLCost: (current.threePLCost || 0) + threePLcost,
        timestamp: new Date()
      });
    } else {
      // Create new account record
      await addDoc(collection(db, "revenue_summary"), {
        accountName,
        totalProducts: 1,
        labelCost: labelcost,
        threePLCost: threePLcost,
        timestamp: new Date()
      });
    }
    console.log("✅ Revenue summary updated for account:", accountName);
  } catch (err) {
    console.error("❌ Error updating revenue summary:", err);
    showToast("❌ Failed to update revenue summary.");
  }
}

// 📋 Load master list
async function loadMasterList({ productDropdown, locationDropdown, accountDropdown }) {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      showToast("❌ masterList document not found.");
      return;
    }

    const data = masterSnap.data();

    // Products
    productDropdown.innerHTML = `<option value="" disabled selected>Choose your product</option>`;
    data.products.forEach(product => {
      const opt = document.createElement("option");
      opt.value = product;
      opt.textContent = product;
      productDropdown.appendChild(opt);
    });

    // Locations
    locationDropdown.innerHTML = `<option value="" disabled selected>Choose your location</option>`;
    data.locations.forEach(location => {
      const opt = document.createElement("option");
      opt.value = location;
      opt.textContent = location;
      locationDropdown.appendChild(opt);
    });

    // Accounts
    accountDropdown.innerHTML = `<option value="" disabled selected>Choose account name</option>`;
    data.accounts.forEach(account => {
      const opt = document.createElement("option");
      opt.value = account;
      opt.textContent = account;
      accountDropdown.appendChild(opt);
    });

    console.log("✅ Master list loaded:", {
      products: data.products.length,
      locations: data.locations.length,
      accounts: data.accounts.length
    });
  } catch (err) {
    console.error("❌ Error loading master list:", err);
    showToast("❌ Failed to load master list.");
  }
}
