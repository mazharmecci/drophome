fetch('drophome/meta.json')
  .then(response => response.json())
  .then(data => {
    console.log('Meta loaded:', data);
  })
  .catch(error => {
    console.error('Error loading meta.json:', error);
  });
