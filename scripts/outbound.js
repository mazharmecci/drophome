// outbound.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("outboundForm");
  if (!form) {
    console.error("❌ outboundForm element not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data safely
    const data = {
      orderNumber: form.orderNumber.value.trim(),
      date: form.date.value,
      accountName: form.accountName.value.trim(),
      sku: form.sku.value.trim(),
      productName: form.productName.value.trim(),
      productPicture: form.productPicture.value.trim(),
      quantity: Number(form.quantity.value) || 0,
      labelLink: form.labelLink.value.trim(),
      totalLabels: Number(form.totalLabels.value) || 0,
      costPerLabel: Number(form.costPerLabel.value) || 0,
      totalUnits: Number(form.totalUnits.value) || 0,
      cost3PL: Number(form.cost3PL.value) || 0,
      orderStatus: form.orderStatus.value,
      comments: form.comments.value.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Save to Firestore
      await db.collection("outboundOrders").add(data);

      // Audit log if available
      if (typeof window.logAudit === "function") {
        window.logAudit("outbound_submitted", { orderNumber: data.orderNumber, status: data.orderStatus });
      }

      alert("✅ Outbound order submitted successfully!");
      form.reset();
    } catch (error) {
      console.error("❌ Error submitting outbound order:", error);
      alert("Failed to submit outbound order. Please try again.");
    }
  });
});
