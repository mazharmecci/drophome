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
    console.log(`🔍 Generating ID from collection: ${collectionName}`);

    const q = query(
      collection(db, collectionName),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    console.log(`📦 Documents found: ${snapshot.size}`);

    let nextId = 1;

    if (!snapshot.empty) {
      const lastDocData = snapshot.docs[0].data();
      console.log("🧾 Last document data:", lastDocData);

      // Try to extract ID from known field
      const lastIdField = Object.keys(lastDocData).find(key =>
        key.toLowerCase().includes("id")
      );
      const lastIdValue = lastDocData[lastIdField];

      const match = lastIdValue?.match(/\d+$/);
      if (match) nextId = parseInt(match[0]) + 1;
    }

    field.value = `${prefix}-${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    console.error("❌ Error generating ID:", err);
    field.value = `${prefix}-001`; // fallback
  }
}
