import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, edgeNodes, applications, deployments, databaseConfigs, schemaMappings,
  type User, type InsertUser,
  type EdgeNode, type InsertEdgeNode,
  type Application, type InsertApplication,
  type Deployment, type InsertDeployment,
  type DatabaseConfig, type InsertDatabaseConfig,
  type SchemaMapping, type InsertSchemaMapping,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getEdgeNodes(): Promise<EdgeNode[]>;
  getEdgeNode(id: string): Promise<EdgeNode | undefined>;
  createEdgeNode(node: InsertEdgeNode): Promise<EdgeNode>;
  updateEdgeNode(id: string, data: Partial<InsertEdgeNode>): Promise<EdgeNode | undefined>;
  deleteEdgeNode(id: string): Promise<boolean>;

  getApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;

  getDeployments(): Promise<Deployment[]>;
  getDeploymentsByApp(appId: string): Promise<Deployment[]>;
  getDeploymentsByNode(nodeId: string): Promise<Deployment[]>;
  getDeployment(id: string): Promise<Deployment | undefined>;
  createDeployment(dep: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, data: Partial<InsertDeployment>): Promise<Deployment | undefined>;

  deleteDeployment(id: string): Promise<boolean>;

  getDatabaseConfigs(): Promise<DatabaseConfig[]>;
  getDatabaseConfig(id: string): Promise<DatabaseConfig | undefined>;
  createDatabaseConfig(config: InsertDatabaseConfig): Promise<DatabaseConfig>;
  updateDatabaseConfig(id: string, data: Partial<InsertDatabaseConfig>): Promise<DatabaseConfig | undefined>;
  deleteDatabaseConfig(id: string): Promise<boolean>;

  getSchemaMappings(): Promise<SchemaMapping[]>;
  getSchemaMappingsByApp(appId: string): Promise<SchemaMapping[]>;
  getSchemaMappingsByAppVersion(appId: string, version: string): Promise<SchemaMapping[]>;
  getSchemaMapping(id: string): Promise<SchemaMapping | undefined>;
  createSchemaMapping(mapping: InsertSchemaMapping): Promise<SchemaMapping>;
  createSchemaMappingsBulk(mappings: InsertSchemaMapping[]): Promise<SchemaMapping[]>;
  updateSchemaMapping(id: string, data: Partial<InsertSchemaMapping>): Promise<SchemaMapping | undefined>;
  deleteSchemaMapping(id: string): Promise<boolean>;
  deleteSchemaMappingsByAppVersion(appId: string, version: string): Promise<boolean>;
  copyMappingsToVersion(appId: string, fromVersion: string, toVersion: string): Promise<SchemaMapping[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEdgeNodes(): Promise<EdgeNode[]> {
    return db.select().from(edgeNodes).orderBy(desc(edgeNodes.createdAt));
  }

  async getEdgeNode(id: string): Promise<EdgeNode | undefined> {
    const [node] = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id));
    return node;
  }

  async createEdgeNode(node: InsertEdgeNode): Promise<EdgeNode> {
    const [created] = await db.insert(edgeNodes).values(node).returning();
    return created;
  }

  async updateEdgeNode(id: string, data: Partial<InsertEdgeNode>): Promise<EdgeNode | undefined> {
    const [updated] = await db.update(edgeNodes).set(data).where(eq(edgeNodes.id, id)).returning();
    return updated;
  }

  async deleteEdgeNode(id: string): Promise<boolean> {
    const result = await db.delete(edgeNodes).where(eq(edgeNodes.id, id)).returning();
    return result.length > 0;
  }

  async getApplications(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(app).returning();
    return created;
  }

  async updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined> {
    const [updated] = await db.update(applications).set(data).where(eq(applications.id, id)).returning();
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id)).returning();
    return result.length > 0;
  }

  async getDeployments(): Promise<Deployment[]> {
    return db.select().from(deployments).orderBy(desc(deployments.startedAt));
  }

  async getDeploymentsByApp(appId: string): Promise<Deployment[]> {
    return db.select().from(deployments).where(eq(deployments.applicationId, appId)).orderBy(desc(deployments.startedAt));
  }

  async getDeploymentsByNode(nodeId: string): Promise<Deployment[]> {
    return db.select().from(deployments).where(eq(deployments.nodeId, nodeId)).orderBy(desc(deployments.startedAt));
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    const [dep] = await db.select().from(deployments).where(eq(deployments.id, id));
    return dep;
  }

  async createDeployment(dep: InsertDeployment): Promise<Deployment> {
    const [created] = await db.insert(deployments).values(dep).returning();
    return created;
  }

  async updateDeployment(id: string, data: Partial<InsertDeployment>): Promise<Deployment | undefined> {
    const [updated] = await db.update(deployments).set(data).where(eq(deployments.id, id)).returning();
    return updated;
  }

  async deleteDeployment(id: string): Promise<boolean> {
    const result = await db.delete(deployments).where(eq(deployments.id, id)).returning();
    return result.length > 0;
  }

  async getDatabaseConfigs(): Promise<DatabaseConfig[]> {
    return db.select().from(databaseConfigs).orderBy(desc(databaseConfigs.createdAt));
  }

  async getDatabaseConfig(id: string): Promise<DatabaseConfig | undefined> {
    const [config] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.id, id));
    return config;
  }

  async createDatabaseConfig(config: InsertDatabaseConfig): Promise<DatabaseConfig> {
    const [created] = await db.insert(databaseConfigs).values(config).returning();
    return created;
  }

  async updateDatabaseConfig(id: string, data: Partial<InsertDatabaseConfig>): Promise<DatabaseConfig | undefined> {
    const [updated] = await db.update(databaseConfigs).set(data).where(eq(databaseConfigs.id, id)).returning();
    return updated;
  }

  async deleteDatabaseConfig(id: string): Promise<boolean> {
    const result = await db.delete(databaseConfigs).where(eq(databaseConfigs.id, id)).returning();
    return result.length > 0;
  }

  async getSchemaMappings(): Promise<SchemaMapping[]> {
    return db.select().from(schemaMappings).orderBy(desc(schemaMappings.createdAt));
  }

  async getSchemaMappingsByApp(appId: string): Promise<SchemaMapping[]> {
    return db.select().from(schemaMappings).where(eq(schemaMappings.applicationId, appId)).orderBy(schemaMappings.sourceTable, schemaMappings.sourceField);
  }

  async getSchemaMappingsByAppVersion(appId: string, version: string): Promise<SchemaMapping[]> {
    return db.select().from(schemaMappings).where(and(eq(schemaMappings.applicationId, appId), eq(schemaMappings.version, version))).orderBy(schemaMappings.sourceTable, schemaMappings.sourceField);
  }

  async getSchemaMapping(id: string): Promise<SchemaMapping | undefined> {
    const [mapping] = await db.select().from(schemaMappings).where(eq(schemaMappings.id, id));
    return mapping;
  }

  async createSchemaMapping(mapping: InsertSchemaMapping): Promise<SchemaMapping> {
    const [created] = await db.insert(schemaMappings).values(mapping).returning();
    return created;
  }

  async createSchemaMappingsBulk(mappings: InsertSchemaMapping[]): Promise<SchemaMapping[]> {
    if (mappings.length === 0) return [];
    return db.insert(schemaMappings).values(mappings).returning();
  }

  async updateSchemaMapping(id: string, data: Partial<InsertSchemaMapping>): Promise<SchemaMapping | undefined> {
    const [updated] = await db.update(schemaMappings).set(data).where(eq(schemaMappings.id, id)).returning();
    return updated;
  }

  async deleteSchemaMapping(id: string): Promise<boolean> {
    const result = await db.delete(schemaMappings).where(eq(schemaMappings.id, id)).returning();
    return result.length > 0;
  }

  async deleteSchemaMappingsByAppVersion(appId: string, version: string): Promise<boolean> {
    const result = await db.delete(schemaMappings).where(and(eq(schemaMappings.applicationId, appId), eq(schemaMappings.version, version))).returning();
    return result.length > 0;
  }

  async copyMappingsToVersion(appId: string, fromVersion: string, toVersion: string): Promise<SchemaMapping[]> {
    const existingTarget = await this.getSchemaMappingsByAppVersion(appId, toVersion);
    if (existingTarget.length > 0) {
      await db.delete(schemaMappings).where(and(eq(schemaMappings.applicationId, appId), eq(schemaMappings.version, toVersion)));
    }
    const source = await this.getSchemaMappingsByAppVersion(appId, fromVersion);
    if (source.length === 0) return [];
    const newMappings = source.map(({ id, createdAt, version, ...rest }) => ({
      ...rest,
      version: toVersion,
    }));
    return this.createSchemaMappingsBulk(newMappings as InsertSchemaMapping[]);
  }
}

export const storage = new DatabaseStorage();
