import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Radio,
  Search,
  ShieldAlert,
  Package,
  BarChart3,
  Settings2,
  Plug,
  FileText,
  ExternalLink,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AppConfig } from "@shared/schema";

const appDefaults = [
  { appId: "carebuild", name: "CareBuild", subtitle: "Digital Twin", icon: Building2, color: "#2e5cbf", angle: 0 },
  { appId: "careset", name: "CareSet", subtitle: "Infrastructure", icon: Radio, color: "#008ed3", angle: 45 },
  { appId: "carevie", name: "CareView", subtitle: "Asset Tracking", icon: Search, color: "#6B5FA0", angle: 90 },
  { appId: "carealert", name: "CareAlert", subtitle: "Geofencing", icon: ShieldAlert, color: "#D4952A", angle: 135 },
  { appId: "carelog", name: "CareLog", subtitle: "Logistics", icon: Package, color: "#3DA4D4", angle: 180 },
  { appId: "carepath", name: "CarePath", subtitle: "Analytics", icon: BarChart3, color: "#C0503A", angle: 225 },
  { appId: "careorg", name: "CareOrg", subtitle: "Orchestration", icon: Settings2, color: "#4DB8A8", angle: 270 },
  { appId: "careapi", name: "CareAPI", subtitle: "FHIR Access", icon: Plug, color: "#5A5A5A", angle: 315 },
];
export function AppsCircle({ size = 500 }: { size?: number }) {
  const nodeSize = size * 0.27;
  const iconSize = size * 0.08;
  const radius = size * 0.40;
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const { data: appConfigs } = useQuery<AppConfig[]>({
    queryKey: ["/api/apps"],
  });

  const formatUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://${url}`;
  };

  const handleOpenApp = async (appId: string, baseUrl: string) => {
    if (appId === "careset") {
      try {
        const response = await apiRequest("GET", "/api/auth/sso-token");
        const { token } = await response.json();
        const url = new URL(formatUrl(baseUrl));
        url.searchParams.set("sso_token", token);
        window.open(url.toString(), "_blank");
        return;
      } catch (error) {
        console.error("Failed to fetch SSO token:", error);
        // Fallback to normal open if SSO fails
        window.open(formatUrl(baseUrl), "_blank");
        return;
      }
    }
    window.open(formatUrl(baseUrl), "_blank");
  };

  const configMap = new Map<string, AppConfig>();
  appConfigs?.forEach((c) => configMap.set(c.appId, c));

  return (
    <div className="relative" style={{ width: size, height: size }} data-testid="apps-circle">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
      </svg>

      {appDefaults.map((app, i) => {
        const rad = (app.angle - 90) * (Math.PI / 180);
        const x = size / 2 + radius * Math.cos(rad) - nodeSize / 2;
        const y = size / 2 + radius * Math.sin(rad) - nodeSize / 2;
        const Icon = app.icon;
        const config = configMap.get(app.appId);
        const isHovered = hoveredApp === app.appId;

        const tooltipOnRight = app.angle < 180;
        const tooltipX = tooltipOnRight ? x + nodeSize + 12 : x - 290;
        const tooltipY = Math.max(10, Math.min(y + nodeSize / 2 - 80, size - 220));

        return (
          <div key={app.name}>
            <motion.div
              className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer"
              style={{
                width: nodeSize,
                height: nodeSize,
                left: x,
                top: y,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.97), rgba(255,255,255,0.88))`,
                border: `2.5px solid ${app.color}`,
                boxShadow: `0 4px 20px ${app.color}35, 0 2px 8px rgba(0,0,0,0.1)`,
                zIndex: isHovered ? 30 : 5,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.15, boxShadow: `0 8px 32px ${app.color}50, 0 4px 12px rgba(0,0,0,0.15)` }}
              onMouseEnter={() => setHoveredApp(app.appId)}
              onMouseLeave={() => setHoveredApp(null)}
              onClick={() => {
                const url = config?.pageUrl || (app as any).pageUrl;
                if (url) {
                  handleOpenApp(app.appId, url);
                }
              }}
              data-testid={`app-node-${app.name.toLowerCase()}`}
            >
              <Icon className="mb-1" style={{ color: app.color, width: iconSize, height: iconSize }} />
              <span className="font-semibold text-center leading-tight" style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif', fontSize: size * 0.032 }}>
                {app.name}
              </span>
              <span className="text-center leading-tight" style={{ color: "#6B7280", fontSize: size * 0.02 }}>
                {config?.subtitle || app.subtitle}
              </span>
            </motion.div>

            <AnimatePresence>
              {isHovered && config && (
                <motion.div
                  className="absolute pointer-events-auto"
                  style={{
                    left: tooltipX,
                    top: tooltipY,
                    width: 280,
                    zIndex: 50,
                  }}
                  initial={{ opacity: 0, scale: 0.92, x: tooltipOnRight ? -10 : 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92, x: tooltipOnRight ? -10 : 10 }}
                  transition={{ duration: 0.18 }}
                  onMouseEnter={() => setHoveredApp(app.appId)}
                  onMouseLeave={() => setHoveredApp(null)}
                  data-testid={`app-tooltip-${app.appId}`}
                >
                  <div
                    className="rounded-md p-4 backdrop-blur-md"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      border: `1.5px solid ${app.color}40`,
                      boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px ${app.color}15`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon style={{ color: app.color, width: 20, height: 20 }} />
                      <div>
                        <div className="font-bold text-sm" style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}>
                          {config.name}
                        </div>
                        <div className="text-xs" style={{ color: app.color }}>
                          {config.subtitle}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#374151" }}>
                      {config.description}
                    </p>

                    {config.useCases && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>
                          Use Cases
                        </div>
                        <ul className="space-y-0.5">
                          {config.useCases.split("\n").filter(Boolean).slice(0, 4).map((uc, idx) => (
                            <li key={idx} className="text-xs flex items-start gap-1.5" style={{ color: "#4B5563" }}>
                              <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: app.color }} />
                              {uc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {(config.pageUrl || (app as any).pageUrl) && (
                        <button
                          onClick={() => handleOpenApp(app.appId, config.pageUrl || (app as any).pageUrl)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded cursor-pointer"
                          style={{ color: app.color, background: `${app.color}12` }}
                          data-testid={`app-link-${app.appId}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open App
                        </button>
                      )}
                      {config.datasheetUrl && (
                        <a
                          href={`/datasheet/${app.appId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                          style={{ color: "#6B7280", background: "rgba(107,127,160,0.08)" }}
                          data-testid={`app-datasheet-${app.appId}`}
                        >
                          <FileText className="w-3 h-3" />
                          Datasheet
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
