import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// 🔽 Load account dropdown from masterList
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
      console.log("✅ Account dropdown loaded:", accounts);
    } else {
      console.warn("⚠️ masterList document not found.");
    }
  } catch (err) {
    console.error("❌ Error loading accounts:", err);
  }
}

// 📊 Load revenue summary with filters
async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalProductsCell = document.getElementById("totalProductsCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  const selectedAccount = document.getElementById("filterAccount")?.value;
  const selectedMonth = document.getElementById("filterMonth")?.value;

  if (!tbody || !totalProductsCell || !totalLabelCostCell || !total3PLCostCell) {
    console.warn("⚠️ Missing table elements");
    return;
  }

  tbody.innerHTML = "";
  let totalProducts = 0;
  let totalLabel = 0;
  let total3PL = 0;

  try {
    const snapshot = await getDocs(collection(db, "revenue_summary"));
    let matchCount = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const accountName = data.accountName || "Unknown";
      const products = parseInt(data.totalProducts || 0);
      const labelCost = parseFloat(data.labelcost || 0);
      const threePLCost = parseFloat(data.threePLcost || 0);

      const timestamp = data.timestamp;
      const monthStr = timestamp
        ? String(new Date(timestamp.toDate()).getMonth() + 1).padStart(2, "0")
        : null;

      const matchAccount = !selectedAccount || accountName === selectedAccount;
      const matchMonth = !selectedMonth || monthStr === selectedMonth;

      if (matchAccount && matchMonth) {
        matchCount++;
        console.log("✅ Matched record:", {
          accountName,
          products,
          labelCost,
          threePLCost,
          monthStr
        });

        const row = document.createElement("tr");
        row.innerHTML = `
          <td style="padding: 12px;">${accountName}</td>
          <td style="padding: 12px;">${products}</td>
          <td style="padding: 12px;">₹${labelCost.toFixed(2)}</td>
          <td style="padding: 12px;">₹${threePLCost.toFixed(2)}</td>
        `;
        tbody.appendChild(row);

        totalProducts += products;
        totalLabel += labelCost;
        total3PL += threePLCost;
      } else {
        console.log("⏭️ Skipped record:", {
          accountName,
          monthStr,
          matchAccount,
          matchMonth
        });
      }
    });

    totalProductsCell.textContent = totalProducts;
    totalLabelCostCell.textContent = `₹${totalLabel.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PL.toFixed(2)}`;

    console.log(`📊 Summary loaded: ${matchCount} matched records`);
  } catch (err) {
    console.error("❌ Failed to load revenue summary:", err);
  }
}

// 🚀 Init
document.addEventListener("DOMContentLoaded", () => {
  loadAccountDropdown();
  loadRevenueSummary();

  document.getElementById("filterAccount")?.addEventListener("change", loadRevenueSummary);
  document.getElementById("filterMonth")?.addEventListener("change", loadRevenueSummary);
});
