
export function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  const circle = document.querySelector(".checkmark-circle");
  const check = document.querySelector(".checkmark-check");

  popup.classList.remove("hidden");

  // Restart animation
  circle.style.animation = "none";
  check.style.animation = "none";
  void circle.offsetWidth;
  void check.offsetWidth;
  circle.style.animation = "";
  check.style.animation = "";
}

export function initPopupClose() {
  const closeBtn = document.getElementById("closePopup");
  closeBtn.addEventListener("click", () => {
    document.getElementById("successPopup").classList.add("hidden");
  });
}

export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("visible");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
