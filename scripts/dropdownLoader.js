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

    // Populate simple string arrays
    populateDropdown("clientName", data.clients ?? [], "client name");
    populateDropdown("accountName", data.accounts ?? [], "account name");   // ✅ NEW
    populateDropdown("dispatchLocation", data.locations ?? [], "dispatch location");

    // Populate products with auto-fill logic
    populateProductDropdown("productName", data.products ?? []);
  } catch (err) {
    console.error("❌ Error loading master list:", err);
  }
}

/**
 * Generic dropdown population for string arrays
 */
function populateDropdown(fieldId, options, placeholderLabel) {
  const select = document.getElementById(fieldId);
  if (!select) return;

  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = `Choose ${placeholderLabel}`;
  placeholder.hidden = true;
  select.appendChild(placeholder);

  options.forEach((value) => {
    if (!value) return;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

/**
 * Populate product dropdown and wire:
 * - SKU auto-fill
 * - Price auto-fill
 * - Product image preview from prodpic
 *
 * Expected product shape: { name, sku, price, prodpic }
 */
function populateProductDropdown(fieldId, products) {
  const select = document.getElementById(fieldId);
  const skuField = document.getElementById("sku");
  const priceField = document.getElementById("price");
  const prodpicPreview = document.getElementById("prodpicPreview");

  if (!select) return;

  // Build a fast lookup map keyed by product name
  const productMap = new Map();
  products.forEach((p) => {
    if (p && p.name) {
      productMap.set(p.name, p);
    }
  });

  // Options
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose product name";
  placeholder.hidden = true;
  select.appendChild(placeholder);

  products.forEach((p) => {
    if (!p || !p.name) return;
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  // Initial preview text
  if (prodpicPreview && !prodpicPreview.innerHTML.trim()) {
    prodpicPreview.textContent = "No image";
  }

  // Change handler
  select.addEventListener("change", () => {
    const selectedName = select.value;
    const product = productMap.get(selectedName);

    if (!product) {
      if (skuField) skuField.value = "";
      if (priceField) priceField.value = "";
      if (prodpicPreview) prodpicPreview.textContent = "No image";
      return;
    }

    // SKU auto-fill
    if (skuField) {
      skuField.value = product.sku ?? "";
    }

    // Price auto-fill
    if (priceField) {
      const price = product.price != null ? Number(product.price) : 0;
      priceField.value = Number.isFinite(price) ? price.toString() : "";
    }

    // Image preview
    if (prodpicPreview) {
      const imgUrl = product.prodpic || product.prodPic;
      if (imgUrl) {
        prodpicPreview.innerHTML = `
          <img src="${imgUrl}" alt="${product.name} preview" 
               style="max-width: 100%; max-height: 150px; object-fit: contain;">
        `;
      } else {
        prodpicPreview.textContent = "No image";
      }
    }
  });
}
