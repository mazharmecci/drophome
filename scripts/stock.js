// /scripts/stock.js
import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

async function renderStockTable() {
  try {
    const snapshot = await getDoc(masterRef); // getDoc reads a single document in v9. [web:66]
    if (!snapshot.exists()) {
      console.warn("Master list document not found");
      const tbody = document.querySelector("#stockTable tbody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center;color:#666;">masterList document not found</td></tr>';
      }
      return;
    }

    const data = snapshot.data();
    const products = data?.products || [];
    const tbody = document.querySelector("#stockTable tbody");

    if (!tbody) return;
    tbody.innerHTML = ""; // Clear existing rows

    if (!products.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#666;">No products found</td></tr>';
      return;
    }

  products.forEach(product => {
    const sku = product.sku || product.id || "";
    const name = product.name || product.productName || "";
    const price = parseFloat(product.price || 0);
    const stockQty = product.stock ?? 0;
  
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sku}</td>
      <td>${name}</td>
      <td>$${price.toFixed(2)}</td>
      <td>${stockQty}</td>
      <td>
        <button
          type="button"
          class="btn-small"
          onclick="window.updateStockPrompt('${sku}', ${stockQty})"
        >
          📝 Edit
        </button>
        <button
          type="button"
          class="btn-small btn-danger"
          onclick="window.deleteStockItem('${sku}')"
        >
          🗑️ Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  } catch (err) {
    console.error("❌ Error loading stock table:", err);
    showToast("❌ Failed to load products.");
  }
}

async function updateStock(docId, qty) {
  if (isNaN(qty) || qty < 0) {
    showToast("⚠️ Invalid quantity entered.");
    return;
  }

  try {
    // 1️⃣ Optional: update stock/{docId} doc if it exists
    try {
      const stockRef = doc(db, "stock", docId);
      await updateDoc(stockRef, { availableQuantity: qty });
    } catch (e) {
      console.warn("Stock doc not found or cannot update, skipping:", e);
    }

    // 2️⃣ Update products[] inside masterList
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not found.");
      return;
    }

    const data = snapshot.data();
    const products = data?.products || [];

    const updatedProducts = products.map(p =>
      p.sku === docId || p.name === docId || p.id === docId
        ? { ...p, stock: qty, availableQuantity: qty }
        : p
    );

    await updateDoc(masterRef, { products: updatedProducts }); // updateDoc updates only the products field. [web:64]
    showToast("✅ Stock updated and synced with Master List.");
    await renderStockTable();
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}

async function deleteStockItem(docId) {
  const ok = confirm(
    `Are you sure you want to delete product "${docId}" from stock?`
  );
  if (!ok) return;

  try {
    // 1️⃣ Remove from masterList.products
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not found.");
      return;
    }

    const data = snapshot.data();
    const products = data?.products || [];

    const filteredProducts = products.filter(
      p => !(p.sku === docId || p.name === docId || p.id === docId)
    );

    await updateDoc(masterRef, { products: filteredProducts }); // Rewrites array without the deleted item. [web:44]

    // 2️⃣ Optional: delete stock/{docId} document
    try {
      const stockRef = doc(db, "stock", docId);
      await deleteDoc(stockRef); // deleteDoc removes the document entirely. [web:42][web:60]
    } catch (e) {
      console.warn("No stock doc to delete for", docId, e);
    }

    showToast("🗑️ Product removed from stock.");
    await renderStockTable();
  } catch (err) {
    console.error("❌ Error deleting stock item:", err);
    showToast("❌ Failed to delete product.");
  }
}

// Simple prompt wrapper for Edit button
function updateStockPrompt(sku, currentQty) {
  const val = prompt("New stock quantity:", currentQty);
  if (val === null) return;
  const num = Number(val);
  updateStock(sku, num);
}

// Auto-load table on page load
document.addEventListener("DOMContentLoaded", () => {
  renderStockTable();
});

// Expose functions globally for inline onclick in this module script. [web:49]
window.updateStockPrompt = updateStockPrompt;
window.deleteStockItem = deleteStockItem;
window.updateStock = updateStock; // optional for debugging
window.renderStockTable = renderStockTable;
