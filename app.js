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
    password : process.env.RDS_PASSWORD || "Inc0rrecT123",
    database :process.env.RDS_DB_NAME || "postgres",
    port : process.env.RDS_PORT || 8080, // Check port under the properties and connection of the database you're using in pgadmin4
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

    let query = db('product').select('productname', 'price', 'producttype').orderBy('productname');
    
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

app.get('/checkout', (req, res) => {
    // Get the cart from the session or an empty array
    const cart = req.session.cart || [];

    res.render('checkout', { cart, cartLength: cart.length });
});

// Route to handle adding a product to the cart
app.post('/add-to-cart', (req, res) => {
    try {
        const { productId, productName, productPrice } = req.body;
    
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
          req.session.cart = [];
        }
    
        // Add product to cart
        const newItem = {
          id: productId,
          name: productName,
          price: productPrice
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
  const { first_name, last_name, email, address, city, state, zip, wrist_size } = req.body;  
  console.log(first_name, last_name, email, address, city, state, zip, wrist_size);
  res.redirect('/');
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
        res.render(path.join(__dirname, 'views', 'admin.ejs'));
    } else {
        res.redirect('/login');
    }
});

app.listen( port, () => console.log(`Server running on http://localhost:${port}`)); //tells us the port is listening
