import { db } from "../scripts/firebase.js";
import { showToast } from "../scripts/popupHandler.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ---------- Render Shipping Table ----------

async function renderShippingTable() {
  const tbody = document.getElementById("inboundTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "inventory"));
    const filters = getFilters();

    const filtered = snapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      return (
        (!filters.location || data.dispatchLocation === filters.location) &&
        (!filters.client || data.accountName?.toLowerCase().includes(filters.client.toLowerCase())) &&
        (!filters.status || data.status === filters.status) &&
        (!filters.start || new Date(data.date) >= filters.start) &&
        (!filters.end || new Date(data.date) <= filters.end)
      );
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="17" style="text-align:center;color:#666;">No matching records found</td></tr>`;
      return;
    }

    filtered.forEach(docSnap => {
      const data = docSnap.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${data.orderId}</td>
        <td>${data.date || ""}</td>
        <td>${data.deliveredDate || ""}</td>
        <td>${data.accountName || ""}</td>
        <td>${data.dispatchLocation || ""}</td>
        <td>${data.productName || ""}</td>
        <td>${data.sku || ""}</td>
        <td>
          ${data.prodpic ? `<img src="${data.prodpic}" style="width:50px;height:50px;object-fit:contain;" />` : `<span style="color:#999;">No image</span>`}
        </td>
        <td>
          ${data.labellink ? `<a href="${data.labellink}" target="_blank">Label</a>` : `<span style="color:#999;">—</span>`}
        </td>
        <td>$${(data.price || 0).toFixed(2)}</td>
        <td>${data.quantity || 0}</td>
        <td>${data.tax || ""}</td>
        <td>${data.shipping || ""}</td>
        <td>${data.subtotal || ""}</td>
        <td>${data.trackingNumber || ""}</td>
        <td>
          <select onchange="updateShippingStatus('${docSnap.id}', this.value)">
            ${renderStatusOptions(data.status)}
          </select>
        </td>
        <td>
          <button class="btn-small" onclick="showToast('✅ Saved successfully.')">Save</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Error loading shipping table:", err);
    showToast("❌ Failed to load shipping records.");
  }
}

// ---------- Status Dropdown ----------

function renderStatusOptions(current) {
  const statuses = [
    "OrderPending",
    "OrderDelivered",
    "OrderCompleted",
    "CancelCompleted",
    "Refunded",
    "Shipped",
    "LabelsPrinted"
  ];
  return statuses
    .map(status => `<option value="${status}" ${status === current ? "selected" : ""}>${status}</option>`)
    .join("");
}

// ---------- Update Status ----------

async function updateShippingStatus(docId, newStatus) {
  try {
    const ref = doc(db, "inventory", docId);
    await updateDoc(ref, { status: newStatus });
    showToast("✅ Status updated.");
  } catch (err) {
    console.error("❌ Error updating status:", err);
    showToast("❌ Failed to update status.");
  }
}

// ---------- Filters ----------

function getFilters() {
  return {
    location: document.getElementById("filterLocation")?.value || "",
    client: document.getElementById("filterClient")?.value || "",
    status: document.getElementById("filterStatus")?.value || "",
    start: parseDate(document.getElementById("filterStart")?.value),
    end: parseDate(document.getElementById("filterEnd")?.value)
  };
}

function parseDate(val) {
  return val ? new Date(val) : null;
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("drophome-auth")) {
    window.location.href = "/forms/login.html";
    return;
  }

  renderShippingTable();

  document.getElementById("applyFilters")?.addEventListener("click", renderShippingTable);
  document.getElementById("clearFilters")?.addEventListener("click", () => {
    ["filterLocation", "filterClient", "filterStart", "filterEnd", "filterStatus"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderShippingTable();
  });
});

// Expose globally
window.updateShippingStatus = updateShippingStatus;
