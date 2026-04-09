import { queryClient } from "./queryClient";
import type { EdgeNode, Application, Deployment, DatabaseConfig, SchemaMapping } from "@shared/schema";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  stats: () => fetchJson<{
    totalNodes: number;
    onlineNodes: number;
    totalApps: number;
    activeApps: number;
    totalDeployments: number;
    recentDeployments: number;
    failedDeployments: number;
    activeDatabases: number;
  }>("/api/stats"),

  nodes: {
    list: () => fetchJson<EdgeNode[]>("/api/nodes"),
    get: (id: string) => fetchJson<EdgeNode>(`/api/nodes/${id}`),
    create: (data: Partial<EdgeNode>) => fetchJson<EdgeNode>("/api/nodes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<EdgeNode>) => fetchJson<EdgeNode>(`/api/nodes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/api/nodes/${id}`, { method: "DELETE" }),
  },

  apps: {
    list: () => fetchJson<Application[]>("/api/apps"),
    get: (id: string) => fetchJson<Application>(`/api/apps/${id}`),
    create: (data: Partial<Application>) => fetchJson<Application>("/api/apps", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Application>) => fetchJson<Application>(`/api/apps/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/api/apps/${id}`, { method: "DELETE" }),
  },

  deployments: {
    list: () => fetchJson<Deployment[]>("/api/deployments"),
    byApp: (appId: string) => fetchJson<Deployment[]>(`/api/deployments/app/${appId}`),
    byNode: (nodeId: string) => fetchJson<Deployment[]>(`/api/deployments/node/${nodeId}`),
    create: (data: Partial<Deployment>) => fetchJson<Deployment>("/api/deployments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Deployment>) => fetchJson<Deployment>(`/api/deployments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  databases: {
    list: () => fetchJson<DatabaseConfig[]>("/api/databases"),
    get: (id: string) => fetchJson<DatabaseConfig>(`/api/databases/${id}`),
    create: (data: Partial<DatabaseConfig>) => fetchJson<DatabaseConfig>("/api/databases", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<DatabaseConfig>) => fetchJson<DatabaseConfig>(`/api/databases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/api/databases/${id}`, { method: "DELETE" }),
  },

  mappings: {
    list: () => fetchJson<SchemaMapping[]>("/api/mappings"),
    byApp: (appId: string) => fetchJson<SchemaMapping[]>(`/api/mappings/app/${appId}`),
    byAppVersion: (appId: string, version: string) => fetchJson<SchemaMapping[]>(`/api/mappings/app/${appId}/version/${version}`),
    create: (data: Partial<SchemaMapping>) => fetchJson<SchemaMapping>("/api/mappings", { method: "POST", body: JSON.stringify(data) }),
    createBulk: (data: Partial<SchemaMapping>[]) => fetchJson<SchemaMapping[]>("/api/mappings/bulk", { method: "POST", body: JSON.stringify(data) }),
    copyToVersion: (applicationId: string, fromVersion: string, toVersion: string) => fetchJson<SchemaMapping[]>("/api/mappings/copy", { method: "POST", body: JSON.stringify({ applicationId, fromVersion, toVersion }) }),
    update: (id: string, data: Partial<SchemaMapping>) => fetchJson<SchemaMapping>(`/api/mappings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/api/mappings/${id}`, { method: "DELETE" }),
  },

  sampleData: {
    clear: () => fetchJson<{ message: string }>("/api/sample-data", { method: "DELETE" }),
  },
};

export function invalidateAll() {
  queryClient.invalidateQueries();
}
