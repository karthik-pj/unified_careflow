import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users, appConfigs } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultApps = [
  {
    appId: "carebuild",
    name: "CareBuild",
    subtitle: "Digital Twin",
    description: "Create and manage digital twins of healthcare facilities, enabling virtual planning, simulation and optimization of medical infrastructure.",
    useCases: "Hospital floor planning and space optimization\nEquipment placement simulation\nConstruction project tracking\nFacility lifecycle management\nEnergy efficiency modeling",
    color: "#2e5cbf",
  },
  {
    appId: "careset",
    name: "CareSet",
    subtitle: "Infrastructure",
    description: "Monitor and manage healthcare IT infrastructure, networks, and connected medical devices across your organization.",
    useCases: "Network topology mapping\nDevice inventory management\nInfrastructure health monitoring\nCapacity planning and forecasting\nCompliance documentation",
    color: "#008ed3",
  },
  {
    appId: "carevie",
    name: "CareView",
    subtitle: "Asset Tracking",
    description: "Real-time tracking and management of medical assets, equipment, and supplies throughout healthcare facilities.",
    useCases: "Medical equipment location tracking\nAsset utilization analytics\nMaintenance scheduling\nInventory optimization\nLoss prevention and theft detection",
    color: "#6B5FA0",
  },
  {
    appId: "carealert",
    name: "CareAlert",
    subtitle: "Geofencing",
    description: "Set up intelligent geofences and location-based alerts for patients, staff, and equipment within healthcare environments.",
    useCases: "Patient wandering prevention\nStaff zone monitoring\nEquipment boundary alerts\nEmergency zone notifications\nVisitor access management",
    color: "#D4952A",
  },
  {
    appId: "carelog",
    name: "CareLog",
    subtitle: "Logistics",
    description: "Streamline healthcare logistics including supply chain management, delivery tracking, and resource distribution.",
    useCases: "Supply chain optimization\nMedication delivery tracking\nWaste management coordination\nVendor management\nCost analysis and reporting",
    color: "#3DA4D4",
  },
  {
    appId: "carepath",
    name: "CarePath",
    subtitle: "Analytics",
    description: "Advanced analytics and reporting platform providing insights into healthcare operations, patient flows, and organizational performance.",
    useCases: "Patient flow analysis\nOperational KPI dashboards\nPredictive resource planning\nBenchmarking and trend analysis\nCustom report generation",
    color: "#C0503A",
  },
  {
    appId: "careorg",
    name: "CareOrg",
    subtitle: "Orchestration",
    description: "Orchestrate complex healthcare workflows, coordinate between departments, and automate routine operational processes.",
    useCases: "Cross-department workflow automation\nShift and staff scheduling\nTask assignment and escalation\nProcess standardization\nIntegration hub for third-party systems",
    color: "#4DB8A8",
  },
  {
    appId: "careapi",
    name: "CareAPI",
    subtitle: "FHIR Access",
    description: "Secure FHIR-compliant API gateway providing standardized access to healthcare data across systems and applications.",
    useCases: "FHIR R4 resource management\nHL7 message transformation\nThird-party EHR integration\nAPI key and access management\nData interoperability compliance",
    color: "#5A5A5A",
  },
];

export async function seedDatabase() {
  const adminUser = await storage.getUserByUsername("admin");
  const adminHashed = await hashPassword("admin123");

  if (!adminUser) {
    await storage.createUser({
      username: "admin",
      password: adminHashed,
      displayName: "Administrator",
      role: "admin",
      status: "active",
    });
    console.log("Seeded admin user: admin / admin123");
  } else {
    await db
      .update(users)
      .set({ password: adminHashed, role: "admin", displayName: "Administrator", status: "active" })
      .where(eq(users.id, adminUser.id));
    console.log("Reset admin password and role");
  }

  const demoUser = await storage.getUserByUsername("demo");
  const demoHashed = await hashPassword("demo123");

  if (!demoUser) {
    await storage.createUser({
      username: "demo",
      password: demoHashed,
      displayName: "Demo User",
      role: "user",
      status: "active",
      allowedPages: "dashboard,buildings,gateways,beacons,live_tracking,signal_diagnostics",
    });
    console.log("Seeded demo user: demo / demo123");
  } else {
    await db
      .update(users)
      .set({ 
        password: demoHashed, 
        role: "user", 
        displayName: "Demo User", 
        status: "active",
        allowedPages: "dashboard,buildings,gateways,beacons,live_tracking,signal_diagnostics"
      })
      .where(eq(users.id, demoUser.id));
    console.log("Reset demo password and role");
  }


  // Cleanup legacy demo user if exists
  const legacyDemo = await storage.getUserByUsername("demo@careflow.com");
  if (legacyDemo) {
    await storage.deleteUser(legacyDemo.id);
    console.log("Deleted legacy demo user");
  }


  for (const app of defaultApps) {
    const existing = await storage.getAppConfig(app.appId);
    if (!existing) {
      await storage.upsertAppConfig(app.appId, {
        name: app.name,
        subtitle: app.subtitle,
        description: app.description,
        useCases: app.useCases,
        color: app.color,
        pageUrl: app.appId === "careset" ? "http://127.0.0.1:5000" : null,
      });
    } else if (app.appId === "careset") {
      await storage.upsertAppConfig(app.appId, {
        pageUrl: "http://127.0.0.1:5000",
      });
    }

  }
  console.log("App configs seeded");
}
