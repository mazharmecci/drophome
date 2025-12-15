// scripts/dropdownLoader.js
import { db } from "./firebase.js";
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

    // Populate client names
    populateDropdown("clientName", data.clients ?? [], "client name");

    // Populate product dropdown with name, and wire SKU/price auto-fill
    populateProductDropdown("productName", data.products ?? []);

    // Populate dispatch locations
    populateDropdown("dispatchLocation", data.locations ?? [], "dispatch location");
  } catch (err) {
    console.error("Error loading master list:", err);
  }
}

// Generic dropdown population for string arrays
function populateDropdown(fieldId, options, placeholderLabel) {
  const select = document.getElementById(fieldId);
  if (!select) return;
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = `Choose ${placeholderLabel}`;
  placeholder.hidden = true;
  select.appendChild(placeholder);

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

// Special handler for products (objects with { sku, name, price })
function populateProductDropdown(fieldId, products) {
  const select = document.getElementById(fieldId);
  const skuField = document.getElementById("sku");
  const priceField = document.getElementById("price");
  if (!select) return;

  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose product name";
  placeholder.hidden = true;
  select.appendChild(placeholder);

  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.name;
    option.textContent = p.name;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    const selectedName = select.value;
    const matched = products.find(p => p.name === selectedName);
    if (skuField) skuField.value = matched?.sku || "";
    if (priceField) {
      const price = matched?.price != null ? Number(matched.price) : 0;
      priceField.value = price ? price.toString() : "0";
    }
  });
}
