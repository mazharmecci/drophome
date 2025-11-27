import { db } from './firebase.js';
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const docRef = doc(db, "masterList", "VwsEuQNJgfo5TXM6A0DA");

async function loadMasterList() {
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return;

  const data = snapshot.data();
  renderList("supplierList", data.suppliers, "suppliers");
  renderList("productList", data.products, "products");
  renderList("locationList", data.locations, "locations");
}

function renderList(listId, items, fieldName) {
  const ul = document.getElementById(listId);
  ul.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.onclick = () => removeItem(fieldName, item);
    li.appendChild(removeBtn);
    ul.appendChild(li);
  });
}

export async function addItem(field, inputId) {
  const input = document.getElementById(inputId);
  const newValue = input.value.trim();
  if (!newValue) return;

  const snapshot = await getDoc(docRef);
  const current = snapshot.data()[field] || [];
  if (current.includes(newValue)) return;

  const updated = [...current, newValue];
  await updateDoc(docRef, { [field]: updated });
  input.value = "";
  loadMasterList();
}

async function removeItem(field, value) {
  const snapshot = await getDoc(docRef);
  const current = snapshot.data()[field] || [];
  const updated = current.filter(item => item !== value);
  await updateDoc(docRef, { [field]: updated });
  loadMasterList();
}

document.addEventListener("DOMContentLoaded", loadMasterList);
