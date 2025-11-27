// scripts/idGenerator.js
import { db } from './firebase.js';

export async function generateId(prefix, collectionName, fieldId) {
  const field = document.getElementById(fieldId);
  field.readOnly = true;

  try {
    const snapshot = await db.collection(collectionName)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let nextId = 1;
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0].data()[`${collectionName}Id`];
      const match = lastDoc.match(/\d+$/);
      if (match) nextId = parseInt(match[0]) + 1;
    }

    field.value = `${prefix}-${String(nextId).padStart(3, '0')}`;
  } catch (err) {
    console.error("Error generating ID:", err);
    field.value = `${prefix}-001`; // fallback
  }
}
