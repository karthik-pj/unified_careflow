import pg from 'pg';
import { env } from 'process';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

async function testCreate() {
  try {
    const res = await pool.query(
      "INSERT INTO shared.users (username, password, email, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      ['testuser', 'hashedpass', 'test@test.com', 'operator', 'active']
    );
    console.log('INSERT_RESULT:', JSON.stringify(res.rows[0], null, 2));
    
    const lookup = await pool.query(
      "SELECT * FROM shared.users WHERE username = $1 OR email = $1",
      ['test@test.com']
    );
    console.log('LOOKUP_RESULT:', JSON.stringify(lookup.rows[0], null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

testCreate();
