import { db } from "./firebase.js";
import { showToast, showPopup } from "./popupHandler.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where
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

    console.log("✅ Master list loaded:", {
      suppliers: data.suppliers?.length,
      products: data.products?.length,
      locations: data.locations?.length
    });
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

    if (!snapshot.exists()) {
      await setDoc(docRef, {
        suppliers: [],
        products: [],
        locations: [],
      });
      showToast("✅ Master list initialized.");
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
    cancelText: "Cancel",
  });

  if (!confirmed) return;

  try {
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      showToast("❌ Master list document not found.");
      return;
    }

    const current = snapshot.data()[field] || [];
    const updated = current.filter((item) => item !== value);

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
    cancelText: "Cancel",
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
  ["supplierList", "productList", "locationList"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  showToast("🧹 UI cleared — backend data untouched.");
}

// Navigate back to origin form
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

// Summary helpers
async function computeInbound(product, location) {
  const q = query(
    collection(db, "inbound"),
    where("productName", "==", product),
    where("storageLocation", "==", location)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(doc => {
    total += parseInt(doc.data().quantityReceived || 0);
  });
  return total;
}

async function computeOutbound(product, location) {
  const q = query(
    collection(db, "outbound_orders"),
    where("productName", "==", product)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.storageLocation === location || !data.storageLocation) {
      total += parseInt(data.quantity || 0);
    }
  });
  return total;
}

async function loadSummary() {
  const summaryBody = document.getElementById('summaryBody');
  if (!summaryBody) {
    console.warn("⚠️ Summary table body not found.");
    return;
  }

  summaryBody.innerHTML = "";

  try {
    const snapshot = await getDoc(docRef);
    const { products, locations } = snapshot.data();

    for (const product of products) {
      for (const location of locations) {
        const inboundTotal = await computeInbound(product, location);
        const outboundTotal = await computeOutbound(product, location);
        const available = inboundTotal - outboundTotal;

        const row = `
          <tr>
            <td>${product}</td>
            <td>${location}</td>
            <td>${inboundTotal}</td>
            <td>${outboundTotal}</td>
            <td>${available >= 0 ? available : 0}</td>
          </tr>
        `;
        summaryBody.insertAdjacentHTML("beforeend", row);
      }
    }

    console.log("✅ Summary loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading summary:", err);
    showToast("❌ Failed to load summary.");
  }
}

// Bind event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();

  if (document.getElementById('summaryBody')) {
    loadSummary();
  }

  const bindings = [
    { id: "addSupplierBtn", handler: () => addItem("suppliers", "newSupplier") },
    { id: "addProductBtn", handler: () => addItem("products", "newProduct") },
    { id: "addLocationBtn", handler: () => addItem("locations", "newLocation") },
    { id: "removeAllSuppliersBtn", handler: () => clearField("suppliers") },
    { id: "removeAllProductsBtn", handler: () => clearField("products") },
    { id: "removeAllLocationsBtn", handler: () => clearField("locations") },
    { id: "backToFormBtn", handler: goBack },
  ];

  bindings.forEach(({ id, handler }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  });
});
