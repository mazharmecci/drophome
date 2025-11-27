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
    renderList("supplierList", data.suppliers, "suppliers");
    renderList("productList", data.products, "products");
    renderList("locationList", data.locations, "locations");
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
  if (!newValue) return;

  try {
    let snapshot = await getDoc(docRef);

    // Auto-create document if missing
    if (!snapshot.exists()) {
      await setDoc(docRef, {
        suppliers: [],
        products: [],
        locations: []
      });
      showToast("✅ Master list initialized.");
      snapshot = await getDoc(docRef);
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

// Optional: Manual back button logic
function goBack() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin") || "inbound";
  window.location.href = `${origin}.html?updated=true`;
}

// Bind event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();

  document.getElementById("addSupplierBtn")
    ?.addEventListener("click", () => addItem("suppliers", "newSupplier"));

  document.getElementById("addProductBtn")
    ?.addEventListener("click", () => addItem("products", "newProduct"));

  document.getElementById("addLocationBtn")
    ?.addEventListener("click", () => addItem("locations", "newLocation"));

  document.getElementById("backToFormBtn")
    ?.addEventListener("click", goBack); // optional manual return
});
