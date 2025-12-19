import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await renderStockTable();
});

// 🧾 Render stock summary table
async function renderStockTable() {
  const tbody = document.querySelector("#stockTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const stockSnapshot = await getDocs(collection(db, "stock"));
    const inboundSnapshot = await getDocs(collection(db, "inbound"));
    const outboundSnapshot = await getDocs(collection(db, "outbound_orders"));

    // Build inbound/outbound totals
    const inboundTotals = {};
    inboundSnapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.productName) {
        inboundTotals[d.productName] =
          (inboundTotals[d.productName] || 0) + parseInt(d.quantityReceived || 0);
      }
    });

    const outboundTotals = {};
    outboundSnapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.productName) {
        outboundTotals[d.productName] =
          (outboundTotals[d.productName] || 0) + parseInt(d.quantity || 0);
      }
    });

    // Render each product row
    stockSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.productName) return;

      const balance =
        (inboundTotals[data.productName] || 0) -
        (outboundTotals[data.productName] || 0);

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${data.sku || "-"}</td>
        <td>${data.productName}</td>
        <td>$${(data.price || 0).toFixed(2)}</td>
        <td>
          <input type="number" 
                 class="stock-input" 
                 value="${balance >= 0 ? balance : 0}" 
                 min="0" 
                 style="width:80px;" />
        </td>
        <td>
          <button class="save-stock-btn" data-id="${docSnap.id}">
            💾 Save
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Bind save buttons
    document.querySelectorAll(".save-stock-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-id");
        const row = e.currentTarget.closest("tr");
        const input = row.querySelector(".stock-input");
        const newQty = parseInt(input.value, 10);
        await updateStock(id, newQty);
      });
    });
  } catch (err) {
    console.error("❌ Error rendering stock table:", err);
    showToast("❌ Failed to load stock data.");
  }
}

// 💾 Update stock quantity
async function updateStock(docId, qty) {
  if (isNaN(qty) || qty < 0) {
    showToast("⚠️ Invalid quantity entered.");
    return;
  }

  try {
    const stockRef = doc(db, "stock", docId);
    await updateDoc(stockRef, { availableQuantity: qty });
    showToast("✅ Stock updated successfully.");
    await renderStockTable();
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}
