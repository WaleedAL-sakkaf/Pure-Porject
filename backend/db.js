const mysql = require('mysql2');

// IMPORTANT: Replace these with your actual MySQL credentials.
// It is strongly recommended to load these from a .env file.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Default XAMPP password is an empty string
  database: process.env.DB_NAME || 'pure_water_db',
};

const pool = mysql.createPool(dbConfig);

// Test the database connection and log status
pool.getConnection((err, conn) => {
    if (err) {
      console.error('❌ Database connection failed:', err.stack);
      return;
    }
    console.log(`✅ Successfully connected to database: ${dbConfig.database}`);
    conn.release();
});
  
// Export a promise-based query function
module.exports = pool.promise(); 