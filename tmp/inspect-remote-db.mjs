
import pg from 'pg';

const { Client } = pg;

const remoteUrl = 'postgresql://neondb_owner:npg_u10ghRdEbnZM@ep-delicate-dust-afdhrfwf.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const client = new Client({ connectionString: remoteUrl });
  try {
    await client.connect();
    console.log('Connected to Remote DB (Neon)');

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Remote Tables:', tables);

    for (const table of tables) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`Table ${table} has ${countRes.rows[0].count} rows.`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
