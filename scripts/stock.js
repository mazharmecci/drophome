import { db } from './firebase.js';
import { showToast } from './popupHandler.js';
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductDropdown();
  await renderStockCards();

  const selector = document.getElementById("productName");
  if (selector) {
    selector.addEventListener("change", async () => {
      await renderStockCards();
      await computeSelectedStock();
    });
  }
});

// 🔄 Load product dropdown with "All Products"
async function loadProductDropdown() {
  const selector = document.getElementById("productName");
  if (!selector) return;

  const snapshot = await getDocs(collection(db, "stock"));
  const uniqueNames = new Set();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName) uniqueNames.add(data.productName);
  });

  selector.innerHTML = `<option value="__ALL__">All Products</option>`;
  [...uniqueNames].forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selector.appendChild(opt);
  });
}

// 🧾 Render stock cards
async function renderStockCards() {
  const selected = document.getElementById("productName")?.value;
  const container = document.getElementById("stockCardsContainer");
  if (!container) return;

  container.innerHTML = "";

  const stockSnapshot = await getDocs(collection(db, "stock"));
  const inboundSnapshot = await getDocs(collection(db, "inbound"));

  const imageMap = {};
  inboundSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.productName && data.prodpic) {
      imageMap[data.productName] = data.prodpic;
    }
  });

  stockSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.productName || data.availableQuantity == null) return;
    if (selected !== "__ALL__" && data.productName !== selected) return;

    const card = document.createElement("div");
    card.className = "card inbound-card";
    card.innerHTML = `
      <img src="${imageMap[data.productName] || '../images/placeholder.png'}" alt="Product" style="max-width:100px; margin-bottom:10px;" />
      <h2>${data.productName}</h2>
      <p>Available Quantity: <strong>${data.availableQuantity}</strong></p>
    `;
    container.appendChild(card);
  });
}

// 📊 Compute stock for selected product only
async function computeSelectedStock() {
  const selected = document.getElementById("productName")?.value;
  const qtyField = document.getElementById("availableQuantity");
  if (!selected || selected === "__ALL__" || !qtyField) {
    qtyField.value = "";
    return;
  }

  try {
    const inboundQuery = query(collection(db, "inbound"), where("productName", "==", selected));
    const outboundQuery = query(collection(db, "outbound_orders"), where("productName", "==", selected));

    const [inboundSnap, outboundSnap] = await Promise.all([
      getDocs(inboundQuery),
      getDocs(outboundQuery)
    ]);

    let inboundTotal = 0;
    inboundSnap.forEach(doc => {
      inboundTotal += parseInt(doc.data().quantityReceived || 0);
    });

    let outboundTotal = 0;
    outboundSnap.forEach(doc => {
      outboundTotal += parseInt(doc.data().quantity || 0);
    });

    const balance = inboundTotal - outboundTotal;
    qtyField.value = balance >= 0 ? balance : 0;
  } catch (err) {
    console.error("❌ Error computing stock:", err);
    showToast("❌ Failed to compute stock.");
  }
}
