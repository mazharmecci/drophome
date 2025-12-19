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

// ---------- Helpers ----------

async function ensureMasterList() {
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    await setDoc(docRef, {
      accounts: [],
      products: [],
      clients: [],
      locations: []
    });
    showToast("✅ Master list initialized.");
    return { accounts: [], products: [], clients: [], locations: [] };
  }
  return snapshot.data();
}

function showModal({ title, message, confirmText, cancelText }) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmBox");
    modal.querySelector("#confirmTitle").textContent = title;
    modal.querySelector("#confirmMessage").textContent = message;
    modal.querySelector("#confirmYesBtn").textContent = confirmText;
    modal.querySelector("#confirmCancelBtn").textContent = cancelText;

    modal.style.display = "flex";

    modal.querySelector("#confirmYesBtn").onclick = () => {
      modal.style.display = "none";
      resolve(true);
    };
    modal.querySelector("#confirmCancelBtn").onclick = () => {
      modal.style.display = "none";
      resolve(false);
    };
  });
}

// ---------- Rendering ----------

function renderList(listId, items = [], fieldName) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  ul.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "❌";
    removeBtn.setAttribute("aria-label", `Remove ${item}`);
    removeBtn.addEventListener("click", () => removeItem(fieldName, item));

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });
}

function renderProductList(products = []) {
  const ul = document.getElementById("productList");
  if (!ul) return;
  ul.innerHTML = "";

  products.forEach((p) => {
    const li = document.createElement("li");

    const priceDisplay =
      typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "$0.00";

    const stockDisplay =
      typeof p.stock === "number" ? ` — Stock: ${p.stock}` : "";

    const picDisplay = p.prodPic
      ? ` — <img src="${p.prodPic}" alt="Thumbnail" style="width:30px;height:30px;object-fit:contain;border:1px solid #ccc;margin-left:5px;" />`
      : "";

    li.innerHTML = `${p.name} (${p.sku}) — ${priceDisplay}${stockDisplay}${picDisplay}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "❌";
    removeBtn.setAttribute("aria-label", `Remove ${p.name}`);
    removeBtn.addEventListener("click", () => removeProduct(p));

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });
}

// ---------- CRUD Operations ----------

async function loadMasterList() {
  try {
    const data = await ensureMasterList();
    renderList("accountList", data.accounts, "accounts");
    renderProductList(data.products);
    renderList("clientList", data.clients, "clients");
    renderList("locationList", data.locations, "locations");
  } catch (error) {
    console.error("Error loading master list:", error);
    showToast("❌ Failed to load master list.");
  }
}

async function addItem(field, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const newValue = input.value.trim();
  if (!newValue) {
    showToast("⚠️ Please enter a value.");
    return;
  }

  try {
    const data = await ensureMasterList();
    const current = data[field] || [];

    if (current.includes(newValue)) {
      showToast("⚠️ Value already exists.");
      return;
    }

    await updateDoc(docRef, { [field]: [...current, newValue] });
    input.value = "";
    await loadMasterList();
    showToast(`✅ "${newValue}" added to ${field}.`);
  } catch (error) {
    console.error("Error adding item:", error);
    showToast("❌ Failed to add item.");
  }
}

async function addProduct() {
  const skuEl = document.getElementById("newSKU");
  const nameEl = document.getElementById("newProductName");
  const priceEl = document.getElementById("newProductPrice");
  const stockEl = document.getElementById("newProductStock");
  const picEl = document.getElementById("prodpic");
  const previewBox = document.getElementById("prodpicPreview");

  const sku = skuEl?.value.trim();
  const name = nameEl?.value.trim();
  const priceRaw = priceEl?.value.trim();
  const stockRaw = stockEl?.value.trim();
  const prodPic = picEl?.value.trim();

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

    const newProduct = { sku, name, price, stock, prodPic };

    // Step 1: Update Master List
    try {
      await updateDoc(docRef, { products: [...current, newProduct] });
    } catch (err) {
      console.error("❌ Error updating Master List:", err);
      showToast("❌ Failed to update Master List.");
      return;
    }

    // Step 2: Insert into Stock collection
    try {
      await addDoc(collection(db, "stock"), {
        sku,
        productName: name,
        price,
        availableQuantity: stock,
        prodPic
      });
    } catch (err) {
      console.warn("⚠️ Stock insert failed, but Master List was updated:", err);
      showToast("⚠️ Product added to Master List, but not synced to Stock.");
    }

    // Clear inputs
    [skuEl, nameEl, priceEl, stockEl, picEl].forEach(el => {
      if (el) el.value = "";
    });

    if (previewBox) previewBox.innerHTML = "";

    await loadMasterList();
    showToast(`✅ Product "${name}" (${sku}) added at $${price.toFixed(2)} with stock ${stock}.`);
  } catch (error) {
    console.error("Error adding product:", error);
    showToast("❌ Failed to add product.");
  }
}

async function removeProduct(product) {
  const confirmed = await showModal({
    title: "Confirm Removal",
    message: `Remove "${product.name}" (${product.sku})?`,
    confirmText: "Yes, remove it",
    cancelText: "Cancel"
  });
  if (!confirmed) return;

  try {
    const data = await ensureMasterList();
    const updated = data.products.filter((p) => p.sku !== product.sku);
    await updateDoc(docRef, { products: updated });
    await loadMasterList();
    showToast(`✅ "${product.name}" removed.`);
  } catch (error) {
    console.error("Error removing product:", error);
    showToast("❌ Failed to remove product.");
  }
}

async function removeItem(field, value) {
  const confirmed = await showModal({
    title: "Confirm Removal",
    message: `Remove "${value}" from ${field}?`,
    confirmText: "Yes, remove it",
    cancelText: "Cancel"
  });
  if (!confirmed) return;

  try {
    const data = await ensureMasterList();
    const updated = (data[field] || []).filter((item) => item !== value);
    await updateDoc(docRef, { [field]: updated });
    await loadMasterList();
    showToast(`✅ "${value}" removed from ${field}.`);
  } catch (error) {
    console.error("Error removing item:", error);
    showToast("❌ Failed to remove item.");
  }
}

// ---------- Misc ----------

function clearUIOnly() {
  ["accountList", "productList", "clientList", "locationList"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  showToast("🧹 UI cleared — backend data untouched.");
}

function goBack() {
  const originMap = {
    inbound: "forms/inbound.html",
    outbound: "forms/outbound.html",
    stock: "forms/stock.html"
  };
  const origin = new URLSearchParams(window.location.search).get("origin");
  const targetFile = originMap[origin] || "forms/inbound.html";
  window.location.href = `${targetFile}?updated=true`;
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Session check: redirect if not logged in
  if (!sessionStorage.getItem("drophome-auth")) {
    window.location.href = "/forms/login.html";
    return;
  }

  // Load master list data on page ready
  loadMasterList();

  // Bind buttons to their handlers
  const bindings = [
    { id: "addAccountBtn", handler: () => addItem("accounts", "newAccount") },
    { id: "addProductBtn", handler: addProduct },
    { id: "addClientBtn", handler: () => addItem("clients", "newClient") },
    { id: "addLocationBtn", handler: () => addItem("locations", "newLocation") },
    { id: "backToFormBtn", handler: goBack },
    { id: "clearUIBtn", handler: clearUIOnly }
  ];

  bindings.forEach(({ id, handler }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", handler);
    }
  });

  // Product Picture URL live preview
  const prodpicInput = document.getElementById("prodpic");
  const previewBox = document.getElementById("prodpicPreview");

  if (prodpicInput && previewBox) {
    prodpicInput.addEventListener("input", () => {
      const url = prodpicInput.value.trim();
      previewBox.innerHTML = url
        ? `<img src="${url}" alt="Product Preview"
               style="width:100%; height:100%; object-fit:contain;" />`
        : "";
    });
  }
});
