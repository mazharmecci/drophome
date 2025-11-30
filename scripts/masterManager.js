import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

// Modal confirmation helper
function showModal({ title, message, confirmText, cancelText }) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmBox");
    const modalTitle = document.getElementById("confirmTitle");
    const modalMessage = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYesBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    yesBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    modal.style.display = "flex";

    yesBtn.onclick = () => {
      modal.style.display = "none";
      resolve(true);
    };

    cancelBtn.onclick = () => {
      modal.style.display = "none";
      resolve(false);
    };
  });
}

// Load and render master list
async function loadMasterList() {
  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not initialized.");
      return;
    }

    const data = snapshot.data();
    renderList("accountList", data.accounts ?? [], "accounts");
    renderList("supplierList", data.suppliers ?? [], "suppliers");
    renderProductList(data.products ?? []); // special renderer for products
    renderList("locationList", data.locations ?? [], "locations");

    console.log("✅ Master list loaded:", {
      accounts: data.accounts?.length,
      suppliers: data.suppliers?.length,
      products: data.products?.length,
      locations: data.locations?.length
    });
  } catch (error) {
    console.error("Error loading master list:", error);
    showToast("❌ Failed to load master list.");
  }
}

// Render generic list items
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

// Render product list with SKU–Name pairs
function renderProductList(products = []) {
  const ul = document.getElementById("productList");
  if (!ul) return;

  ul.innerHTML = "";
  products.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.name} (${p.sku})`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "❌";
    removeBtn.setAttribute("aria-label", `Remove ${p.name}`);
    removeBtn.addEventListener("click", () => removeProduct(p));

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });
}

// Add new product (SKU + Name)
async function addProduct() {
  const skuInput = document.getElementById("newSKU");
  const nameInput = document.getElementById("newProductName");
  if (!skuInput || !nameInput) return;

  const sku = skuInput.value.trim();
  const name = nameInput.value.trim();
  if (!sku || !name) {
    showToast("⚠️ Please enter both SKU and Product Name.");
    return;
  }

  try {
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      await setDoc(docRef, {
        accounts: [],
        suppliers: [],
        products: [],
        locations: [],
      });
      showToast("✅ Master list initialized.");
    }

    const current = snapshot.data()?.products || [];
    if (current.some(p => p.sku === sku || p.name === name)) {
      showToast("⚠️ Product with same SKU or Name already exists.");
      return;
    }

    const updated = [...current, { sku, name }];
    await updateDoc(docRef, { products: updated });

    skuInput.value = "";
    nameInput.value = "";
    await loadMasterList();
    showToast(`✅ Product "${name}" (${sku}) added.`);
  } catch (error) {
    console.error("Error adding product:", error);
    showToast("❌ Failed to add product.");
  }
}

// Remove product with confirmation
async function removeProduct(product) {
  const confirmed = await showModal({
    title: "Confirm Removal",
    message: `Are you sure you want to remove "${product.name}" (${product.sku})?`,
    confirmText: "Yes, remove it",
    cancelText: "Cancel"
  });

  if (!confirmed) return;

  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      showToast("❌ Master list document not found.");
      return;
    }

    const current = snapshot.data()?.products || [];
    const updated = current.filter((p) => p.sku !== product.sku);

    await updateDoc(docRef, { products: updated });
    await loadMasterList();
    showToast(`✅ "${product.name}" removed.`);
  } catch (error) {
    console.error("Error removing product:", error);
    showToast("❌ Failed to remove product.");
  }
}

// Generic add item
async function addItem(field, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const newValue = input.value.trim();
  if (!newValue) {
    showToast("⚠️ Please enter a value.");
    return;
  }

  try {
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      await setDoc(docRef, {
        accounts: [],
        suppliers: [],
        products: [],
        locations: [],
      });
      showToast("✅ Master list initialized.");
    }

    const current = snapshot.data()[field] || [];
    if (current.includes(newValue)) {
      showToast("⚠️ Value already exists.");
      return;
    }

    const updated = [...current, newValue];
    await updateDoc(docRef, { [field]: updated });

    input.value = "";
    await loadMasterList();
    showToast(`✅ "${newValue}" added to ${field}.`);
  } catch (error) {
    console.error("Error adding item:", error);
    showToast("❌ Failed to add item.");
  }
}

// Clear UI only
function clearUIOnly() {
  ["accountList", "supplierList", "productList", "locationList"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  showToast("🧹 UI cleared — backend data untouched.");
}

// Navigate back
function goBack() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin");

  const originMap = {
    inbound: "forms/inbound.html",
    outbound: "forms/outbound.html",
    stock: "forms/stock.html",
  };

  const targetFile = origin && originMap[origin] ? originMap[origin] : "forms/inbound.html";
  window.location.href = `${targetFile}?updated=true`;
}

// Bind event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();

  const bindings = [
    { id: "addAccountBtn", handler: () => addItem("accounts", "newAccount") },
    { id: "addSupplierBtn", handler: () => addItem("suppliers", "newSupplier") },
    { id: "addProductBtn", handler: addProduct }, // special handler
    { id: "addLocationBtn", handler: () => addItem("locations", "newClient") },
    { id: "backToFormBtn", handler: goBack },
    { id: "clearUIBtn", handler: clearUIOnly }
  ];

  bindings.forEach(({ id, handler }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  });
});
