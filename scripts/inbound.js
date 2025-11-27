import { generateId } from './idGenerator.js';
import { db } from './firebase.js';

const form = document.getElementById('inboundForm');

// Generate ID on load
generateId('INB', 'inbound', 'inboundId');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    inboundId: document.getElementById('inboundId').value,
    dateReceived: document.getElementById('dateReceived').value,
    supplierName: document.getElementById('supplierName').value,
    sku: document.getElementById('sku').value,
    productName: document.getElementById('productName').value,
    quantityReceived: parseInt(document.getElementById('quantityReceived').value),
    storageLocation: document.getElementById('storageLocation').value,
    receivingNotes: document.getElementById('receivingNotes').value,
    timestamp: new Date()
  };

  await db.collection('inbound').add(data);

  // Refresh ID for next submission
  generateId('INB', 'inbound', 'inboundId');
});
