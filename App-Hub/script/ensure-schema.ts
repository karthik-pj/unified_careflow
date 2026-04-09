import pg from "pg";

const { DATABASE_URL, DATABASE_SCHEMA } = process.env;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not defined in .env");
  process.exit(1);
}

async function ensureSchema() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    if (DATABASE_SCHEMA && DATABASE_SCHEMA !== "public") {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${ DATABASE_SCHEMA }`);
      console.log(`Schema '${ DATABASE_SCHEMA }' ensured.`);
    } else {
      console.log("Using public schema or no schema specified.");
    }
  } catch (err: any) {
    console.error("Failed to ensure schema:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ensureSchema();
