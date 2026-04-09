/**
 * This script manages the compatibility views for the unified schema.
 * Run with: node --env-file=.env script/manage-views.js [drop|create]
 */
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const DROP_VIEWS = `
  DROP VIEW IF EXISTS careset.users CASCADE;
  DROP VIEW IF EXISTS apphub.users CASCADE;
  DROP VIEW IF EXISTS caredeploy.users CASCADE;
`;

const CREATE_VIEWS = `
  -- CareSet view: maps shared.users back to integer ID for SQLAlchemy compatibility
  CREATE OR REPLACE VIEW careset.users AS
  SELECT
    legacy_careset_id AS id,
    username,
    password    AS password_hash,
    email,
    full_name,
    role,
    is_active,
    last_login,
    created_at,
    updated_at,
    allowed_pages
  FROM shared.users
  WHERE legacy_careset_id IS NOT NULL;

  -- App Hub view: maps shared.users to the Node.js camelCase shape
  CREATE OR REPLACE VIEW apphub.users AS
  SELECT
    id,
    username,
    password,
    display_name,
    role,
    status,
    created_at,
    last_login AS last_login_at
  FROM shared.users;

  -- CareDeploy view: minimal shape needed by the deployment app
  CREATE OR REPLACE VIEW caredeploy.users AS
  SELECT
    id,
    username,
    password
  FROM shared.users;
`;

async function main() {
  const action = process.argv[2];
  if (!action || !["drop", "create"].includes(action)) {
    console.error("Usage: node manage-views.js [drop|create]");
    process.exit(1);
  }

  try {
    if (action === "drop") {
      console.log("Dropping compatibility views...");
      await pool.query(DROP_VIEWS);
      console.log("✓ Views dropped successfully.");
    } else {
      console.log("Creating compatibility views...");
      await pool.query(CREATE_VIEWS);
      console.log("✓ Views created successfully.");
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
