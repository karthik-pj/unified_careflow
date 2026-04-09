import { execSync } from "child_process";
import { log } from "./index";

export async function syncDatabaseSchema() {
  log("Starting database schema synchronization...", "database");
  try {
    // Run drizzle-kit push using the config file
    // We use npx to ensure it's available in the environment
    const output = execSync("npx drizzle-kit push", {
      env: { ...process.env, DRIZZLE_KITCHEN_SINK: "1" }, // Disable interactive prompts if any
      encoding: "utf-8",
    });
    log("Database schema synchronized successfully.", "database");
    if (output) {
      console.log(output);
    }
  } catch (error: any) {
    log("Database schema synchronization failed.", "database");
    console.error(error.stdout || error.message);
    // In production, you might want to throw here to prevent the app from starting with a broken schema
    // throw error; 
  }
}
