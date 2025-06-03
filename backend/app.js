const express = require('express')
const dotenv = require('dotenv').config()
const conn = require('./DBConnection')


const PORT = process.env.PORT || 5000

const app = express()
app.use(express.json());

app.get('/', (req,res)=>{
  conn.query('SELECT * FROM RND', (err, results)=>{
    if(err){
      res.json({message: 'Databse Error'})
    }

    res.json(results)
  })
})

app.get('/name', (req,res)=>{
  conn.query('SELECT * FROM RND WHERE ID = 1', (err, results)=>{
    if(err){
      res.json({message: 'Databse Error'})
    }

    res.json(results)
  })
})


//----------------------------- Admin Portal DB Queries------------------------

//Fetch the Remaining Fuel Stock From the DATABASE
app.get('/fuel_stock/remaining_fuel', async (req, res) => {
  try {
    const [results] = await conn.query('SELECT SUM(remaining_fuel) AS Remaining_fuel FROM fuel_stock;');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database Error' });
  }
});

//Insert the Fuel Stock Into the DATABASE
app.post('/fuel_stock/insert', async (req, res) => {

  
  const {
    vendor_id, fuel_id, quantity, cost_per_litre,
    total_cost, purchase_date, created_by, created_at,
    remaining_fuel, fuel_sales 
  } = req.body;

  console.log('Received data for fuel stock insert:', req.body);
    console.log('Values array:', [
        vendor_id, fuel_id, quantity, cost_per_litre,
        total_cost, purchase_date, created_by, created_at,
        remaining_fuel, fuel_sales
    ]);

  try {
    const sql = `INSERT INTO fuel_stock 
      (vendor_id, fuel_id, quantity, cost_per_litre, total_cost, purchase_date, created_by, created_at, remaining_fuel, fuel_sales) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      vendor_id,
      fuel_id,
      quantity,
      cost_per_litre,
      total_cost,
      purchase_date,
      created_by,
      created_at,
      remaining_fuel,
      fuel_sales
    ];

    const [result] = await conn.execute(sql, values);

    res.status(200).json({ message: 'Fuel stock added', result });
  } catch (err) {
    console.error("Error inserting fuel stock:", err); // More specific error message
        res.status(500).json({ error: 'Database error', details: err.message }); // Send error details to client
  }
});


//This query will retive the current Rate per litre
app.get('/fuel_stock/rate_per_litre', async (req, res) => {
  try {
    const [results] = await conn.query('SELECT cost_per_litre FROM fuel_stock ORDER BY purchase_date DESC LIMIT 1;');
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'No fuel stock found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database Error' });
  }
});

//this query will be use for setting the current rate per litre of the fuel stock
app.get('/fuel_stock/all', async (req, res) => {
  try {
    const [results] = await conn.query(`
      SELECT fs.stock_id, fs.quantity, fs.cost_per_litre, fs.purchase_date, f.fuel_type
      FROM fuel_stock fs
      JOIN fuels f ON fs.fuel_id = f.fuel_id
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stock list', error: err.message });
  }
});

