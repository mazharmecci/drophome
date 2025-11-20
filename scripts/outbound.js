document.getElementById("outboundForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    orderNumber: form.orderNumber.value,
    date: form.date.value,
    accountName: form.accountName.value,
    sku: form.sku.value,
    productName: form.productName.value,
    productPicture: form.productPicture.value,
    quantity: Number(form.quantity.value),
    labelLink: form.labelLink.value,
    totalLabels: Number(form.totalLabels.value),
    costPerLabel: Number(form.costPerLabel.value),
    totalUnits: Number(form.totalUnits.value),
    cost3PL: Number(form.cost3PL.value),
    orderStatus: form.orderStatus.value,
    comments: form.comments.value,
    timestamp: new Date().toISOString()
  };

  try {
    await db.collection("outboundOrders").add(data);
    alert("Order submitted successfully!");
    form.reset();
  } catch (err) {
    console.error("Error submitting order:", err);
    alert("Failed to submit order.");
  }
});
