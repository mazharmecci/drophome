// scripts/idGenerator.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export async function generateId(prefix, collectionName, fieldId) {
  const field = document.getElementById(fieldId);
  field.readOnly = true;

  try {
    const q = query(
      collection(db, collectionName),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    let nextId = 1;
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data()[`${collectionName}Id`];
      const match = lastDoc?.match(/\d+$/);
      if (match) nextId = parseInt(match[0]) + 1;
    }

    field.value = `${prefix}-${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    console.error("Error generating ID:", err);
    field.value = `${prefix}-001`; // fallback
  }
}
