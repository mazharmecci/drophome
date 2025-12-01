document.getElementById('hamburgerBtn').addEventListener('click', function() {
  document.getElementById('navLinks').classList.toggle('active');
  document.getElementById('navOverlay').classList.toggle('active');
});

// Close on overlay click
document.getElementById('navOverlay').addEventListener('click', function() {
  document.getElementById('navLinks').classList.remove('active');
  this.classList.remove('active');
});
