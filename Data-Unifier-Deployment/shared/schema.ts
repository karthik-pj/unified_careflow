import { sql } from "drizzle-orm";
import { pgTable as pgTableBase, text, varchar, integer, timestamp, boolean, jsonb, pgSchema } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper to extract schema name from DATABASE_URL
function getDatabaseSchema() {
  if (typeof process === "undefined" || !process.env?.DATABASE_URL) return "public";
  try {
    const url = process.env.DATABASE_URL;
    const searchParams = new URL(url).searchParams;
    const options = searchParams.get("options");
    if (options) {
      const match = options.match(/search_path=([^&]+)/);
      if (match) {
        const schemas = decodeURIComponent(match[1]).split(",");
        return schemas[0].trim();
      }
    }
  } catch (e) {
    // Fallback for non-standard URLs or client-side
  }
  return "public";
}

const DATABASE_SCHEMA = getDatabaseSchema();
export const dbSchema = pgSchema(DATABASE_SCHEMA);

// Helper to define tables within the dynamic schema
const pgTable = (name: string, columns: any, extra?: any) => {
  if (DATABASE_SCHEMA === "public") {
    return pgTableBase(name, columns, extra);
  }
  return dbSchema.table(name, columns, extra);
};

export const sharedSchema = pgSchema("shared");

export const users = sharedSchema.table("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  displayName: text("display_name"),
  role: text("role").default("user"),
  status: text("status").default("active"),
  isActive: boolean("is_active").default(true),
  legacyCaresetId: integer("legacy_careset_id"),
  allowedPages: text("allowed_pages"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const edgeNodes = pgTable("edge_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hostname: text("hostname").notNull(),
  ipAddress: text("ip_address").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("offline"),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  diskUsage: integer("disk_usage").default(0),
  os: text("os").default("Ubuntu 22.04"),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  repository: text("repository"),
  port: integer("port").notNull().default(3000),
  envVars: jsonb("env_vars").$type<Record<string, string>>().default({}),
  status: text("status").notNull().default("inactive"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  nodeId: varchar("node_id").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("pending"),
  logs: text("logs"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const databaseConfigs = pgTable("database_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(5432),
  database: text("database").notNull(),
  username: text("username").notNull(),
  schemaPrefix: text("schema_prefix"),
  isActive: boolean("is_active").notNull().default(true),
  poolSize: integer("pool_size").default(20),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schemaMappings = pgTable("schema_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  version: text("version").notNull(),
  sourceTable: text("source_table").notNull(),
  sourceField: text("source_field").notNull(),
  sourceType: text("source_type").notNull(),
  targetTable: text("target_table").notNull(),
  targetField: text("target_field").notNull(),
  targetType: text("target_type").notNull(),
  transformRule: text("transform_rule"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertSchemaMappingSchema = createInsertSchema(schemaMappings).omit({
  id: true,
  createdAt: true,
});

export type InsertSchemaMapping = z.infer<typeof insertSchemaMappingSchema>;
export type SchemaMapping = typeof schemaMappings.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  displayName: true,
  role: true,
  status: true,
  legacyCaresetId: true,
  allowedPages: true,
});

export const insertEdgeNodeSchema = createInsertSchema(edgeNodes).omit({
  id: true,
  createdAt: true,
  lastHeartbeat: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertDatabaseConfigSchema = createInsertSchema(databaseConfigs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEdgeNode = z.infer<typeof insertEdgeNodeSchema>;
export type EdgeNode = typeof edgeNodes.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertDatabaseConfig = z.infer<typeof insertDatabaseConfigSchema>;
export type DatabaseConfig = typeof databaseConfigs.$inferSelect;
