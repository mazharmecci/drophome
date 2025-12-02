import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   REVENUE SUMMARY
   ========================== */

export async function loadAccountDropdown() {
  const dropdown = document.getElementById("filterAccount");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="__all__" selected>All accounts 👤</option>`;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const accountSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("👤 Inventory record:", data);
      if (data.accountName) accountSet.add(data.accountName);
    });

    [...accountSet].sort().forEach(account => {
      const opt = document.createElement("option");
      opt.value = account;
      opt.textContent = account;
      dropdown.appendChild(opt);
    });

    console.log("✅ Account filter loaded with:", [...accountSet]);
  } catch (err) {
    console.error("❌ Error loading accounts:", err);
    showToast("❌ Failed to load accounts.");
  }
}

export async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalQtyCell = document.getElementById("totalQtyCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  const selectedAccountRaw = document.getElementById("filterAccount")?.value || "__all__";
  const selectedAccount = selectedAccountRaw.toLowerCase();
  const selectedMonth = document.getElementById("filterMonth")?.value || "";
  const selectedStatus = document.getElementById("filterStatus")?.value || "OrderCompleted";

  if (!tbody) return;

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
        accountName = "Unknown",
        productName = "-",
        date = "",
        quantity = 0,
        status = "",
        labelcost = 0,
        labelqty = 0,
        threePLcost = 0
      } = data;

      if (selectedStatus !== "__all__" && status !== selectedStatus) return;

      let monthStr = "";
      if (date.includes("-")) {
        const parts = date.split("-");
        monthStr = parts[0].length === 4 ? parts[1] : parts[1];
      }

      const isAllAccounts = selectedAccountRaw === "__all__";
      const matchAccount = isAllAccounts || accountName.toLowerCase() === selectedAccount;
      const matchMonth = !selectedMonth || monthStr === selectedMonth;

      if (matchAccount && matchMonth) {
        matchCount++;

        const displayStatus = status.replace(/([a-z])([A-Z])/g, "$1 $2");

        tbody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${accountName}</td>
            <td>${productName}</td>
            <td>${date}</td>
            <td>${quantity}</td>
            <td>₹${labelcost}</td>
            <td>${labelqty}</td>
            <td>₹${threePLcost}</td>
          </tr>
        `);

        totalQty += quantity;
        totalLabel += parseFloat(labelcost);
        total3PL += parseFloat(threePLcost);
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

document.addEventListener("DOMContentLoaded", async () => {
  await loadAccountDropdown();

  const accountSelect = document.getElementById("filterAccount");
  const monthSelect = document.getElementById("filterMonth");
  const statusSelect = document.getElementById("filterStatus");

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  if (monthSelect) monthSelect.value = currentMonth;
  if (accountSelect) accountSelect.value = "__all__";
  if (statusSelect) statusSelect.value = "OrderCompleted";

  await loadRevenueSummary();

  accountSelect?.addEventListener("change", loadRevenueSummary);
  monthSelect?.addEventListener("change", loadRevenueSummary);
  statusSelect?.addEventListener("change", loadRevenueSummary);
});
