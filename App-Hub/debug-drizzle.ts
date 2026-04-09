import pg from 'pg';
import { env } from 'process';
import { db } from './server/db';
import { users } from './shared/schema';
import { desc } from 'drizzle-orm';

async function debugListUsers() {
  try {
    const list = await db.select().from(users).orderBy(desc(users.createdAt));
    console.log('LIST_USERS_RESULT:', JSON.stringify(list[0], null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit(0);
  }
}

debugListUsers();
