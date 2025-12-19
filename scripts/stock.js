import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

async function updateStock(docId, qty) {
  if (isNaN(qty) || qty < 0) {
    showToast("⚠️ Invalid quantity entered.");
    return;
  }

  try {
    // 1️⃣ Update Stock collection
    const stockRef = doc(db, "stock", docId);
    await updateDoc(stockRef, { availableQuantity: qty });

    // 2️⃣ Sync with Master List
    const snapshot = await getDoc(masterRef);
    const data = snapshot.data();
    const products = data?.products || [];

    const updatedProducts = products.map(p =>
      p.sku === docId || p.name === docId ? { ...p, stock: qty } : p
    );

    await updateDoc(masterRef, { products: updatedProducts });

    showToast("✅ Stock updated and synced with Master List.");
    await renderStockTable();
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    showToast("❌ Failed to update stock.");
  }
}
