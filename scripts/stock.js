// stock.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("stockForm");
  if (!form) {
    console.error("❌ stockForm element not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data safely
    const data = {
      sku: form.sku.value.trim(),
      productName: form.productName.value.trim(),
      availableQuantity: Number(form.availableQuantity.value) || 0,
      location: form.location.value.trim(),
      lastUpdated: form.lastUpdated.value,
      reorderThreshold: Number(form.reorderThreshold.value) || 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Save to Firestore
      await db.collection("stockAvailability").add(data);

      // Audit log if available
      if (typeof window.logAudit === "function") {
        window.logAudit("stock_submitted", { sku: data.sku, qty: data.availableQuantity });
      }

      alert("✅ Stock record submitted!");
      form.reset();
    } catch (error) {
      console.error("❌ Error submitting stock record:", error);
      alert("Failed to submit stock record. Please try again.");
    }
  });
});
