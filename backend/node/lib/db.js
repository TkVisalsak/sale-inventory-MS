
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test DB connection once at startup
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully to Neon');
    client.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1); // Exit app on DB failure
  });

export default pool;
