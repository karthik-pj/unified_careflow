import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Function to extract schema name from DATABASE_URL options (search_path)
function extractSchemaFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const options = parsedUrl.searchParams.get("options");
    if (options) {
      const searchPathMatch = options.match(/search_path=([^&]+)/);
      if (searchPathMatch) {
         const schemas = decodeURIComponent(searchPathMatch[1]).split(",");
         return schemas[0].trim();
      }
    }
  } catch (e) {
    console.error("Failed to parse DATABASE_URL for schema:", e);
  }
  return "public";
}

export const DATABASE_SCHEMA = extractSchemaFromUrl(process.env.DATABASE_URL);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export const db = drizzle(pool, { schema });

// Helper to ensure schema exists
export async function setupDbSchema() {
  if (DATABASE_SCHEMA && DATABASE_SCHEMA !== 'public') {
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${DATABASE_SCHEMA}`);
      console.log(`Database schema '${DATABASE_SCHEMA}' ensured.`);
    } catch (err) {
      console.error(`Error ensuring schema '${DATABASE_SCHEMA}':`, err);
    } finally {
      client.release();
    }
  }
}
