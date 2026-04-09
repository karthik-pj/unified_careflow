import { seedDatabase } from "./seed";
import { setupDbSchema } from "./db";

(async () => {
    try {
        console.log("Setting up schema...");
        await setupDbSchema();
        console.log("Seeding database...");
        await seedDatabase();
        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
})();
