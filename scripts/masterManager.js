import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

// ... keep helpers/rendering as before ...

async function addProduct() {
  const sku = document.getElementById("newSKU")?.value.trim();
  const name = document.getElementById("newProductName")?.value.trim();
  const priceRaw = document.getElementById("newProductPrice")?.value.trim();
  const stockRaw = document.getElementById("newProductStock")?.value.trim();

  const price = parseFloat(priceRaw);
  const stock = parseInt(stockRaw, 10);

  if (!sku || !name || isNaN(price) || isNaN(stock)) {
    showToast("⚠️ Please enter SKU, Product Name, Price, and Stock quantity.");
    return;
  }

  try {
    const data = await ensureMasterList();
    const current = data.products || [];

    if (current.some(p => p.sku === sku || p.name === name)) {
      showToast("⚠️ Product with same SKU or Name already exists.");
      return;
    }

    // 1️⃣ Update Master List
    await updateDoc(docRef, { products: [...current, { sku, name, price, stock }] });

    // 2️⃣ Also insert into Stock collection
    await addDoc(collection(db, "stock"), {
      sku,
      productName: name,
      price,
      availableQuantity: stock
    });

    // Clear inputs
    document.getElementById("newSKU").value = "";
    document.getElementById("newProductName").value = "";
    document.getElementById("newProductPrice").value = "";
    document.getElementById("newProductStock").value = "";

    await loadMasterList();
    showToast(`✅ Product "${name}" (${sku}) added at $${price.toFixed(2)} with stock ${stock}.`);
  } catch (error) {
    console.error("Error adding product:", error);
    showToast("❌ Failed to add product.");
  }
}
