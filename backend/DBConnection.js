const mysql = require('mysql2')
const dotenv = require('dotenv').config() 
var conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB,
});

conn.connect((err) => {
  if (err) {
    console.error('DB Connection Failed:', err);
  } else {
    console.log(`MySQL Connected at ${conn.config.host}:${conn.config.port}`);
  }
});

module.exports = conn.promise();