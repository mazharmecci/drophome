import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

async function renderStockTable() {
  try {
    const snapshot = await getDoc(masterRef);
    const tbody = document.querySelector("#stockTable tbody");
    if (!snapshot.exists() || !tbody) {
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;color:#666;">masterList document not found</td></tr>';
      }
      return;
    }

    const products = snapshot.data()?.products || [];
    tbody.innerHTML = "";

    if (!products.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#666;">No products found</td></tr>';
      return;
    }

    products.forEach(product => {
      const sku = product.sku || product.id || "";
      const name = product.name || product.productName || "";
      const price = parseFloat(product.price || 0);
      const stockQty = product.stock ?? 0;
      const prodPic = product.prodPic || "";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sku}</td>
        <td>${name}</td>
        <td>$${price.toFixed(2)}</td>
        <td>${stockQty}</td>
        <td>
          ${
            prodPic
              ? `<img src="${prodPic}" alt="Product Image"
                     style="width:50px;height:50px;object-fit:contain;border:1px solid #ccc;" />`
              : `<span style="color:#999;">No image</span>`
          }
        </td>
        <td>
          <div class="actions-cell">
            <button
              type="button"
              class="btn-small"
              onclick="window.updateStockPrompt('${sku}', ${stockQty}, '${prodPic}')"
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
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Error loading stock table:", err);
    showToast("❌ Failed to load products.");
  }
}

async function updateStock(docId, qty, newPic) {
  if (isNaN(qty) || qty < 0) {
    showToast("⚠️ Invalid quantity entered.");
    return;
  }

  try {
    // 1️⃣ Try to update stock/{docId}, but ignore missing doc
    try {
      const stockRef = doc(db, "stock", docId);
      await updateDoc(stockRef, {
        availableQuantity: qty,
        prodPic: newPic
      });
    } catch (e) {
      console.warn("ℹ️ Stock doc not found or failed to update (ignored):", e);
    }

    // 2️⃣ Update masterList.products[]
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not found.");
      return;
    }

    const products = snapshot.data()?.products || [];

    const updatedProducts = products.map(p =>
      p.sku === docId || p.name === docId || p.id === docId
        ? {
            ...p,
            stock: qty,
            availableQuantity: qty,
            prodPic: newPic
          }
        : p
    );

    await updateDoc(masterRef, { products: updatedProducts });

    // ✅ If we reach here, consider overall operation successful
    showToast("✅ Stock updated.");
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }

  await renderStockTable();
}

async function deleteStockItem(docId) {
  const ok = confirm(`Are you sure you want to delete product "${docId}" from stock?`);
  if (!ok) return;

  try {
    const snapshot = await getDoc(masterRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not found.");
      return;
    }

    const products = snapshot.data()?.products || [];
    const filteredProducts = products.filter(
      p => !(p.sku === docId || p.name === docId || p.id === docId)
    );

    await updateDoc(masterRef, { products: filteredProducts });

    try {
      const stockRef = doc(db, "stock", docId);
      await deleteDoc(stockRef);
    } catch (e) {
      console.warn("⚠️ No stock doc to delete for", docId, e);
    }

    showToast("🗑️ Product removed from stock.");
    await renderStockTable();
  } catch (err) {
    console.error("❌ Error deleting stock item:", err);
    showToast("❌ Failed to delete product.");
  }
}

// 📝 Prompt wrapper for Edit button
function updateStockPrompt(sku, currentQty, currentPic) {
  const val = prompt("New stock quantity:", currentQty);
  if (val === null) return;
  const num = Number(val);

  const newPic = prompt("New product picture URL:", currentPic) || currentPic;

  updateStock(sku, num, newPic);
}

// 🚀 Auto-load table
document.addEventListener("DOMContentLoaded", () => {
  renderStockTable();
});

// 🌐 Expose globally
window.updateStockPrompt = updateStockPrompt;
window.deleteStockItem = deleteStockItem;
window.updateStock = updateStock;
window.renderStockTable = renderStockTable;
