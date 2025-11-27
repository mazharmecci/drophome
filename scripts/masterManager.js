import { db } from './firebase.js';
import { showToast, showPopup } from './popupHandler.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

// Load and render master list
async function loadMasterList() {
  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      showToast("⚠️ Master list not initialized.");
      return;
    }

    const data = snapshot.data();
    renderList("supplierList", data.suppliers ?? [], "suppliers");
    renderList("productList", data.products ?? [], "products");
    renderList("locationList", data.locations ?? [], "locations");
  } catch (error) {
    console.error("Error loading master list:", error);
    showToast("❌ Failed to load master list.");
  }
}

// Render list items with remove buttons
function renderList(listId, items = [], fieldName) {
  const ul = document.getElementById(listId);
  if (!ul) {
    console.warn(`Element with id "${listId}" not found.`);
    return;
  }

  ul.innerHTML = "";
  items.forEach(item => {
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

// Add new item to master list
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

    // Auto-create document if missing
    if (!snapshot.exists()) {
      await setDoc(docRef, {
        suppliers: [],
        products: [],
        locations: []
      });
      showToast("✅ Master list initialized.");
      // No need to re-fetch; we know the structure
      await updateDoc(docRef, { [field]: [newValue] });
      input.value = "";
      await loadMasterList();
      showToast(`✅ "${newValue}" added to ${field}.`);
      return;
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

// Remove item with confirmation
async function removeItem(field, value) {
  const confirmed = await showPopup({
    title: "Confirm Removal",
    message: `Are you sure you want to remove "${value}" from ${field}?`,
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

    const current = snapshot.data()[field] || [];
    const updated = current.filter(item => item !== value);

    await updateDoc(docRef, { [field]: updated });
    await loadMasterList();
    showToast(`✅ "${value}" removed from ${field}.`);
  } catch (error) {
    console.error("Error removing item:", error);
    showToast("❌ Failed to remove item.");
  }
}

// Clear entire field with confirmation
async function clearField(field) {
  const confirmed = await showPopup({
    title: "Clear All Items",
    message: `Are you sure you want to remove ALL items from ${field}? This cannot be undone.`,
    confirmText: "Yes, clear all",
    cancelText: "Cancel"
  });

  if (!confirmed) return;

  try {
    await updateDoc(docRef, { [field]: [] });
    await loadMasterList();
    showToast(`✅ All items cleared from ${field}.`);
  } catch (error) {
    console.error("Error clearing field:", error);
    showToast("❌ Failed to clear field.");
  }
}

// Clear UI only (does not touch backend)
function clearUIOnly() {
  document.getElementById("supplierList").innerHTML = "";
  document.getElementById("productList").innerHTML = "";
  document.getElementById("locationList").innerHTML = "";
  showToast("🧹 UI cleared — backend data untouched.");
}

// Navigate back to origin form
function goBack() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin");

  const originMap = {
    inbound: "inbound.html",
    outbound: "outbound.html",
    stock: "stock.html"
  };

  const targetFile = origin && originMap[origin] ? originMap[origin] : "inbound.html";
  window.location.href = `${targetFile}?updated=true`;
}

// Make clearUIOnly available globally for inline onclick
window.clearUIOnly = clearUIOnly;

// Bind event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();

  const bindings = [
    { id: "addSupplierBtn", handler: () => addItem("suppliers", "newSupplier") },
    { id: "addProductBtn", handler: () => addItem("products", "newProduct") },
    { id: "addLocationBtn", handler: () => addItem("locations", "newLocation") },
    { id: "removeAllSuppliersBtn", handler: () => clearField("suppliers") },
    { id: "removeAllProductsBtn", handler: () => clearField("products") },
    { id: "removeAllLocationsBtn", handler: () => clearField("locations") },
    { id: "backToFormBtn", handler: goBack }
  ];

  bindings.forEach(({ id, handler }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", handler);
    }
  });
});
