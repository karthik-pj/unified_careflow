
import postgres from 'postgres';

const sql = postgres('postgresql://postgres:1234@localhost:5432/unified_db');

async function main() {
  try {
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
    `;
    console.log('Schemas:', schemas);

    for (const schema of schemas) {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schema.schema_name}
      `;
      console.log(`Tables in ${schema.schema_name}:`, tables);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
