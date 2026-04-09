import pg from 'pg';
import { env } from 'process';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

async function checkColumns() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'shared' AND table_name = 'users'");
    console.log('COLUMNS_RESULT:', JSON.stringify(res.rows.map(r => r.column_name), null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

checkColumns();
