import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, pgSchema } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const schemaName = (globalThis as any).process?.env?.DATABASE_SCHEMA || "public";
export const dbSchema = schemaName !== "public" ? pgSchema(schemaName) : null;

// Helper to define tables within the configured schema or public
const tableCreator = dbSchema ? dbSchema.table : pgTable;

export const sharedSchema = pgSchema("shared");
export const caresetSchema = pgSchema("careset");

export const users = sharedSchema.table("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  isActive: boolean("is_active").default(true),
  legacyCaresetId: integer("legacy_careset_id"),
  allowedPages: text("allowed_pages"),
  lastLoginAt: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityLogs = tableCreator("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  appId: text("app_id"),
  route: text("route"),
  durationSeconds: integer("duration_seconds"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureAccess = tableCreator("feature_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  appId: text("app_id").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  grantedBy: varchar("granted_by"),
});

export const appConfigs = tableCreator("app_configs", {
  appId: text("app_id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  useCases: text("use_cases").notNull().default(""),
  pageUrl: text("page_url"),
  datasheetUrl: text("datasheet_url"),
  color: text("color").notNull().default("#2e5cbf"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = tableCreator("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const userSessions = caresetSchema.table("user_sessions", {
  id: integer("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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


export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  appId: true,
  route: true,
  durationSeconds: true,
  metadata: true,
});

export const insertFeatureAccessSchema = createInsertSchema(featureAccess).pick({
  userId: true,
  appId: true,
  enabled: true,
  grantedBy: true,
});

export const ndaSignatures = tableCreator("nda_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company").notNull(),
  street: text("street").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default(""),
  initialsPage1: text("initials_page1").notNull(),
  initialsPage2: text("initials_page2").notNull(),
  initialsPage3: text("initials_page3").notNull(),
  initialsPage4: text("initials_page4").notNull(),
  signatureText: text("signature_text").notNull(),
  ndaVersion: text("nda_version").notNull().default("2.0"),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
});

export const insertNdaSignatureSchema = createInsertSchema(ndaSignatures).omit({
  id: true,
  signedAt: true,
});

export const ndaSignSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().min(1, "Company or organization is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  initialsPage1: z.string().min(1, "Initials required for page 1"),
  initialsPage2: z.string().min(1, "Initials required for page 2"),
  initialsPage3: z.string().min(1, "Initials required for page 3"),
  initialsPage4: z.string().min(1, "Initials required for page 4"),
  signatureText: z.string().min(2, "Signature is required"),
});

export const updateAppConfigSchema = z.object({
  name: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  useCases: z.string().optional(),
  pageUrl: z.string().nullable().optional(),
  datasheetUrl: z.string().nullable().optional(),
  color: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertFeatureAccess = z.infer<typeof insertFeatureAccessSchema>;
export type FeatureAccess = typeof featureAccess.$inferSelect;
export type AppConfig = typeof appConfigs.$inferSelect;
export type UpdateAppConfig = z.infer<typeof updateAppConfigSchema>;
export type NdaSignature = typeof ndaSignatures.$inferSelect;
export type InsertNdaSignature = z.infer<typeof insertNdaSignatureSchema>;
export type NdaSignInput = z.infer<typeof ndaSignSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
