import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/**
 * Generates a unique ID based on the latest document in a Firestore collection.
 * @param {string} prefix - Prefix for the ID (e.g., "INB", "OUT").
 * @param {string} collectionName - Firestore collection to scan.
 * @param {string} fieldId - DOM input field ID to populate.
 * @param {boolean} verbose - Optional: enable console logging.
 * @param {function} onComplete - Optional: callback after ID is set.
 */
export async function generateId(prefix, collectionName, fieldId, verbose = true, onComplete = null) {
  const field = document.getElementById(fieldId);
  if (!field) {
    console.warn(`⚠️ Field with ID "${fieldId}" not found.`);
    return;
  }

  field.readOnly = true;

  try {
    if (verbose) console.log(`🔍 Generating ID from collection: ${collectionName}`);

    const q = query(
      collection(db, collectionName),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (verbose) console.log(`📦 Documents found: ${snapshot.size}`);

    let nextId = 1;

    if (!snapshot.empty) {
      const lastDocData = snapshot.docs[0].data();
      if (verbose) console.log("🧾 Last document data:", lastDocData);

      const lastIdField = Object.keys(lastDocData).find(key =>
        key.toLowerCase().includes("id")
      );

      const lastIdValue = lastDocData[lastIdField];
      const match = lastIdValue?.match(/\d+$/);

      if (match) nextId = parseInt(match[0]) + 1;
    }

    const finalId = `${prefix}-${String(nextId).padStart(3, '0')}`;
    field.value = finalId;

    if (typeof onComplete === "function") {
      onComplete(finalId);
    }

  } catch (err) {
    console.error("❌ Error generating ID:", err);
    field.value = `${prefix}-001`; // fallback
  }
}
