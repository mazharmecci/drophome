// scripts/dropdownLoader.js
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export async function loadDropdowns() {
  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const snapshot = await getDoc(masterRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      populateDropdown("supplierName", data.suppliers);
      populateDropdown("productName", data.products);
      populateDropdown("storageLocation", data.locations);
    }
  } catch (err) {
    console.error("Error loading master list:", err);
  }
}

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
