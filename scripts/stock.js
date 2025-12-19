import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  updateDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

async function renderStockTable() {
  try {
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) {
      console.warn("Master list document not found");
      return;
    }

    const data = snapshot.data();
    const products = data?.products || [];
    const tbody = document.querySelector("#stockTable tbody");

    if (!tbody) return;

    tbody.innerHTML = ""; // Clear existing rows

    products.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.sku || ''}</td>
        <td>${product.name || product.productName || ''}</td>
        <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
        <td>${product.stock || product.availableQuantity || 0}</td>
        <td>
          <button class="btn-small" onclick="updateStock('${product.sku || product.id}', prompt('New stock quantity:', ${product.stock || 0}))">
            📝 Edit
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666;">No products found</td></tr>';
    }
  } catch (err) {
    console.error("❌ Error loading stock table:", err);
    showToast("❌ Failed to load products");
  }
}

async function updateStock(docId, qty) {
  if (isNaN(qty) || qty < 0) {
    showToast("⚠️ Invalid quantity entered.");
    return;
  }

  try {
    // 1️⃣ Update Stock collection (if exists)
    try {
      const stockRef = doc(db, "stock", docId);
      await updateDoc(stockRef, { availableQuantity: qty });
    } catch (e) {
      console.warn("Stock doc not found, skipping:", e);
    }

    // 2️⃣ Sync with Master List
    const snapshot = await getDoc(masterRef);
    const data = snapshot.data();
    const products = data?.products || [];

    const updatedProducts = products.map(p =>
      p.sku === docId || p.name === docId || p.id === docId 
        ? { ...p, stock: qty, availableQuantity: qty } 
        : p
    );

    await updateDoc(masterRef, { products: updatedProducts });

    showToast("✅ Stock updated and synced with Master List.");
    await renderStockTable(); // Refresh table
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}

// Auto-load table on page load
document.addEventListener("DOMContentLoaded", renderStockTable);

// Optional: Real-time updates (uncomment if needed)
// onSnapshot(masterRef, (doc) => {
//   if (doc.exists()) renderStockTable();
// });

// Expose updateStock globally for onclick handlers
window.updateStock = updateStock;
