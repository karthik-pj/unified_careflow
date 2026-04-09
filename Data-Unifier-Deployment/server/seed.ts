import { storage } from "./storage";
import { db } from "./db";
import { deployments } from "@shared/schema";

function seedLog(msg: string) {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [seed] ${msg}`);
}

export async function seedIfEmpty() {
  try {
    const existingNodes = await storage.getEdgeNodes();
    if (existingNodes.length > 0) {
      seedLog("Database already has data, skipping seed");
      return;
    }

    seedLog("Seeding sample data...");

    const nodes = await Promise.all([
      storage.createEdgeNode({ name: "Edge-Primary-EU", hostname: "edge-eu-01.careflow.local", ipAddress: "10.0.1.10", location: "Frankfurt, DE", status: "online", cpuUsage: 42, memoryUsage: 61, diskUsage: 55, os: "Ubuntu 22.04 LTS" }),
      storage.createEdgeNode({ name: "Edge-Primary-US", hostname: "edge-us-01.careflow.local", ipAddress: "10.0.2.10", location: "Virginia, US", status: "online", cpuUsage: 38, memoryUsage: 54, diskUsage: 47, os: "Ubuntu 22.04 LTS" }),
      storage.createEdgeNode({ name: "Edge-Backup-EU", hostname: "edge-eu-02.careflow.local", ipAddress: "10.0.1.11", location: "Amsterdam, NL", status: "online", cpuUsage: 15, memoryUsage: 32, diskUsage: 28, os: "Debian 12" }),
      storage.createEdgeNode({ name: "Edge-Dev", hostname: "edge-dev-01.careflow.local", ipAddress: "10.0.3.10", location: "Zurich, CH", status: "degraded", cpuUsage: 78, memoryUsage: 85, diskUsage: 72, os: "Ubuntu 24.04 LTS" }),
      storage.createEdgeNode({ name: "Edge-Staging", hostname: "edge-stg-01.careflow.local", ipAddress: "10.0.4.10", location: "Munich, DE", status: "online", cpuUsage: 22, memoryUsage: 40, diskUsage: 35, os: "Ubuntu 22.04 LTS" }),
    ]);

    const apps = await Promise.all([
      storage.createApplication({ name: "CRM Dashboard", repository: "https://replit.com/@careflow/crm-dashboard", port: 3000, status: "running", envVars: { NODE_ENV: "production", API_KEY: "crm-xxx" } }),
      storage.createApplication({ name: "Inventory Tracker", repository: "https://replit.com/@careflow/inventory-tracker", port: 3001, status: "running", envVars: { NODE_ENV: "production" } }),
      storage.createApplication({ name: "HR Portal", repository: "https://replit.com/@careflow/hr-portal", port: 3002, status: "running", envVars: { NODE_ENV: "production" } }),
      storage.createApplication({ name: "Analytics Engine", repository: "https://replit.com/@careflow/analytics-engine", port: 3003, status: "stopped", envVars: { NODE_ENV: "production" } }),
      storage.createApplication({ name: "Fleet Monitor", repository: "https://replit.com/@careflow/fleet-monitor", port: 3004, status: "running", envVars: { NODE_ENV: "production" } }),
    ]);

    const now = Date.now();
    await db.insert(deployments).values([
      { applicationId: apps[0].id, nodeId: nodes[0].id, version: "1.0.0", status: "success", logs: "Build OK. Deployed to edge-eu-01.", startedAt: new Date(now - 3600000), completedAt: new Date(now - 3500000) },
      { applicationId: apps[0].id, nodeId: nodes[1].id, version: "1.0.0", status: "success", logs: "Build OK. Deployed to edge-us-01.", startedAt: new Date(now - 3400000), completedAt: new Date(now - 3300000) },
      { applicationId: apps[1].id, nodeId: nodes[0].id, version: "2.1.0", status: "success", logs: "Build OK. Deployed to edge-eu-01.", startedAt: new Date(now - 7200000), completedAt: new Date(now - 7100000) },
      { applicationId: apps[2].id, nodeId: nodes[0].id, version: "1.2.0", status: "running", logs: "Deploying...", startedAt: new Date(now - 600000) },
      { applicationId: apps[3].id, nodeId: nodes[3].id, version: "0.9.0", status: "failed", logs: "Error: Out of memory on edge-dev-01.", startedAt: new Date(now - 86400000), completedAt: new Date(now - 86300000) },
      { applicationId: apps[4].id, nodeId: nodes[4].id, version: "1.5.0", status: "success", logs: "Build OK. Deployed to edge-stg-01.", startedAt: new Date(now - 1800000), completedAt: new Date(now - 1700000) },
      { applicationId: apps[1].id, nodeId: nodes[2].id, version: "2.0.0", status: "success", logs: "Build OK. Previous version.", startedAt: new Date(now - 172800000), completedAt: new Date(now - 172700000) },
      { applicationId: apps[4].id, nodeId: nodes[0].id, version: "1.4.0", status: "pending", logs: null },
    ]);

    await Promise.all([
      storage.createDatabaseConfig({ name: "Primary EU Cluster", host: "db-eu-01.careflow.local", port: 5432, database: "careflow_prod", username: "careflow", schemaPrefix: "cf_", poolSize: 20, isActive: true }),
      storage.createDatabaseConfig({ name: "US Replica", host: "db-us-01.careflow.local", port: 5432, database: "careflow_prod", username: "careflow", schemaPrefix: "cf_", poolSize: 10, isActive: true }),
      storage.createDatabaseConfig({ name: "Dev/Test", host: "db-dev-01.careflow.local", port: 5432, database: "careflow_dev", username: "careflow_dev", schemaPrefix: "dev_", poolSize: 5, isActive: false }),
    ]);

    await Promise.all([
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "customers", sourceField: "email", sourceType: "varchar", targetTable: "contacts", targetField: "email_address", targetType: "varchar", transformRule: "LOWER(value)", isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "customers", sourceField: "full_name", sourceType: "text", targetTable: "contacts", targetField: "display_name", targetType: "text", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "customers", sourceField: "phone", sourceType: "varchar", targetTable: "contacts", targetField: "phone_number", targetType: "varchar", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "customers", sourceField: "created", sourceType: "timestamp", targetTable: "contacts", targetField: "created_at", targetType: "timestamp", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "deals", sourceField: "amount", sourceType: "decimal", targetTable: "opportunities", targetField: "deal_value", targetType: "decimal", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[0].id, version: "1.0.0", sourceTable: "deals", sourceField: "stage", sourceType: "text", targetTable: "opportunities", targetField: "pipeline_stage", targetType: "varchar", transformRule: "UPPER(value)", isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[1].id, version: "2.1.0", sourceTable: "products", sourceField: "sku", sourceType: "varchar", targetTable: "inventory_items", targetField: "sku_code", targetType: "varchar", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[1].id, version: "2.1.0", sourceTable: "products", sourceField: "qty", sourceType: "integer", targetTable: "inventory_items", targetField: "quantity_on_hand", targetType: "integer", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[1].id, version: "2.1.0", sourceTable: "products", sourceField: "price", sourceType: "decimal", targetTable: "inventory_items", targetField: "unit_price", targetType: "decimal", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[1].id, version: "2.1.0", sourceTable: "warehouses", sourceField: "name", sourceType: "text", targetTable: "locations", targetField: "location_name", targetType: "text", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[1].id, version: "2.1.0", sourceTable: "warehouses", sourceField: "zip", sourceType: "varchar", targetTable: "locations", targetField: "postal_code", targetType: "varchar", transformRule: "LPAD(value, 5, '0')", isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[2].id, version: "1.2.0", sourceTable: "employees", sourceField: "first_name", sourceType: "text", targetTable: "personnel", targetField: "given_name", targetType: "text", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[2].id, version: "1.2.0", sourceTable: "employees", sourceField: "last_name", sourceType: "text", targetTable: "personnel", targetField: "family_name", targetType: "text", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[2].id, version: "1.2.0", sourceTable: "employees", sourceField: "hire_date", sourceType: "date", targetTable: "personnel", targetField: "start_date", targetType: "date", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[2].id, version: "1.2.0", sourceTable: "employees", sourceField: "dept_id", sourceType: "integer", targetTable: "personnel", targetField: "department_id", targetType: "integer", transformRule: null, isActive: true }),
      storage.createSchemaMapping({ applicationId: apps[2].id, version: "1.2.0", sourceTable: "departments", sourceField: "dept_name", sourceType: "text", targetTable: "org_units", targetField: "unit_name", targetType: "varchar", transformRule: "TRIM(value)", isActive: true }),
    ]);

    seedLog("Sample data seeded successfully");
  } catch (err) {
    seedLog(`Seed error (non-fatal): ${err}`);
  }
}
