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
  return {
    // IDs
    inboundId: getValue("inboundId"),

    // Dates
    ordDate: getValue("orderedDate"),     // Ordered Date
    delDate: getValue("deliveryDate"),    // Delivery Date
    date: getValue("orderedDate"),        // generic fallback

    // Account / Client
    accountName: getValue("accountName"),
    clientName: getValue("clientName"),

    // Product / Warehouse
    productName: getValue("productName"),
    dispatchLocation: getValue("dispatchLocation"),
    sku: getValue("sku"),

    // Quantities / Media
    quantity: parseInt(getValue("quantityReceived") || "0", 10),
    quantityReceived: parseInt(getValue("quantityReceived") || "0", 10),
    prodpic: getValue("prodpic"),
    labellink: getValue("labellink"),

    // Pricing
    price: parseFloat((getValue("price") || "").replace(/[^0-9.]/g, "")) || 0,
    tax: parseFloat(getValue("tax") || "0") || 0,
    shipping: parseFloat(getValue("shipping") || "0") || 0,
    subtotal:
      (parseFloat((getValue("price") || "").replace(/[^0-9.]/g, "")) || 0) *
      (parseInt(getValue("quantityReceived") || "0", 10)),

    // Workflow
    status: getValue("orderStatus") || "OrderPending",
    labelqty: 0,
    labelcost: "",
    threePLcost: "",

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
  const data = collectFormData();

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

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  setInboundId();
  loadDropdowns();

  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }

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
});
