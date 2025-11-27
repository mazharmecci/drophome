import { generateId } from './idGenerator.js';
import { db } from './firebase.js';

const form = document.getElementById('outboundForm');
generateId('ORD', 'outbound', 'orderId');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    orderId: document.getElementById('orderId').value,
    date: document.getElementById('date').value,
    accountName: document.getElementById('accountName').value,
    sku: document.getElementById('sku').value,
    productName: document.getElementById('productName').value,
    quantity: parseInt(document.getElementById('quantity').value),
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    timestamp: new Date()
  };

  await db.collection('outbound').add(data);
  generateId('ORD', 'outbound', 'orderId'); // refresh for next entry
});
