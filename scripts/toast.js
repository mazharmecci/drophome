export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add("visible"), 100);

  // Animate out
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
