// successPopup.js

// Show success popup with checkmark animation
export function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  const circle = document.querySelector(".checkmark-circle");
  const check = document.querySelector(".checkmark-check");

  if (!popup || !circle || !check) return;

  popup.classList.remove("hidden");

  // Restart animation
  circle.style.animation = "none";
  check.style.animation = "none";
  void circle.offsetWidth;
  void check.offsetWidth;
  circle.style.animation = "";
  check.style.animation = "";
}

// Initialize close button for success popup
export function initPopupClose() {
  const closeBtn = document.getElementById("closePopup");
  if (!closeBtn) return;

  closeBtn.addEventListener("click", () => {
    const popup = document.getElementById("successPopup");
    if (popup) popup.classList.add("hidden");
  });
}

// Generic confirm/cancel popup
export async function showPopup({ title, message, confirmText, cancelText }) {
  return new Promise(resolve => {
    const popup = document.createElement("div");
    popup.className = "popup-overlay";

    popup.innerHTML = `
      <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
        <h3 id="popup-title">${title}</h3>
        <p>${message}</p>
        <div class="popup-actions">
          <button type="button" class="popup-confirm">${confirmText}</button>
          <button type="button" class="popup-cancel">${cancelText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    const confirmBtn = popup.querySelector(".popup-confirm");
    const cancelBtn = popup.querySelector(".popup-cancel");

    const cleanup = result => {
      popup.remove();
      resolve(result);
    };

    confirmBtn.addEventListener("click", () => cleanup(true));
    cancelBtn.addEventListener("click", () => cleanup(false));
  });
}

// Accessible toast message
export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;

  document.body.appendChild(toast);

  // entrance
  setTimeout(() => toast.classList.add("visible"), 100);

  // exit
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
