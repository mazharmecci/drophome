// scripts/inbound.js
import { db } from "./firebase.js";
import { loadDropdowns } from "./dropdownLoader.js";
import { showToast } from "./popupHandler.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ---------- Helpers ----------

// Generate inbound ID like IN-00564
function generateInboundId() {
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const padded = String(randomNum).padStart(5, "0");
  return `IN-${padded}`;
}

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

function setInboundId() {
  const inboundIdEl = document.getElementById("inboundId");
  if (inboundIdEl) inboundIdEl.value = generateInboundId();
}

// ---------- Data Collection ----------
function collectFormData() {
  // Pricing fields
  const priceRaw = (getValue("price") || "").replace(/[^0-9.]/g, "");
  const price = parseFloat(priceRaw) || 0;
  const quantityReceived = parseInt(getValue("quantityReceived") || "0", 10);
  const tax = parseFloat(getValue("tax") || "0") || 0;
  const shipping = parseFloat(getValue("shipping") || "0") || 0;
  const subtotal = price * quantityReceived + tax + shipping;

  // Label / 3PL fields
  const labelqty = parseInt(getValue("totalLabels") || "0", 10);
  const labelcost = parseFloat(getValue("costPerLabel") || "0") || 0;
  const packCount = parseInt(getValue("packCount") || "0", 10);
  const totalUnits = parseInt(getValue("totalUnits") || "0", 10);

  // Compute 3PL cost if not directly provided
  let threePLCost = parseFloat(getValue("threePLCost") || "0") || 0;
  if (!threePLCost) {
    if (packCount <= 0) threePLCost = 0;
    else if (packCount <= 2) threePLCost = 1.0;
    else threePLCost = (packCount * 0.20) + 1.0;
  }
  threePLCost = parseFloat(threePLCost.toFixed(2)); // numeric with 2 decimals

  // ✅ SAFE prodpic / labellink: never undefined, always string
  const prodpic = getValue("prodpic") || "";
  const labellink = getValue("labellink") || "";

  return {
    // IDs
    inboundId: getValue("inboundId"),

    // Dates
    ordDate: getValue("orderedDate"),
    delDate: getValue("deliveryDate"),
    date: getValue("orderedDate"),

    // Account / Client
    accountName: getValue("accountName"),
    clientName: getValue("clientName"),

    // Product / Warehouse
    productName: getValue("productName"),
    dispatchLocation: getValue("dispatchLocation"),
    sku: getValue("sku"),

    // Quantities / Media
    quantityReceived,
    prodpic,           // ✅ always "" or a URL string
    labellink,         // ✅ always "" or a URL string

    // Pricing
    price,
    tax,
    shipping,
    subtotal,

    // Workflow
    status: getValue("orderStatus") || "OrderPending",

    // Label / 3PL – aligned to Firestore
    labelqty,
    labelcost,
    totalLabels: labelqty,
    costPerLabel: labelcost,
    packCount,
    totalUnits,
    threePLCost,

    // Tracking / Notes
    trackingNumber: getValue("trackingNumber"),
    receivingNotes: getValue("receivingNotes"),

    // System
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// ---------- Submit Handler ----------

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  let data = collectFormData();

  // ✅ Extra safety: strip any accidental undefined that might sneak in
  data = {
    ...data,
    prodpic: data.prodpic || "",
    labellink: data.labellink || ""
  };

  try {
    // 1️⃣ Save inbound record
    await addDoc(collection(db, "inbound"), data);

    // 2️⃣ Update stock quantity
    await updateStock(data.productName, data.quantityReceived);

    // 3️⃣ Auto-sync to inventory (same schema)
    await addDoc(collection(db, "inventory"), data);
    console.log("📦 Auto-synced to inventory:", data);

    // ✅ Feedback and reset
    showToast("✅ Inbound record submitted and synced to inventory.");
    form.reset();
    setInboundId();
    loadDropdowns();

    // 🔄 Clear previews
    const prodpicPreview = document.getElementById("prodpicPreview");
    if (prodpicPreview) {
      prodpicPreview.innerHTML = "";
      prodpicPreview.textContent = "No image";
    }

    const labellinkPreview = document.getElementById("labellinkPreview");
    if (labellinkPreview) {
      labellinkPreview.innerHTML = "";
      labellinkPreview.textContent = "No label link";
    }
  } catch (err) {
    console.error("❌ Error submitting inbound or syncing inventory:", err);
    showToast("❌ Failed to submit inbound record.");
  }
}

// ---------- Stock Update ----------

async function updateStock(productName, qty) {
  try {
    const stockQuery = query(
      collection(db, "stock"),
      where("productName", "==", productName)
    );
    const snapshot = await getDocs(stockQuery);

    if (!snapshot.empty) {
      const stockDoc = snapshot.docs[0];
      const currentQty = stockDoc.data().availableQuantity || 0;
      await updateDoc(doc(db, "stock", stockDoc.id), {
        availableQuantity: currentQty + qty,
        timestamp: new Date()
      });
    } else {
      await addDoc(collection(db, "stock"), {
        productName,
        availableQuantity: qty,
        timestamp: new Date()
      });
    }
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}

// ---------- 3PL Calculator (packCount -> threePLCost) ----------

function hookThreePLCalculator() {
  const packInput = document.getElementById("packCount");
  const threePLField = document.getElementById("threePLCost");

  if (!packInput || !threePLField) return;

  function calculateThreePL() {
    const packs = parseInt(packInput.value || "0", 10);
    let cost = 0;

    if (packs <= 0) {
      cost = 0;
    } else if (packs <= 2) {
      cost = 1.0; // flat $1 for 1 or 2 packs
    } else {
      cost = packs * 0.20 + 1.0; // base formula for 3+
    }

    threePLField.value = cost.toFixed(2);
  }

  packInput.addEventListener("input", calculateThreePL);
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  // Auto-generate inbound ID
  setInboundId();

  // Load dropdowns from master list
  loadDropdowns();

  // Show toast if master list was updated
  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }

  // Form submit handler
  const form = document.getElementById("inboundForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  // 🔍 Label link live preview
  const labellinkInput = document.getElementById("labellink");
  const labellinkPreview = document.getElementById("labellinkPreview");

  if (labellinkInput && labellinkPreview) {
    labellinkPreview.textContent = "No label link";

    labellinkInput.addEventListener("input", () => {
      const raw = labellinkInput.value.trim();
      if (!raw) {
        labellinkPreview.innerHTML = "";
        labellinkPreview.textContent = "No label link";
        return;
      }

      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      labellinkPreview.innerHTML =
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  // 📦 Hook 3PL cost calculator
  hookThreePLCalculator();
});
