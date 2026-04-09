import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function listTables() {
  const result = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('careset', 'apphub', 'caredeploy', 'shared') 
    ORDER BY table_schema, table_name
  `);
  
  console.log("┌─────────┬──────────────┬──────────────────────┐");
  console.log("│ (index) │ table_schema │ table_name           │");
  console.log("├─────────┼──────────────┼──────────────────────┤");
  
  result.rows.forEach((row, index) => {
    const idx = String(index).padEnd(7, " ");
    const schema = `'${row.table_schema}'`.padEnd(12, " ");
    const name = `'${row.table_name}'`.padEnd(20, " ");
    console.log(`│ ${idx} │ ${schema} │ ${name} │`);
  });
  
  console.log("└─────────┴──────────────┴──────────────────────┘");
  
  process.exit(0);
}

listTables().catch(console.error);
