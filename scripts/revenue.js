import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   Helpers
   ========================== */

// Safe USD formatter
function formatUSD(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Extract MM from a YYYY-MM-DD or DD-MM-YYYY string
function extractMonth(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return "";
  const parts = dateStr.split("-");
  // supports both YYYY-MM-DD and DD-MM-YYYY
  return parts[0].length === 4 ? parts[1] : parts[1];
}

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

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.accountName) accountSet.add(data.accountName);
    });

    [...accountSet].sort().forEach((account) => {
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

  if (!tbody || !totalQtyCell || !totalLabelCostCell || !total3PLCostCell) {
    console.warn("Revenue summary elements not found in DOM");
    return;
  }

  const accountSelectEl = document.getElementById("filterAccount");
  const monthSelectEl = document.getElementById("filterMonth");
  const statusSelectEl = document.getElementById("filterStatus");

  const selectedAccountRaw = accountSelectEl?.value || "__all__";
  const selectedAccount = selectedAccountRaw.toLowerCase();
  const selectedMonth = monthSelectEl?.value || "";
  const selectedStatus = statusSelectEl?.value || "OrderCompleted";

  tbody.innerHTML = "";
  let totalQty = 0;
  let totalLabel = 0;
  let total3PL = 0;
  let matchCount = 0;

  try {
    const snapshot = await getDocs(collection(db, "inventory"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const {
        accountName = "Unknown",
        productName = "-",
        date = "",
        quantity = 0,
        status = "",
        labelcost = 0,
        labelqty = 0,
        threePLcost = 0,
      } = data;

      // Status filter
      if (selectedStatus !== "__all__" && status !== selectedStatus) return;

      const monthStr = extractMonth(date);
      const isAllAccounts = selectedAccountRaw === "__all__";
      const matchAccount =
        isAllAccounts || accountName.toLowerCase() === selectedAccount;
      const matchMonth = !selectedMonth || monthStr === selectedMonth;

      if (!matchAccount || !matchMonth) return;

      matchCount++;

      tbody.insertAdjacentHTML(
        "beforeend",
        `
          <tr>
            <td>${accountName}</td>
            <td>${productName}</td>
            <td>${date}</td>
            <td>${quantity}</td>
            <td>${formatUSD(labelcost)}</td>
            <td>${labelqty}</td>
            <td>${formatUSD(threePLcost)}</td>
          </tr>
        `
      );

      totalQty += Number(quantity) || 0;
      totalLabel += Number(labelcost) || 0;
      total3PL += Number(threePLcost) || 0;
    });

    totalQtyCell.textContent = totalQty;
    totalLabelCostCell.textContent = formatUSD(totalLabel);
    total3PLCostCell.textContent = formatUSD(total3PL);

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
