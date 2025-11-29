import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Load account dropdown from masterList
async function loadAccountDropdown() {
  const dropdown = document.getElementById("filterAccount");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="" disabled selected>Choose account 👤</option>`;

  try {
    const masterRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");
    const masterSnap = await getDoc(masterRef);

    if (masterSnap.exists()) {
      const { accounts } = masterSnap.data();
      accounts.forEach(account => {
        const opt = document.createElement("option");
        opt.value = account;
        opt.textContent = account;
        dropdown.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("❌ Error loading accounts:", err);
  }
}

// Load revenue summary with filters
async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalProductsCell = document.getElementById("totalProductsCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  const selectedAccount = document.getElementById("filterAccount").value;
  const selectedMonth = document.getElementById("filterMonth").value;

  tbody.innerHTML = "";
  let totalProducts = 0;
  let totalLabel = 0;
  let total3PL = 0;

  try {
    const snapshot = await getDocs(collection(db, "revenue_summary"));
    snapshot.forEach(doc => {
      const { accountName, totalProducts: products, labelCost, threePLCost, timestamp } = doc.data();
      const month = timestamp ? new Date(timestamp).getMonth() + 1 : null;
      const monthStr = month ? String(month).padStart(2, "0") : null;

      const matchAccount = !selectedAccount || accountName === selectedAccount;
      const matchMonth = !selectedMonth || monthStr === selectedMonth;

      if (matchAccount && matchMonth) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td style="padding: 12px;">${accountName}</td>
          <td style="padding: 12px;">${products || 0}</td>
          <td style="padding: 12px;">₹${(labelCost || 0).toFixed(2)}</td>
          <td style="padding: 12px;">₹${(threePLCost || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(row);

        totalProducts += parseInt(products || 0);
        totalLabel += parseFloat(labelCost || 0);
        total3PL += parseFloat(threePLCost || 0);
      }
    });

    totalProductsCell.textContent = totalProducts;
    totalLabelCostCell.textContent = `₹${totalLabel.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PL.toFixed(2)}`;
  } catch (err) {
    console.error("❌ Failed to load revenue summary:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAccountDropdown();
  loadRevenueSummary();
  document.getElementById("filterAccount").addEventListener("change", loadRevenueSummary);
  document.getElementById("filterMonth").addEventListener("change", loadRevenueSummary);
});
