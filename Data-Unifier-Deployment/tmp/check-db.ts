import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkTables() {
  const client = await pool.connect();
  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS caredeploy");
    console.log("Created caredeploy schema.");
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'caredeploy'
      ORDER BY table_name
    `);
    console.log("Tables in caredeploy:", res.rows);
    
    const searchPath = await client.query("SHOW search_path");
    console.log("Current search_path:", searchPath.rows[0]);
  } catch (err) {
    console.error("Error checking tables:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
