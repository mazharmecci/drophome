import { generateId } from './idGenerator.js';
generateId('INB', 'inbound', 'inboundId');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // ...submit logic...
  await db.collection('inbound').add({ /* data */ });
  generateId('INB', 'inbound', 'inboundId'); // refresh ID
});


