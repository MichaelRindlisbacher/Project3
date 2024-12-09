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

document.getElementById('checkout-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  const order = {
    "first-name": document.getElementById('first-name').value,
    "last-name": document.getElementById('last-name').value,
    email: document.getElementById('email').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    "wrist-size": document.getElementById('wrist-size').value,
    products: []
  };
  
  // Get the cart items and add them to the order
  const cartItems = document.querySelectorAll('.cart-item');
  cartItems.forEach(item => {
    const productId = item.querySelector('.remove-from-cart').getAttribute('data-product-id');
    const productPrice = item.querySelector('p:nth-child(3)').textContent.replace('$', '');
    order.products.push({ id: productId, price: productPrice });
  });

  // Now you can use the "order" object as needed
  console.log(order);

  // fetch('/orders', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(order)
  // })
  // .then(response => response.json())
  // .then(data => console.log(data))
  // .catch(error => console.error(error));
});