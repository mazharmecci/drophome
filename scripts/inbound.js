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
  // dateReceived is the main date the user enters
  const dateReceived = getValue("dateReceived");

  return {
    inboundId: getValue("inboundId"),
    // keep original field for backward compat
    dateReceived,

    // normalized names for table logic
    ordDate: dateReceived,       // Order Date
    delDate: dateReceived,       // Delivered Date (or change to another input if you have it)

    clientName: getValue("clientName"),
    productName: getValue("productName"),
    dispatchLocation: getValue("dispatchLocation"),
    sku: getValue("sku"),
    prodpic: getValue("prodpic"),
    labellink: getValue("labellink"),
    quantityReceived: parseInt(getValue("quantityReceived") || "0", 10),
    receivingNotes: getValue("receivingNotes"),
    price: parseFloat((getValue("price") || "").replace(/[^0-9.]/g, "")) || 0
  };
}

// ---------- Submit Handler ----------

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = collectFormData();

  try {
    // 1️⃣ Save inbound record (with normalized field names)
    await addDoc(collection(db, "inbound"), data);

    // 2️⃣ Update stock quantity
    await updateStock(data.productName, data.quantityReceived);

    // 3️⃣ Auto-sync to inventory with same key names used by summary tables
    const inventoryData = {
      // IDs
      inboundId: data.inboundId,
      orderId: data.inboundId,

      // dates
      ordDate: data.ordDate,
      delDate: data.delDate,
      date: data.ordDate, // generic fallback date

      // account / product
      accountName: data.clientName,
      clientName: data.clientName,
      productName: data.productName,
      dispatchLocation: data.dispatchLocation,
      sku: data.sku,

      // quantities / media
      quantity: data.quantityReceived,
      quantityReceived: data.quantityReceived,
      prodpic: data.prodpic,
      labellink: data.labellink,

      // pricing
      price: data.price,
      subtotal: data.price * data.quantityReceived,

      // workflow
      status: "OrderPending",
      labelqty: 0,
      labelcost: "",
      threePLcost: "",

      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, "inventory"), inventoryData);
    console.log("📦 Auto-synced to inventory:", inventoryData);

    // ✅ Feedback and reset
    showToast("✅ Inbound record submitted and synced to inventory.");
    form.reset();
    setInboundId();
    loadDropdowns();
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
});
