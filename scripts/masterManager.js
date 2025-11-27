import { db } from './firebase.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { showPopup } from './popupHandler.js';

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

// Load master list data and render UI
async function loadMasterList() {
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return;

  const data = snapshot.data();
  renderList("supplierList", data.suppliers, "suppliers");
  renderList("productList", data.products, "products");
  renderList("locationList", data.locations, "locations");
}

// Render list items with remove buttons
function renderList(listId, items, fieldName) {
  const ul = document.getElementById(listId);
  ul.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.addEventListener("click", () => removeItem(fieldName, item));

    li.appendChild(removeBtn);
    ul.appendChild(li);
  });
}

// Add new item to master list
async function addItem(field, inputId) {
  const input = document.getElementById(inputId);
  const newValue = input.value.trim();
  if (!newValue) return;

  const snapshot = await getDoc(docRef);
  const current = snapshot.data()[field] || [];
  if (current.includes(newValue)) return;

  const updated = [...current, newValue];
  await updateDoc(docRef, { [field]: updated });
  input.value = "";

  // Redirect back to origin form
  redirectBack();
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

  const snapshot = await getDoc(docRef);
  const current = snapshot.data()[field] || [];
  const updated = current.filter(item => item !== value);
  await updateDoc(docRef, { [field]: updated });

  // Redirect back to origin form
  redirectBack();
}

// Redirect back to the form user came from
function redirectBack() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin") || "inbound"; // default inbound
  window.location.href = `${origin}.html?updated=true`;
}

// Bind event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();

  document.getElementById("addSupplierBtn")
    .addEventListener("click", () => addItem("suppliers", "newSupplier"));

  document.getElementById("addProductBtn")
    .addEventListener("click", () => addItem("products", "newProduct"));

  document.getElementById("addLocationBtn")
    .addEventListener("click", () => addItem("locations", "newLocation"));
});
