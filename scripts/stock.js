import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  deleteDoc
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
      const sku = product.sku || product.id || "";
      const name = product.name || product.productName || "";
      const price = parseFloat(product.price || 0);
      const stockQty = product.stock || product.availableQuantity || 0;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sku}</td>
        <td>${name}</td>
        <td>$${price.toFixed(2)}</td>
        <td>${stockQty}</td>
        <td>
          <button
            class="btn-small"
            onclick="updateStock('${sku}', prompt('New stock quantity:', ${stockQty}))"
          >
            📝 Edit
          </button>
          <button
            class="btn-small btn-danger"
            onclick="deleteStockItem('${sku}')"
          >
            🗑️ Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#666;">No products found</td></tr>';
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

    await updateDoc(masterRef, { products: updatedProducts }); // updateDoc updates just this field. [web:47]

    showToast("✅ Stock updated and synced with Master List.");
    await renderStockTable(); // Refresh table
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}

async function deleteStockItem(docId) {
  const confirmDelete = confirm(
    `Are you sure you want to delete product "${docId}" from stock?`
  );
  if (!confirmDelete) return;

  try {
    // 1️⃣ Remove from masterList.products (filter out matching sku/name/id)
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

    await updateDoc(masterRef, { products: filteredProducts }); // Rewrites array without the removed item. [web:39][web:45]

    // 2️⃣ (Optional) delete matching doc in stock collection
    try {
      const stockRef = doc(db, "stock", docId);
      await deleteDoc(stockRef); // deleteDoc removes a document completely. [web:42]
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

// Auto-load table on page load
document.addEventListener("DOMContentLoaded", renderStockTable);

// Optional: Real-time updates (uncomment if needed)
// onSnapshot(masterRef, (doc) => {
//   if (doc.exists()) renderStockTable();
// });

// Expose functions globally for onclick handlers
window.updateStock = updateStock;
window.deleteStockItem = deleteStockItem;
