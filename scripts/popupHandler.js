
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

export async function showPopup({ title, message, confirmText, cancelText }) {
  return new Promise(resolve => {
    const popup = document.createElement("div");
    popup.className = "popup-overlay";

    popup.innerHTML = `
      <div class="popup-content">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="popup-actions">
          <button id="confirmBtn">${confirmText}</button>
          <button id="cancelBtn">${cancelText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("confirmBtn").addEventListener("click", () => {
      popup.remove();
      resolve(true);
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      popup.remove();
      resolve(false);
    });
  });
}

export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("visible"), 100);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
