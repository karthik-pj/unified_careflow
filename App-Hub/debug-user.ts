import pg from 'pg';
import { env } from 'process';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

async function checkUser() {
  try {
    const res = await pool.query('SELECT username, email, role FROM shared.users WHERE email = $1 OR username = $2', ['santhosh@gmail.com', 'santhosh@gmail.com']);
    console.log('USER_CHECK_RESULT:', JSON.stringify(res.rows, null, 2));
    
    const allUsers = await pool.query('SELECT username, email, role FROM shared.users');
    console.log('ALL_USERS:', JSON.stringify(allUsers.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

checkUser();
