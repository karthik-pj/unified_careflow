import pg from 'pg';
import { env } from 'process';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

async function checkSessions() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_sessions'");
    console.log('COLUMNS:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

checkSessions();
