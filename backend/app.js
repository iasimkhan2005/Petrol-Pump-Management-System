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


app.listen(PORT, ()=>{
  console.log(`App started on localhost:${PORT}`)
})