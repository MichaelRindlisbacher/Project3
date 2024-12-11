const express = require('express'); // summoned the express class
const session = require('express-session'); // imports the session class
const nodemailer = require('nodemailer'); // imports the nodemailer class

let app = express(); // creating the express object

let path = require('path'); // imports the path class/module

const port = process.env.PORT || 3001; //setting port number

app.set("view engine", 'ejs'); // tells the browser we ain't using html

app.set('views', path.join(__dirname, 'views')); // tells express where to look for views files

app.use( express.urlencoded( { extended: true})); // handles the form submission
// basically just allows express to read forms properly, which forms are submitted by the client

// Serve static files from the "public" directory
app.use(express.static('public'));

// Middleware to parse JSON request bodies
app.use(express.json());

// Use sessions to store the cart
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
  }));

  app.use((req, res, next) => {
    const cart = req.session.cart || [];
    res.locals.cartLength = cart.length;
    next();
  });

const db = require("knex") ({ // Setting up connection with pg database
    client : "pg",
    connection : {
    host : process.env.RDS_HOSTNAME || "localhost",
    user : process.env.RDS_USERNAME || "postgres",
    password : process.env.RDS_PASSWORD || "inc0rrecT123",
    database :process.env.RDS_DB_NAME || "braceletstore",
    port : process.env.RDS_PORT || 5432, // Check port under the properties and connection of the database you're using in pgadmin4
    ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
}
})

db.raw('SELECT 1').then(() => {
    console.log('Database connected successfully');
}).catch(err => {
    console.error('Database connection error:', err);
});

app.get('/', (req, res) => {
    res.render('index');
}); // when the user asks for the root directory of the website, the index page is rendered

app.get('/product', (req, res) => {
    let { producttype, price } = req.query;

    let query = db('product').select('productname', 'price', 'producttype', 'productid').orderBy('productname');
    
    if (producttype) {
        query = query.where('producttype', producttype);
    }

    if (price) {
        query = query.where('price', '<', price); // Filter by price under the selected amount
    }

    query.then(products => {
        // Get distinct product types for the filter dropdown
        db('product').distinct('producttype').then(types => {
            // Pass products and types to the template
            const noProductsFound = products.length === 0; // Flag to check if no products match the filter
            res.render('product', { 
                products, 
                types, 
                producttype, 
                price, 
                noProductsFound 
            });
        });
    }).catch(err => {
        console.error('Error fetching products:', err);
        res.status(500).send('Internal Server Error');
    });
});


app.get('/about', (req, res) => {
    res.render('about')
});

app.get('/viewProduct/:productid', (req, res) => {
  let id = req.params.productid;
  // Query the product by ID first
  db('product')
    .where('productid', id)
    .first()
    .then(product => {
      if (!product) {
        return res.status(404).send('product not found');
      }
      res.render('viewProduct', { product });
      })
    .catch(error => {
      console.error('Error fetching Character for viewing:', error);
      res.status(500).send('Internal Server Error');
    });
});


app.get('/checkout', (req, res) => {
    // Get the cart from the session or an empty array
    const cart = req.session.cart || [];

    res.render('checkout', { cart, cartLength: cart.length });
});

// Route to handle adding a product to the cart
app.post('/add-to-cart', (req, res) => {
    try {
        const { productId, productName, productPrice, productType } = req.body;
    
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
          req.session.cart = [];
        }
    
        // Add product to cart
        const newItem = {
          id: productId,
          name: productName,
          price: productPrice,
          type: productType
        };
    
        req.session.cart.push(newItem);
    
        res.json({ message: 'Product added to cart', cart: req.session.cart });
      } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
  });

app.post('/remove-from-cart', (req, res) => {
try {
    const { productId } = req.body;

    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
    req.session.cart = [];
    }

    // Find the index of the product in the cart
    const index = req.session.cart.findIndex(item => item.id === productId);

    // If the product is found, remove it from the cart
    if (index !== -1) {
    req.session.cart.splice(index, 1);
    }

    res.json({ message: 'Product removed from cart' });
} catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Internal Server Error' });
}
});

