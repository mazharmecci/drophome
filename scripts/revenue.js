import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   REVENUE SUMMARY (ORDER COMPLETED)
   ========================== */

// 🔽 Load account dropdown from inventory
export async function loadAccountDropdown() {
  const dropdown = document.getElementById("filterAccount");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="__all__" selected>All accounts 👥</option>`;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const accountSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.AccountName) accountSet.add(data.AccountName);
    });

    [...accountSet].sort().forEach(account => {
      const opt = document.createElement("option");
      opt.value = account;
      opt.textContent = account;
      dropdown.appendChild(opt);
    });

    console.log("✅ Account dropdown loaded.");
  } catch (err) {
    console.error("❌ Error loading accounts:", err);
    showToast("❌ Failed to load accounts.");
  }
}

// 📊 Load revenue summary from inventory
export async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalQtyCell = document.getElementById("totalQtyCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  const selectedAccountRaw = document.getElementById("filterAccount")?.value || "__all__";
  const selectedAccount = selectedAccountRaw.toLowerCase();
  const selectedMonth = document.getElementById("filterMonth")?.value || "";

  if (!tbody || !totalQtyCell || !totalLabelCostCell || !total3PLCostCell) return;

  tbody.innerHTML = "";
  let totalQty = 0;
  let totalLabel = 0;
  let total3PL = 0;
  let matchCount = 0;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const {
        AccountName = "Unknown",
        ProductName = "-",
        Date = "",
        Quantity = 0,
        Status = "",
        LabelCost = 0,
        LabelQty = 0,
        threePLCost = 0
      } = data;

      // Only include completed orders
      if (Status !== "OrderCompleted") return;

      const isAllAccounts = selectedAccountRaw === "__all__";
      const matchAccount = isAllAccounts || AccountName.toLowerCase() === selectedAccount;

      const monthStr = Date?.split("-")[1] || "";
      const matchMonth = !selectedMonth || monthStr === selectedMonth;

      if (matchAccount && matchMonth) {
        matchCount++;

        tbody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${AccountName}</td>
            <td>${ProductName}</td>
            <td>${Date}</td>
            <td>${Quantity}</td>
            <td>₹${LabelCost}</td>
            <td>${LabelQty}</td>
            <td>₹${threePLCost}</td>
          </tr>
        `);

        totalQty += Quantity;
        totalLabel += parseFloat(LabelCost);
        total3PL += parseFloat(threePLCost);
      }
    });

    totalQtyCell.textContent = totalQty;
    totalLabelCostCell.textContent = `₹${totalLabel.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PL.toFixed(2)}`;

    if (matchCount === 0) {
      showToast("⚠️ No matching records found.");
    } else {
      console.log(`📊 Revenue summary loaded: ${matchCount} matched`);
    }
  } catch (err) {
    console.error("❌ Failed to load revenue summary:", err);
    showToast("❌ Failed to load revenue summary.");
  }
}

/* ==========================
   INIT (Scoped to Revenue Tab)
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadAccountDropdown();

  const accountSelect = document.getElementById("filterAccount");
  const monthSelect = document.getElementById("filterMonth");
  const resetBtn = document.getElementById("resetFiltersBtn");

  // Default month = current month
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  if (monthSelect) monthSelect.value = currentMonth;
  if (accountSelect) accountSelect.value = "__all__";

  await loadRevenueSummary();

  accountSelect?.addEventListener("change", loadRevenueSummary);
  monthSelect?.addEventListener("change", loadRevenueSummary);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (accountSelect) accountSelect.value = "__all__";
      if (monthSelect) {
        const now2 = new Date();
        monthSelect.value = String(now2.getMonth() + 1).padStart(2, "0");
      }
      loadRevenueSummary();
    });
  }
});
