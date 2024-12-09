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

// Get all "Add to Cart" buttons
const addToCartButtons = document.querySelectorAll('.add-to-cart');

// Event listener for each "Add to Cart" button
addToCartButtons.forEach(button => {
button.addEventListener('click', function() {
    const productId = this.getAttribute('data-product-id');
    const productName = this.getAttribute('data-product-name');
    const productPrice = this.getAttribute('data-product-price');
    const productType = this.getAttribute('data-product-type');

    // Add product to cart (send to backend, save in session)
    fetch('/add-to-cart', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, productName, productPrice, productType }),
    })
    .then(response => {
    // Log the response to see if it's an HTML error page
    return response.text().then(text => {
        console.log(text);  // Log the raw response text
        return JSON.parse(text);  // Try to parse the JSON
    });
    })
    .then(data => {
    console.log('Product added to cart:', data);
    location.reload();
    })
    .catch(error => {
    console.error('Error adding to cart:', error);
    });
});
});