app.post('/checkout', (req, res) => {
  console.log('Checkout form submitted!');

  const orderData = [
    {
      custfirstname: req.body.first_name,
      custlastname: req.body.last_name,
      custemail: req.body.email,
      custstreet: req.body.address,
      custcity: req.body.city,
      custstate: req.body.state,
      custzip: req.body.zip,
      wristsize: req.body.wrist_size,
      quantity: req.body.quantity || 1
    }
  ];

  console.log('orderData:', orderData); 

  // db.raw('SELECT * FROM customer WHERE custemail = ??', [orderData.custemail])
  //   .then(customer => {
  //     if (customer.length > 0) {
  //       // Update existing customer record
  //       db.raw('SELECT * FROM customer WHERE custemail = ??', [orderData.custemail])
  //         .update({
  //           custfirstname: orderData.custfirstname,
  //           custlastname: orderData.custlastname,
  //           custstreet: orderData.custstreet,
  //           custcity: orderData.custcity,
  //           custstate: orderData.custstate,
  //           custzip: orderData.custzip,
  //           wristsize: orderData.wristsize
  //         })
  //         .then(() => {
  //           // Get the existing customer ID
  //           db.raw('SELECT * FROM customer WHERE custemail = ??', [orderData.custemail])
  //             .then(customer => {
  //               const customerId = customer[0].id;
  //               // Create a new order record
  //               db('orders')
  //                 .insert({
  //                   customerid: customerId,
  //                   orderdate: new Date()
  //                 })
  //                 .then(orderNumber => {
  //                   db('orderlineitem')
  //                     .insert({
  //                       ordernumber: orderNumber,
  //                       productid: orderData.productid,
  //                       quantity: orderData.quantity
  //                     })
  //                     .then(() => {
  //                       req.session.cart = [];
  //                       res.redirect('/confirmation');
  //                     })
  //                     .catch(error => {
  //                       console.error('Error creating order line item:', error);
  //                       res.status(500).json({ message: 'Error creating order line item' });
  //                     });
  //                 })
  //                 .catch(error => {
  //                   console.error('Error creating order:', error);
  //                   res.status(500).json({ message: 'Error creating order' });
  //                 });
  //             })
  //             .catch(error => {
  //               console.error('Error getting customer ID:', error);
  //               res.status(500).json({ message: 'Error getting customer ID' });
  //             });
  //         })
  //         .catch(error => {
  //           console.error('Error updating customer record:', error);
  //           res.status(500).json({ message: 'Error updating customer record' });
  //         });
  //     } else {
  //       // Create a new customer record
  //       db('customer')
  //         .insert({
  //           custfirstname: orderData.custfirstname,
  //           custlastname: orderData.custlastname,
  //           custemail: orderData.custemail,
  //           custstreet: orderData.custstreet,
  //           custcity: orderData.custcity,
  //           custstate: orderData.custstate,
  //           custzip: orderData.custzip,
  //           wristsize: orderData.wristsize
  //         })
  //         .then(customerId => {
  //           db('orders')
  //             .insert({
  //               customerid: customerId,
  //               orderdate: new Date()
  //             })
  //             .then(orderNumber => {
  //               db('orderlineitem')
  //                 .insert({
  //                   ordernumber: orderNumber,
  //                   productid: orderData.productid,
  //                   quantity: orderData.quantity
  //                 })
  //                 .then(() => {
  //                   req.session.cart = [];
  //                   res.redirect('/confirmation');
  //                 })
  //                 .catch(error => {
  //                   console.error('Error creating order line item:', error);
  //                   res.status(500).json({ message: 'Error creating order line item' });
  //                 });
  //             })
  //             .catch(error => {
  //               console.error('Error creating order:', error);
  //               res.status(500).json({ message: 'Error creating order' });
  //             });
  //         })
  //         .catch(error => {
  //           console.error('Error creating customer record:', error);
  //           res.status(500).json({ message: 'Error creating customer record' });
  //         });
  //     }
  //   })
  //   .catch(error => {
  //     console.error('Error getting customer:', error);
  //     res.status(500).json({ message: 'Error getting customer' });
  //   });
});

app.get('/confirmation', (req, res) => {
    res.render('confirmation')
});

app.get('/login', (req, res) => {
   res.render('login')
})

app.post('/login', async (req, res) => {
    console.log('Login form submitted!');
    const { username, password } = req.body;
  
    // Query your Postgres database to verify the credentials
    const results = await db('credentials').where({ username, password });
  
    if (results.length > 0) {
      // If the credentials are correct, redirect the user to the admin page
      req.session.isAdmin = true; // Set a session variable to indicate admin status
      res.redirect('/admin');
    } else {
      res.render('login', { error: 'Invalid credentials' });
    }
  });

app.get('/admin', (req, res) => {
    if (req.session.isAdmin) {
        
      db('product')
      .select(
        'productname',
        'producttype',
        'price',
        'productid',
      )
      .orderBy('productname')
      .then(products => {
        // Render the admin.ejs template and pass the data
        res.render(path.join(__dirname, 'views', 'admin.ejs'), {products});
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
      } else {
        res.redirect('/login');
    }
});

// get method that accesses and loads data to the product edit page
app.get('/editProduct/:productid', (req, res) => {
  let id = req.params.productid;
  // Query the product by ID first
  db('product')
    .where('productid', id)
    .first()
    .then(product => {
      if (!product) {
        return res.status(404).send('product not found');
      }
      res.render('editProduct', { product });
      })
    .catch(error => {
      console.error('Error fetching Character for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

// post method that posts changes from the product edit page to the database
app.post('/editProduct/:productid', (req, res) => {
  const id = req.params.productid;
  // Access each value directly from req.body
  const productname = req.body.productname;
  const producttype = req.body.producttype;
  const price = req.body.price;
  // Update the product in the database
  db('product')
    .where('productid', id)
    .update({
      productname: productname,
      producttype: producttype,
      price: price
    })
    .then(() => {
      res.redirect('/admin'); // Redirect to the list of products after saving
    })
    .catch(error => {
      console.error('Error updating product:', error);
      res.status(500).send('Internal Server Error');
    });
});

// post method that deletes a character
app.post('/deleteProduct/:productid', (req, res) => {
  const id = req.params.productid;
  db('product')
    .where('productid', id)
    .del() // Deletes the record with the specified ID
    .then(() => {
      res.redirect('/admin'); // Redirect to the Character list after deletion
    })
    .catch(error => {
      console.error('Error deleting product:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/product/:productid', (req, res) => {
  let id = req.params.productid;
  // Query the product by ID first
  db('product')
    .where('productid', id)
    .first()
    .then(product => {
      if (!product) {
        return res.status(404).send('product not found');
      }
      res.render('viewProduct', { product });
      })
    .catch(error => {
      console.error('Error fetching Character for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/addProduct', (req, res) => {
  res.render('addProduct');
});

// post method that posts the product from the add page to the database
app.post('/addProduct', (req, res) => {
  // Access each value directly from req.body
  const productname = req.body.productname;
  const producttype = req.body.producttype;
  const price = req.body.price;
  // add the product in the database
  db('product')
    .insert({
      productname: productname,
      producttype: producttype,
      price: price
    })
    .then(() => {
      res.redirect('/admin'); // Redirect to the list of products after saving
    })
    .catch(error => {
      console.error('Error adding product:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.listen( port, () => console.log(`Server running on http://localhost:${port}`)); //tells us the port is listening