import { storage } from "./server/storage";
import { hashPassword } from "./server/auth";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function syncUsers() {
  console.log("Synchronizing users for SSO...");

  const scryptAdmin = await hashPassword("admin123");
  const scryptDemo = await hashPassword("demo123");

  // 1. Setup 'admin' user
  const adminUser = await storage.getUserByUsername("admin");
  if (adminUser) {
    await db.update(users)
      .set({ 
        password: scryptAdmin, 
        role: "admin", 
        displayName: "Real Admin",
        status: "active" 
      })
      .where(eq(users.username, "admin"));
    console.log("✅ 'admin' user updated with password: admin123");
  } else {
    await storage.createUser({
      username: "admin",
      password: scryptAdmin,
      displayName: "Real Admin",
      role: "admin",
      status: "active"
    });
    console.log("✅ 'admin' user created with password: admin123");
  }

  // 2. Setup 'demo' user (limited)
  const demoUser = await storage.getUserByUsername("demo");
  if (demoUser) {
    await db.update(users)
      .set({ 
        password: scryptDemo, 
        role: "operator", 
        displayName: "Demo Personnel",
        status: "active" 
      })
      .where(eq(users.username, "demo"));
    console.log("✅ 'demo' user updated with password: demo123");
  } else {
    await storage.createUser({
      username: "demo",
      password: scryptDemo,
      displayName: "Demo Personnel",
      role: "operator",
      status: "active"
    });
    console.log("✅ 'demo' user created with password: demo123");
  }
}

syncUsers().catch(console.error);
