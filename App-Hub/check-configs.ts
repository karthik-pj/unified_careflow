import { storage } from "./server/storage";
async function check() {
  const configs = await storage.listAppConfigs();
  console.log(JSON.stringify(configs, null, 2));
  process.exit(0);
}
check();
