import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertEdgeNodeSchema,
  insertApplicationSchema,
  insertDeploymentSchema,
  insertDatabaseConfigSchema,
  insertSchemaMappingSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Edge Nodes
  app.get("/api/nodes", async (_req, res) => {
    const nodes = await storage.getEdgeNodes();
    res.json(nodes);
  });

  app.get("/api/nodes/:id", async (req, res) => {
    const node = await storage.getEdgeNode(req.params.id);
    if (!node) return res.status(404).json({ message: "Node not found" });
    res.json(node);
  });

  app.post("/api/nodes", async (req, res) => {
    const parsed = insertEdgeNodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const node = await storage.createEdgeNode(parsed.data);
    res.status(201).json(node);
  });

  app.patch("/api/nodes/:id", async (req, res) => {
    const node = await storage.updateEdgeNode(req.params.id, req.body);
    if (!node) return res.status(404).json({ message: "Node not found" });
    res.json(node);
  });

  app.delete("/api/nodes/:id", async (req, res) => {
    const deleted = await storage.deleteEdgeNode(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Node not found" });
    res.status(204).send();
  });

  // Applications
  app.get("/api/apps", async (_req, res) => {
    const apps = await storage.getApplications();
    res.json(apps);
  });

  app.get("/api/apps/:id", async (req, res) => {
    const application = await storage.getApplication(req.params.id);
    if (!application) return res.status(404).json({ message: "App not found" });
    res.json(application);
  });

  app.post("/api/apps", async (req, res) => {
    const parsed = insertApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const application = await storage.createApplication(parsed.data);
    res.status(201).json(application);
  });

  app.patch("/api/apps/:id", async (req, res) => {
    const application = await storage.updateApplication(req.params.id, req.body);
    if (!application) return res.status(404).json({ message: "App not found" });
    res.json(application);
  });

  app.delete("/api/apps/:id", async (req, res) => {
    const deleted = await storage.deleteApplication(req.params.id);
    if (!deleted) return res.status(404).json({ message: "App not found" });
    res.status(204).send();
  });

  // Deployments
  app.get("/api/deployments", async (_req, res) => {
    const deps = await storage.getDeployments();
    res.json(deps);
  });

  app.get("/api/deployments/app/:appId", async (req, res) => {
    const deps = await storage.getDeploymentsByApp(req.params.appId);
    res.json(deps);
  });

  app.get("/api/deployments/node/:nodeId", async (req, res) => {
    const deps = await storage.getDeploymentsByNode(req.params.nodeId);
    res.json(deps);
  });

  app.post("/api/deployments", async (req, res) => {
    const parsed = insertDeploymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const dep = await storage.createDeployment(parsed.data);
    res.status(201).json(dep);
  });

  app.patch("/api/deployments/:id", async (req, res) => {
    const dep = await storage.updateDeployment(req.params.id, req.body);
    if (!dep) return res.status(404).json({ message: "Deployment not found" });
    res.json(dep);
  });

  // Database Configs
  app.get("/api/databases", async (_req, res) => {
    const configs = await storage.getDatabaseConfigs();
    res.json(configs);
  });

  app.get("/api/databases/:id", async (req, res) => {
    const config = await storage.getDatabaseConfig(req.params.id);
    if (!config) return res.status(404).json({ message: "Config not found" });
    res.json(config);
  });

  app.post("/api/databases", async (req, res) => {
    const parsed = insertDatabaseConfigSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const config = await storage.createDatabaseConfig(parsed.data);
    res.status(201).json(config);
  });

  app.patch("/api/databases/:id", async (req, res) => {
    const config = await storage.updateDatabaseConfig(req.params.id, req.body);
    if (!config) return res.status(404).json({ message: "Config not found" });
    res.json(config);
  });

  app.delete("/api/databases/:id", async (req, res) => {
    const deleted = await storage.deleteDatabaseConfig(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Config not found" });
    res.status(204).send();
  });

  // Schema Mappings
  app.get("/api/mappings", async (_req, res) => {
    const mappings = await storage.getSchemaMappings();
    res.json(mappings);
  });

  app.get("/api/mappings/app/:appId", async (req, res) => {
    const mappings = await storage.getSchemaMappingsByApp(req.params.appId);
    res.json(mappings);
  });

  app.get("/api/mappings/app/:appId/version/:version", async (req, res) => {
    const mappings = await storage.getSchemaMappingsByAppVersion(req.params.appId, req.params.version);
    res.json(mappings);
  });

  app.post("/api/mappings", async (req, res) => {
    const parsed = insertSchemaMappingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mapping = await storage.createSchemaMapping(parsed.data);
    res.status(201).json(mapping);
  });

  app.post("/api/mappings/bulk", async (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ message: "Expected array" });
    const results = [];
    for (const item of req.body) {
      const parsed = insertSchemaMappingSchema.safeParse(item);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      results.push(parsed.data);
    }
    const mappings = await storage.createSchemaMappingsBulk(results);
    res.status(201).json(mappings);
  });

  app.post("/api/mappings/copy", async (req, res) => {
    const { applicationId, fromVersion, toVersion } = req.body;
    if (!applicationId || !fromVersion || !toVersion) {
      return res.status(400).json({ message: "applicationId, fromVersion, toVersion required" });
    }
    const mappings = await storage.copyMappingsToVersion(applicationId, fromVersion, toVersion);
    res.status(201).json(mappings);
  });

  app.patch("/api/mappings/:id", async (req, res) => {
    const parsed = insertSchemaMappingSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const mapping = await storage.updateSchemaMapping(req.params.id, parsed.data);
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });
    res.json(mapping);
  });

  app.delete("/api/mappings/:id", async (req, res) => {
    const deleted = await storage.deleteSchemaMapping(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Mapping not found" });
    res.status(204).send();
  });

  app.delete("/api/mappings/app/:appId/version/:version", async (req, res) => {
    await storage.deleteSchemaMappingsByAppVersion(req.params.appId, req.params.version);
    res.status(204).send();
  });

  // Dashboard stats
  app.get("/api/stats", async (_req, res) => {
    const [nodes, apps, deps, dbConfigs] = await Promise.all([
      storage.getEdgeNodes(),
      storage.getApplications(),
      storage.getDeployments(),
      storage.getDatabaseConfigs(),
    ]);

    const onlineNodes = nodes.filter(n => n.status === "online").length;
    const activeApps = apps.filter(a => a.status === "running").length;
    const recentDeployments = deps.filter(d => {
      if (!d.startedAt) return false;
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(d.startedAt) > dayAgo;
    }).length;
    const failedDeployments = deps.filter(d => d.status === "failed").length;

    res.json({
      totalNodes: nodes.length,
      onlineNodes,
      totalApps: apps.length,
      activeApps,
      totalDeployments: deps.length,
      recentDeployments,
      failedDeployments,
      activeDatabases: dbConfigs.filter(c => c.isActive).length,
    });
  });

  app.delete("/api/sample-data", async (_req, res) => {
    const [nodes, apps, deps, dbConfigs, mappings] = await Promise.all([
      storage.getEdgeNodes(),
      storage.getApplications(),
      storage.getDeployments(),
      storage.getDatabaseConfigs(),
      storage.getSchemaMappings(),
    ]);

    let deleted = 0;
    for (const d of deps) { await storage.deleteDeployment(d.id); deleted++; }
    for (const m of mappings) { await storage.deleteSchemaMapping(m.id); deleted++; }
    for (const c of dbConfigs) { await storage.deleteDatabaseConfig(c.id); deleted++; }
    for (const a of apps) { await storage.deleteApplication(a.id); deleted++; }
    for (const n of nodes) { await storage.deleteEdgeNode(n.id); deleted++; }

    res.json({ message: `Cleared ${deleted} sample records` });
  });

  return httpServer;
}
