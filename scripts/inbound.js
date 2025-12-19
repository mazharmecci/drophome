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

// Collect form data
function collectFormData() {
  return {
    inboundId: getValue("inboundId"),
    dateReceived: getValue("dateReceived"),
    clientName: getValue("clientName"),
    productName: getValue("productName"),
    dispatchLocation: getValue("dispatchLocation"),
    sku: getValue("sku"),
    prodpic: getValue("prodpic"),
    labellink: getValue("labellink"),
    quantityReceived: parseInt(getValue("quantityReceived") || "0", 10),
    receivingNotes: getValue("receivingNotes"),
    price:
      parseFloat((getValue("price") || "").replace(/[^0-9.]/g, "")) || 0
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

    // 3️⃣ Auto-sync to inventory
    const inventoryData = {
      orderId: data.inboundId,
      date: data.dateReceived,
      accountName: data.clientName,
      productName: data.productName,
      dispatchLocation: data.dispatchLocation,
      sku: data.sku,
      quantity: data.quantityReceived,
      prodpic: data.prodpic,
      labellink: data.labellink,
      price: data.price,
      status: "OrderPending",
      labelqty: 0,
      labelcost: "",
      threePLcost: ""
    };
    await addDoc(collection(db, "inventory"), inventoryData);
    console.log("📦 Auto-synced to inventory:", inventoryData);

    // ✅ Feedback and reset
    showToast("✅ Inbound record submitted and synced to inventory.");
    form.reset();

    // regenerate inbound ID
    const inboundIdEl = document.getElementById("inboundId");
    if (inboundIdEl) inboundIdEl.value = generateInboundId();

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
  // set inboundId field with random ID
  const inboundIdEl = document.getElementById("inboundId");
  if (inboundIdEl) inboundIdEl.value = generateInboundId();

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