app.post('/fuel_price/set', async (req, res) => {
  const { stock_id, selling_price } = req.body;

  if (!stock_id || !selling_price) {
    return res.status(400).json({ message: 'Missing stock_id or selling_price' });
  }

  try {
    const sql = `INSERT INTO fuel_prices (stock_id, selling_price)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE selling_price = VALUES(selling_price), updated_at = NOW()`;
    await conn.execute(sql, [stock_id, selling_price]);
    res.json({ message: 'Selling price updated' });
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

app.get('/fuel_price/:stock_id', async (req, res) => {
  const { stock_id } = req.params;
  try {
    const [results] = await conn.query(
      'SELECT selling_price FROM fuel_prices WHERE stock_id = ?',
      [stock_id]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: 'No price set for this stock yet' });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching price', error: err.message });
  }
});

// Insert the active fuel stock
app.post('/active_stock/set', async (req, res) => {
  const { stock_id } = req.body;
  if (!stock_id) return res.status(400).json({ message: 'stock_id required' });

  try {
    await conn.execute(`
      INSERT INTO active_fuel_stock (id, stock_id)
      VALUES (1, ?)
      ON DUPLICATE KEY UPDATE stock_id = VALUES(stock_id), updated_at = NOW()
    `, [stock_id]);

    res.json({ message: 'Active stock set successfully' });
  } catch (err) {
    res.status(500).json({ message: 'DB error', error: err.message });
  }
});

app.get('/active_stock/current', async (req, res) => {
  try {
    const [results] = await conn.query(`
      SELECT afs.stock_id, fp.selling_price, fs.remaining_fuel, f.fuel_type
      FROM active_fuel_stock afs
      JOIN fuel_stock fs ON afs.stock_id = fs.stock_id
      JOIN fuels f ON fs.fuel_id = f.fuel_id
      JOIN fuel_prices fp ON fp.stock_id = afs.stock_id
      LIMIT 1;
    `);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No active stock set' });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: 'DB error', error: err.message });
  }
});

app.post('/fuel_sales', async (req, res) => {
  const { liters_purchased, cost_per_litre, total_amount, payment_method } = req.body;

  if (!liters_purchased || !cost_per_litre || !total_amount || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Get active fuel_id
    const [activeStockRows] = await conn.query(`
      SELECT fs.fuel_id 
      FROM active_fuel_stock afs
      JOIN fuel_stock fs ON afs.stock_id = fs.stock_id
      LIMIT 1;
    `);

    if (activeStockRows.length === 0) {
      return res.status(400).json({ message: 'No active fuel stock set' });
    }

    const fuel_id = activeStockRows[0].fuel_id;

    // Insert sale
    await conn.execute(`
      INSERT INTO fuel_sales (fuel_id, liters_purchased, cost_per_litre, total_amount, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `, [fuel_id, liters_purchased, cost_per_litre, total_amount, payment_method]);

    res.json({ message: 'Sale recorded successfully' });
  } catch (err) {
    console.error("🔥 Error inserting sale:", err);
    res.status(500).json({ message: 'Failed to save sale', error: err.message });
  }
});


app.get('/sales_report', async (req, res) => {
  try {
    const [results] = await conn.query(`
      SELECT fs.sale_id, f.fuel_type, fs.liters_purchased, fs.cost_per_litre,
             fs.total_amount, fs.payment_method, fs.sale_date
      FROM fuel_sales fs
      JOIN fuels f ON fs.fuel_id = f.fuel_id
      ORDER BY fs.sale_date DESC
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching sales report', error: err.message });
  }
});



//checking

app.post('/expenses', async (req, res) => {
  const { category, amount, expense_date, added_by = 1, notes } = req.body;
  try {
    await conn.execute(
      'INSERT INTO expenses (category, amount, expense_date, added_by, notes) VALUES (?, ?, ?, ?, ?)',
      [category, amount, expense_date, added_by, notes]
    );
    res.json({ message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'DB Error', details: err.message });
  }
});

// Get All Expenses
app.get('/expenses', async (req, res) => {
  try {
    const [results] = await conn.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load expenses', details: err.message });
  }
});


//Vendors
app.post('/vendors', async (req, res) => {
  const { name, Phone_Number, email } = req.body;
  try {
    await conn.execute(
      'INSERT INTO vendors (name, Phone_Number, email) VALUES (?, ?, ?)',
      [name, Phone_Number, email]
    );
    res.json({ message: 'Vendor added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vendor', details: err.message });
  }
});
// Get Vendors
app.get('/vendors', async (req, res) => {
  try {
    const [results] = await conn.query('SELECT * FROM vendors');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors', details: err.message });
  }
});

//Alerts

// Get alerts
app.get('/alerts', async (req, res) => {
  try {
    const [results] = await conn.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load alerts', details: err.message });
  }
});

// Add alert
app.post('/alerts', async (req, res) => {
  const { title, message } = req.body;
  try {
    await conn.execute(
      'INSERT INTO alerts (title, message) VALUES (?, ?)',
      [title, message]
    );
    res.json({ message: 'Alert added' });
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});



app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await conn.query(
      'SELECT * FROM admins WHERE username = ? AND password = ?', 
      [username, password]
    );

    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});


// ----------------------------- Admin Portal DB Queries End------------------------
app.listen(PORT, ()=>{
  console.log(`App started on localhost:${PORT}`)
})