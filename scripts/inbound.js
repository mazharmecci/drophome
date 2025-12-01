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

// 🔄 Collect form data
function collectFormData() {
  return {
    inboundId: document.getElementById("inboundId")?.value || "",
    dateReceived: document.getElementById("dateReceived")?.value || "",
    clientName: document.getElementById("clientName")?.value || "",
    productName: document.getElementById("productName")?.value || "",
    sku: document.getElementById("sku")?.value || "",
    prodpic: document.getElementById("prodpic")?.value || "",       // NEW FIELD
    labellink: document.getElementById("labellink")?.value || "",   // NEW FIELD
    quantityReceived: parseInt(document.getElementById("quantityReceived")?.value || "0", 10),
    receivingNotes: document.getElementById("receivingNotes")?.value || ""
  };
}

// ✅ Submit handler
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = collectFormData();
  const sendToInventory = document.getElementById("sendToInventory")?.checked;

  try {
    // Submit to inbound
    await addDoc(collection(db, 'inbound'), data);
    await updateStock(data.productName, data.quantityReceived);

    // Optional: Submit to inventory
    if (sendToInventory) {
      const inventoryData = {
        orderId: data.inboundId,
        date: data.dateReceived,
        accountName: data.clientName,
        productName: data.productName,
        sku: data.sku,
        quantity: data.quantityReceived,
        prodpic: data.prodpic,
        status: "OrderPending",         // default status
        labelqty: 0,
        labelcost: "",
        threePLcost: ""
      };
      await addDoc(collection(db, "inventory"), inventoryData);
      console.log("📦 Sent to inventory:", inventoryData);
    }

    showToast("✅ Inbound record submitted successfully.");
    form.reset();

    // Regenerate ID and reload dropdowns
    document.getElementById('inboundId').value = "";
    generateId('INB', 'inbound', 'inboundId');
    loadDropdowns();
  } catch (err) {
    console.error("❌ Error submitting inbound or inventory:", err);
    showToast("❌ Failed to submit inbound record.");
  }
}


// 📦 Update stock collection (no location now)
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
