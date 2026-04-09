
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query('SELECT 1');
    console.log('Database connection successful!');
    
    const schemaRes = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${process.env.DATABASE_SCHEMA}'`);
    if (schemaRes.rows.length > 0) {
      console.log(`Schema '${process.env.DATABASE_SCHEMA}' exists.`);
    } else {
      console.log(`Schema '${process.env.DATABASE_SCHEMA}' does NOT exist.`);
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();
