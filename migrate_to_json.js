const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_sports_venue_rental',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const tables = ['fields', 'sports', 'users', 'roles'];
const outputDir = path.join(__dirname, 'dbjson');

async function migrate() {
  console.log('Starting migration...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    for (const table of tables) {
      try {
        console.log(`Fetching data from table: ${table}`);
        const [rows] = await connection.execute(`SELECT * FROM ${table}`);
        
        const filePath = path.join(outputDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
        console.log(`Successfully wrote ${rows.length} rows to ${table}.json`);
      } catch (tableError) {
        console.error(`Error fetching/writing ${table}:`, tableError.message);
      }
    }

    await connection.end();
    console.log('Migration complete.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Please ensure your MySQL database is running and credentials are correct.');
    process.exit(1);
  }
}

migrate();
