document.getElementById("stockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    sku: form.sku.value,
    productName: form.productName.value,
    availableQuantity: Number(form.availableQuantity.value),
    location: form.location.value,
    lastUpdated: form.lastUpdated.value,
    reorderThreshold: Number(form.reorderThreshold.value),
    timestamp: new Date().toISOString()
  };

  try {
    await db.collection("stockAvailability").add(data);
    alert("Stock record submitted!");
    form.reset();
  } catch (err) {
    console.error("Error submitting stock record:", err);
    alert("Failed to submit stock record.");
  }
});
