document.getElementById("inboundForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    inboundId: form.inboundId.value,
    dateReceived: form.dateReceived.value,
    supplierName: form.supplierName.value,
    sku: form.sku.value,
    productName: form.productName.value,
    quantityReceived: Number(form.quantityReceived.value),
    storageLocation: form.storageLocation.value,
    receivingNotes: form.receivingNotes.value,
    timestamp: new Date().toISOString()
  };

  try {
    await db.collection("inboundInventory").add(data);
    alert("Inbound record submitted!");
    form.reset();
  } catch (err) {
    console.error("Error submitting inbound record:", err);
    alert("Failed to submit inbound record.");
  }
});
