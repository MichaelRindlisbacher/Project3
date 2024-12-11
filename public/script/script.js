document.getElementById('producttype').addEventListener('change', function() {
    const producttype = this.value;
    const price = document.getElementById('price').value;
    window.location.href = `/product?producttype=${producttype}&price=${price}`;
});

document.getElementById('price').addEventListener('change', function() {
    const price = this.value;
    const producttype = document.getElementById('producttype').value;
    window.location.href = `/product?producttype=${producttype}&price=${price}`;
});

// Get the parent element that contains the "Add to Cart" buttons
const productContainer = document.querySelector('.product-container');

// Attach a delegated event listener to the parent element
productContainer.addEventListener('click', function(event) {
  // Check if the event was triggered by an "Add to Cart" button
  if (event.target.classList.contains('add-to-cart')) {
    const productId = event.target.getAttribute('data-product-id');
    const productName = event.target.getAttribute('data-product-name');
    const productPrice = event.target.getAttribute('data-product-price');
    const productType = event.target.getAttribute('data-product-type');

    // Add product to cart (send to backend, save in session)
    fetch('/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, productName, productPrice, productType }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error adding to cart');
        }
        return response.json();
      })
      .then(data => {
        console.log('Product added to cart:', data);
        location.reload();
        alert('Product added to cart!');
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
      });
  }
});