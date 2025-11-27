
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
