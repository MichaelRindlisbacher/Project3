const checkoutReady = document.getElementById('checkoutReady');

// checkout form button
const checkoutButton = document.getElementById('checkout-button');
  checkoutButton.addEventListener('click', () => {
    const checkoutFormContainer = document.getElementById('checkout-form-container');
    checkoutFormContainer.style.display = 'block';
  });

// Get all "Remove from Cart" buttons
const removeButtons = document.querySelectorAll('.remove-from-cart');

// Event listener for each "Remove from Cart" button
removeButtons.forEach(button => {
  button.addEventListener('click', function() {
    const productId = this.getAttribute('data-product-id');

    // Send a request to the server to remove the product from the cart
    fetch('/remove-from-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Product removed from cart:', data);
      // Update the cart display
      location.reload();
    })
    .catch(error => {
      console.error('Error removing from cart:', error);
    });
  });
});

function toggleCheckout(cartLength){
  console.log('toggleCheckout function called');
  if(cartLength == 0){
      checkoutReady.style.display = 'none';
  } else {
      checkoutReady.style.display = 'block';
      document.getElementById('cart-total').textContent = cartLength;
  }
}