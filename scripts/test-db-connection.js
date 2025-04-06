const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    console.log('Connection string:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    
    await client.connect();
    console.log('Connected to database successfully!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Current time from database:', res.rows[0].now);
    
    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

testConnection();