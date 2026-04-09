
import pg from 'pg';

const { Client } = pg;

const localUrl = 'postgresql://postgres:1234@localhost:5432/unified_db';

async function main() {
  const client = new Client({ connectionString: localUrl });
  try {
    await client.connect();
    console.log('Connected to Local DB');

    const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'careset'");
    if (schemaRes.rows.length === 0) {
      console.log("Schema 'careset' does not exist localy. I will create it.");
      await client.query("CREATE SCHEMA IF NOT EXISTS careset");
    } else {
      console.log("Schema 'careset' exists.");
    }

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'careset'
    `);
    console.log('Local Tables in careset schema:', tablesRes.rows.map(r => r.table_name));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
