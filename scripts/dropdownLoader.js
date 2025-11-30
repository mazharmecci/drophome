// scripts/dropdownLoader.js
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export async function loadDropdowns() {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const snapshot = await getDoc(masterRef);

    if (!snapshot.exists()) {
      console.warn("⚠️ Master list not found.");
      return;
    }

    const data = snapshot.data();

    // Populate simple lists
    populateDropdown("clientName", data.clients ?? []);
    populateDropdown("storageLocation", data.locations ?? []);

    // Populate product dropdown with name, and wire SKU auto-fill
    populateProductDropdown("productName", data.products ?? []);
  } catch (err) {
    console.error("Error loading master list:", err);
  }
}

// Generic dropdown population for string arrays
function populateDropdown(fieldId, options) {
  const select = document.getElementById(fieldId);
  if (!select) return;
  select.innerHTML = "";

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

// Special handler for products (objects with { sku, name })
function populateProductDropdown(fieldId, products) {
  const select = document.getElementById(fieldId);
  const skuField = document.getElementById("sku");
  if (!select) return;

  select.innerHTML = "";

  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.name;
    option.textContent = p.name;
    select.appendChild(option);
  });

  // Auto-fill SKU when product is selected
  select.addEventListener("change", () => {
    const selectedName = select.value;
    const matched = products.find(p => p.name === selectedName);
    if (skuField) {
      skuField.value = matched ? matched.sku : "";
    }
  });
}
