import { db } from "./firebase.js";
import { showToast } from "./popupHandler.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* ==========================
   REVENUE SUMMARY (ACCOUNT)
   ========================== */

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
    showToast("❌ Failed to load accounts.");
  }
}

// 📊 Load revenue summary with filters
async function loadRevenueSummary() {
  const tbody = document.getElementById("revenueSummaryBody");
  const totalProductsCell = document.getElementById("totalProductsCell");
  const totalLabelCostCell = document.getElementById("totalLabelCostCell");
  const total3PLCostCell = document.getElementById("total3PLCostCell");

  const selectedAccount = document.getElementById("filterAccount")?.value?.toLowerCase() || "";
  const selectedMonth = document.getElementById("filterMonth")?.value || "";

  console.log("🎛 Current filters:", { selectedAccount, selectedMonth });

  if (!tbody || !totalProductsCell || !totalLabelCostCell || !total3PLCostCell) {
    console.warn("⚠️ Missing table elements");
    return;
  }

  tbody.innerHTML = "";
  let totalProducts = 0;
  let totalLabel = 0;
  let total3PL = 0;
  let matchCount = 0;
  let skipCount = 0;

  try {
    const snapshot = await getDocs(collection(db, "revenue_summary"));

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const accountName = data.accountName || "Unknown";
      const products = parseInt(data.totalProducts || 0, 10);

      // Read both possible casings, prefer camelCase if present
      const labelCost = parseFloat(
        data.labelCost ?? data.labelcost ?? 0
      );
      const threePLCost = parseFloat(
        data.threePLCost ?? data.threePLcost ?? 0
      );

      const timestamp = data.timestamp;
      const convertedTs = timestamp ? timestamp.toDate() : null;
      const monthStr = convertedTs
        ? String(convertedTs.getMonth() + 1).padStart(2, "0")
        : null;

      const matchAccount =
        !selectedAccount || accountName.toLowerCase() === selectedAccount;

      // Allow records with no timestamp to pass when no month is selected
      const matchMonth =
        !selectedMonth || (monthStr ? monthStr === selectedMonth : true);

      console.log("🕒 Timestamp check:", {
        raw: timestamp,
        converted: convertedTs,
        monthStr
      });

      console.log("🔍 Filter vs Record:", {
        selectedAccount,
        selectedMonth,
        recordAccount: accountName,
        recordMonth: monthStr,
        matchAccount,
        matchMonth
      });

      if (matchAccount && matchMonth) {
        matchCount++;
        console.log("✅ MATCHED");

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
        skipCount++;
        console.log("⏭️ SKIPPED");
      }
    });

    totalProductsCell.textContent = totalProducts;
    totalLabelCostCell.textContent = `₹${totalLabel.toFixed(2)}`;
    total3PLCostCell.textContent = `₹${total3PL.toFixed(2)}`;

    if (matchCount === 0) {
      showToast("⚠️ No matching records found.");
      console.warn(`⚠️ No records matched filters. Skipped: ${skipCount}`);
    } else {
      console.log(`📊 Revenue summary loaded: ${matchCount} matched, ${skipCount} skipped`);
    }
  } catch (err) {
    console.error("❌ Failed to load revenue summary:", err);
    showToast("❌ Failed to load revenue summary.");
  }
}

/* ==========================
   INIT
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadAccountDropdown();

  const accountSelect = document.getElementById("filterAccount");
  const monthSelect = document.getElementById("filterMonth");

  // 1) Set month to current month (01–12)
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  if (monthSelect) {
    monthSelect.value = currentMonth;
  }

  // 2) Select first real account option (index 1)
  if (accountSelect && accountSelect.options.length > 1) {
    accountSelect.selectedIndex = 1;
  }

  // 3) Load summary with these defaults
  await loadRevenueSummary();

  // 4) Re-load when filters change
  accountSelect?.addEventListener("change", loadRevenueSummary);
  monthSelect?.addEventListener("change", loadRevenueSummary);
});
