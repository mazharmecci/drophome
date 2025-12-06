import { generateId } from './idGenerator.js';
import { db } from './firebase.js';
import { loadDropdowns } from './dropdownLoader.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  generateId('INB', 'inbound', 'inboundId');
  loadDropdowns();

  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "true") {
    showToast("Master list updated successfully.");
  }

  const form = document.getElementById('inboundForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
});

// 🔄 Collect form data from inbound form
function collectFormData() {
  return {
    inboundId: getValue("inboundId"),
    dateReceived: getValue("dateReceived"),
    clientName: getValue("clientName"),
    productName: getValue("productName"),
    dispatchLocation: getValue("dispatchLocation"), // ✅ NEW
    sku: getValue("sku"),
    prodpic: getValue("prodpic"),
    labellink: getValue("labellink"),
    quantityReceived: parseInt(getValue("quantityReceived") || "0", 10),
    receivingNotes: getValue("receivingNotes")
  };
}

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

// ✅ Submit handler
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = collectFormData();

  try {
    // 🔄 Submit to inbound
    await addDoc(collection(db, 'inbound'), data);
    await updateStock(data.productName, data.quantityReceived);

    // 📦 Auto-sync to inventory
    const inventoryData = {
      orderId: data.inboundId,
      date: data.dateReceived,
      accountName: data.clientName,
      productName: data.productName,
      dispatchLocation: data.dispatchLocation, // ✅ NEW
      sku: data.sku,
      quantity: data.quantityReceived,
      prodpic: data.prodpic,
      labellink: data.labellink,
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
    document.getElementById('inboundId').value = "";
    generateId('INB', 'inbound', 'inboundId');
    loadDropdowns();
  } catch (err) {
    console.error("❌ Error submitting inbound or syncing inventory:", err);
    showToast("❌ Failed to submit inbound record.");
  }
}

// 📦 Update stock quantity
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
