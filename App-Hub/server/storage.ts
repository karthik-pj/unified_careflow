import {
  type User,
  type InsertUser,
  type ActivityLog,
  type InsertActivityLog,
  type FeatureAccess,
  type InsertFeatureAccess,
  type AppConfig,
  type UpdateAppConfig,
  type NdaSignature,
  type InsertNdaSignature,
  users,
  activityLogs,
  featureAccess,
  appConfigs,
  ndaSignatures,
  userSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "email" | "fullName" | "displayName" | "role" | "status" | "lastLoginAt" | "allowedPages" | "legacyCaresetId">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  listUsers(): Promise<User[]>;

  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsForUser(userId: string, limit?: number): Promise<ActivityLog[]>;
  getAllActivityLogs(limit?: number): Promise<(ActivityLog & { username: string | null })[]>;
  getActivityStats(userId: string): Promise<{ totalSessions: number; totalDuration: number; appsUsed: string[] }>;

  getFeatureAccessForUser(userId: string): Promise<FeatureAccess[]>;
  setFeatureAccess(data: InsertFeatureAccess): Promise<FeatureAccess>;
  deleteFeatureAccess(userId: string, appId: string): Promise<void>;

  listAppConfigs(): Promise<AppConfig[]>;
  getAppConfig(appId: string): Promise<AppConfig | undefined>;
  upsertAppConfig(appId: string, data: UpdateAppConfig): Promise<AppConfig>;

  getNdaSignature(userId: string): Promise<NdaSignature | undefined>;
  createNdaSignature(data: InsertNdaSignature): Promise<NdaSignature>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(identifier: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, "email" | "fullName" | "displayName" | "role" | "status" | "lastLoginAt" | "allowedPages" | "legacyCaresetId">>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, id));
    await db.delete(featureAccess).where(eq(featureAccess.userId, id));
    await db.delete(activityLogs).where(eq(activityLogs.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [entry] = await db.insert(activityLogs).values(log).returning();
    return entry;
  }

  async getActivityLogsForUser(userId: string, limit = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }

  async getAllActivityLogs(limit = 200): Promise<(ActivityLog & { username: string | null })[]> {
    const rows = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        appId: activityLogs.appId,
        route: activityLogs.route,
        durationSeconds: activityLogs.durationSeconds,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        username: users.username,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    return rows;
  }

  async getActivityStats(userId: string): Promise<{ totalSessions: number; totalDuration: number; appsUsed: string[] }> {
    const [sessionCount] = await db
      .select({ total: count() })
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), eq(activityLogs.action, "login")));

    const [durationSum] = await db
      .select({ total: sql<number>`COALESCE(SUM(${activityLogs.durationSeconds}), 0)` })
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId));

    const appsRows = await db
      .select({ appId: activityLogs.appId })
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), sql`${activityLogs.appId} IS NOT NULL`))
      .groupBy(activityLogs.appId);

    return {
      totalSessions: sessionCount?.total ?? 0,
      totalDuration: Number(durationSum?.total ?? 0),
      appsUsed: appsRows.map((r: { appId: string | null }) => r.appId!).filter(Boolean),
    };
  }

  async getFeatureAccessForUser(userId: string): Promise<FeatureAccess[]> {
    return db.select().from(featureAccess).where(eq(featureAccess.userId, userId));
  }

  async setFeatureAccess(data: InsertFeatureAccess): Promise<FeatureAccess> {
    const existing = await db
      .select()
      .from(featureAccess)
      .where(and(eq(featureAccess.userId, data.userId), eq(featureAccess.appId, data.appId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(featureAccess)
        .set({ enabled: data.enabled, grantedBy: data.grantedBy, grantedAt: new Date() })
        .where(eq(featureAccess.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(featureAccess).values(data).returning();
    return created;
  }

  async deleteFeatureAccess(userId: string, appId: string): Promise<void> {
    await db.delete(featureAccess).where(and(eq(featureAccess.userId, userId), eq(featureAccess.appId, appId)));
  }

  async listAppConfigs(): Promise<AppConfig[]> {
    return db.select().from(appConfigs).orderBy(appConfigs.appId);
  }

  async getAppConfig(appId: string): Promise<AppConfig | undefined> {
    const [config] = await db.select().from(appConfigs).where(eq(appConfigs.appId, appId));
    return config;
  }

  async upsertAppConfig(appId: string, data: UpdateAppConfig): Promise<AppConfig> {
    const existing = await this.getAppConfig(appId);
    if (existing) {
      const [updated] = await db
        .update(appConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(appConfigs.appId, appId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(appConfigs)
      .values({
        appId,
        name: data.name || appId,
        subtitle: data.subtitle || "",
        description: data.description || "",
        useCases: data.useCases || "",
        pageUrl: data.pageUrl || null,
        datasheetUrl: data.datasheetUrl || null,
        color: data.color || "#2e5cbf",
      })
      .returning();
    return created;
  }

  async getNdaSignature(userId: string): Promise<NdaSignature | undefined> {
    const [sig] = await db.select().from(ndaSignatures).where(eq(ndaSignatures.userId, userId));
    return sig;
  }

  async createNdaSignature(data: InsertNdaSignature): Promise<NdaSignature> {
    const [sig] = await db.insert(ndaSignatures).values(data).returning();
    return sig;
  }
}

export const storage = new DatabaseStorage();
