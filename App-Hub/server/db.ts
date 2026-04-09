import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Helper to ensure schema exists
export async function setupDbSchema() {
  if (process.env.DATABASE_SCHEMA && process.env.DATABASE_SCHEMA !== 'public') {
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${process.env.DATABASE_SCHEMA}`);
      console.log(`Database schema '${process.env.DATABASE_SCHEMA}' ensured.`);
    } finally {
      client.release();
    }
  }
}
