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
 * @param {string} prefix - Prefix for the ID (e.g., "INB", "IN").
 * @param {string} collectionName - Firestore collection to scan.
 * @param {string} fieldId - DOM input field ID to populate.
 * @param {boolean} verbose - Optional: enable console logging.
 */
export async function generateId(prefix, collectionName, fieldId, verbose = false) {
  if (verbose) console.log(`🔍 Generating ID from collection: ${collectionName}`);

  try {
    const q = query(
      collection(db, collectionName),
      orderBy("inboundId", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);

    let nextNumber = 1;

    if (!snapshot.empty) {
      const latestDoc = snapshot.docs[0].data();
      const latestId = latestDoc.inboundId || "";

      const match = latestId.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    const padded = String(nextNumber).padStart(3, "0");
    const newId = `${prefix}-${padded}`;

    const input = document.getElementById(fieldId);
    if (input) input.value = newId;

    if (verbose) {
      console.log(`📦 Documents found: ${snapshot.size}`);
      console.log(`✅ Generated ID: ${newId}`);
    }
  } catch (err) {
    console.error("❌ Error generating ID:", err);
  }
}
