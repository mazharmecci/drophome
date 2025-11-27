// scripts/idGenerator.js
export function generateId(prefix, collectionName, fieldId) {
  import('../scripts/firebaseInit.js').then(({ db }) => {
    const field = document.getElementById(fieldId);
    field.readOnly = true;

    // Fetch latest ID from Firestore
    db.collection(collectionName)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get()
      .then(snapshot => {
        let nextId = 1;
        if (!snapshot.empty) {
          const lastDoc = snapshot.docs[0].id;
          const match = lastDoc.match(/\d+$/);
          if (match) nextId = parseInt(match[0]) + 1;
        }
        field.value = `${prefix}-${String(nextId).padStart(3, '0')}`;
      });
  });
}
