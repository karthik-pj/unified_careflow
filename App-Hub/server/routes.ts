import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, users, updateAppConfigSchema, ndaSignSchema } from "@shared/schema";
import { hashPassword, comparePassword } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import jwt from "jsonwebtoken";

const PgSession = connectPgSimple(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: false, // Disabling this because the table already exists
        schemaName: 'apphub',
        tableName: 'session'
      }),
      secret: process.env.SESSION_SECRET || "careflow-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to false for local development on HTTP
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      await storage.createActivityLog({ userId: user.id, action: "login", route: "/" });

      res.json({ id: user.id, username: user.username, role: user.role, displayName: user.displayName });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }

      const { username, password } = parsed.data;
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed });

      (req.session as any).userId = user.id;
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ id: user.id, username: user.username, role: user.role, displayName: user.displayName });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/sso-token", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const ssoSecret = process.env.SSO_JWT_SECRET;
      if (!ssoSecret) {
        console.error("SSO_JWT_SECRET not found in environment");
        return res.status(500).json({ message: "SSO configuration error" });
      }

      const token = jwt.sign(
        { 
          sub: user.id,
          username: user.username,
          role: user.role
        }, 
        ssoSecret, 
        { expiresIn: "60s" }
      );

      res.json({ token });
    } catch (error) {
      console.error("SSO token generation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Activity tracking ---
  app.post("/api/activity", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { action, appId, route, durationSeconds, metadata } = req.body;
      if (!action) {
        return res.status(400).json({ message: "action is required" });
      }
      const log = await storage.createActivityLog({
        userId,
        action,
        appId: appId || null,
        route: route || null,
        durationSeconds: durationSeconds || null,
        metadata: metadata || null,
      });
      res.json(log);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: User management ---
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const usersList = await storage.listUsers();
      const safeUsers = usersList.map(({ password, ...u }) => u);
      res.json(safeUsers);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, email, fullName, displayName, role, status, legacyCaresetId, allowedPages } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashed = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashed,
        email: email || null,
        fullName: fullName || null,
        displayName: displayName || null,
        role: role || "user",
        status: status || "active",
        legacyCaresetId: legacyCaresetId ? parseInt(legacyCaresetId) : null,
        allowedPages: allowedPages || null,
      });

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { email, fullName, displayName, role, status, legacyCaresetId, allowedPages } = req.body;
      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (fullName !== undefined) updateData.fullName = fullName;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;
      if (legacyCaresetId !== undefined) updateData.legacyCaresetId = legacyCaresetId ? parseInt(legacyCaresetId) : null;
      if (allowedPages !== undefined) updateData.allowedPages = allowedPages;

      const userId = req.params.id as string;
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const hashed = await hashPassword(password);
      const userId = req.params.id as string;
      const [updated] = await db
        .update(users)
        .set({ password: hashed })
        .where(eq(users.id, userId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated" });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const adminId = (req.session as any).userId;
      const userId = req.params.id as string;
      if (userId === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(userId);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Activity logs ---
  app.get("/api/admin/activity", requireAdmin, async (_req, res) => {
    try {
      const logs = await storage.getAllActivityLogs(500);
      res.json(logs);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users/:id/activity", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getActivityLogsForUser(req.params.id as string, 200);
      res.json(logs);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users/:id/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getActivityStats(req.params.id as string);
      res.json(stats);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Feature access ---
  app.get("/api/admin/users/:id/features", requireAdmin, async (req, res) => {
    try {
      const features = await storage.getFeatureAccessForUser(req.params.id as string);
      res.json(features);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:id/features", requireAdmin, async (req, res) => {
    try {
      const adminId = (req.session as any).userId;
      const { appId, enabled } = req.body;
      if (!appId) {
        return res.status(400).json({ message: "appId is required" });
      }
      const access = await storage.setFeatureAccess({
        userId: req.params.id as string,
        appId,
        enabled: enabled !== false,
        grantedBy: adminId,
      });
      res.json(access);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- User: own feature access ---
  app.get("/api/features", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const features = await storage.getFeatureAccessForUser(userId);
      res.json(features);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- App configs (public for dashboard tooltips) ---
  app.get("/api/apps", requireAuth, async (_req, res) => {
    try {
      const configs = await storage.listAppConfigs();
      res.json(configs);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/apps/:appId", requireAuth, async (req, res) => {
    try {
      const appId = req.params.appId as string;
      const config = await storage.getAppConfig(appId);
      if (!config) {
        return res.status(404).json({ message: "App not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: App config management ---
  app.get("/api/admin/apps", requireAdmin, async (_req, res) => {
    try {
      const configs = await storage.listAppConfigs();
      res.json(configs);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/apps/:appId", requireAdmin, async (req, res) => {
    try {
      const parsed = updateAppConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
      }
      const appId = req.params.appId as string;
      const config = await storage.upsertAppConfig(appId, parsed.data);
      res.json(config);
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- NDA ---
  app.get("/api/nda/status", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (user.role === "admin" || user.role === "operator") {
        return res.json({ signed: true, isAdmin: user.role === "admin" });
      }
      const sig = await storage.getNdaSignature(userId);
      // Demo user is always considered to have signed the NDA
      const isDemo = user.username === "demo";
      
      res.json({
        signed: !!sig || isDemo,
        isAdmin: false,
        signature: sig ? {
          firstName: sig.firstName,
          lastName: sig.lastName,
          company: sig.company,
          street: sig.street,
          city: sig.city,
          country: sig.country,
          signatureText: sig.signatureText,
          initialsPage1: sig.initialsPage1,
          initialsPage2: sig.initialsPage2,
          initialsPage3: sig.initialsPage3,
          initialsPage4: sig.initialsPage4,
          ndaVersion: sig.ndaVersion,
          signedAt: sig.signedAt,
        } : (isDemo ? {
          firstName: "Demo",
          lastName: "User",
          company: "CareFlow Demo",
          street: "Main St",
          city: "Berlin",
          country: "Germany",
          signatureText: "Demo User",
          initialsPage1: "DU",
          initialsPage2: "DU",
          initialsPage3: "DU",
          initialsPage4: "DU",
          ndaVersion: "2.0",
          signedAt: new Date().toISOString(),
        } : null),
      });

    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/nda/sign", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const existing = await storage.getNdaSignature(userId);
      if (existing) {
        return res.status(409).json({ message: "NDA already signed" });
      }

      const parsed = ndaSignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
      }

      const sig = await storage.createNdaSignature({
        userId,
        ...parsed.data,
        ndaVersion: "2.0",
      });

      await storage.createActivityLog({
        userId,
        action: "nda_signed",
        route: "/nda",
        metadata: {
          ndaVersion: "2.0",
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          company: parsed.data.company,
          city: parsed.data.city,
          country: parsed.data.country,
          signedAt: sig.signedAt,
        },
      });

      res.json({ signed: true, signature: sig });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/nda/download-log", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const sig = await storage.getNdaSignature(userId);
      if (!sig) {
        return res.status(400).json({ message: "NDA not signed" });
      }
      await storage.createActivityLog({
        userId,
        action: "nda_downloaded",
        route: "/nda",
        metadata: {
          ndaVersion: sig.ndaVersion,
          downloadedAt: new Date().toISOString(),
          signerName: `${sig.firstName} ${sig.lastName}`,
          company: sig.company,
        },
      });
      res.json({ logged: true });
    } catch (error) {
      console.error("DEBUG - API error detail:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        postgresError: (error as any).detail || (error as any).hint
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
