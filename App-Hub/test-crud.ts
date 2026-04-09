import { storage } from "./server/storage";
import { hashPassword } from "./server/auth";

async function runTest() {
  console.log("🚀 Starting CRUD Test...");

  try {
    // 1. Create a test user
    const username = `testuser_${Date.now()}`;
    const password = await hashPassword("password123");
    
    console.log(`[CREATE] Creating user: ${username}`);
    const user = await storage.createUser({
      username,
      password,
      displayName: "Test User",
      role: "user",
      status: "active"
    });
    console.log("✅ User created successfully:", user.id);

    // 2. Update the user
    console.log(`[UPDATE] Updating user: ${user.id}`);
    const updated = await storage.updateUser(user.id, {
      displayName: "Updated Test User"
    });
    
    if (updated?.displayName === "Updated Test User") {
      console.log("✅ User updated successfully");
    } else {
      console.log("❌ User update failed (returning undefined or old data)");
    }

    // 3. Delete the user
    console.log(`[DELETE] Deleting user: ${user.id}`);
    await storage.deleteUser(user.id);
    
    const verified = await storage.getUser(user.id);
    if (!verified) {
      console.log("✅ User deleted successfully");
    } else {
      console.log("❌ User deletion failed (user still exists)");
    }

    console.log("\n🎉 ALL CRUD TESTS PASSED!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ CRUD TEST FAILED!");
    console.error("Error Detail:", error);
    process.exit(1);
  }
}

runTest();
