import { useQuery, useMutation } from "@tanstack/react-query";
import { api, invalidateAll } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Server,
  AppWindow,
  Rocket,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent = "primary",
  testId,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  testId: string;
}) {
  const accentColors: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    amber: "text-terminal-amber bg-terminal-amber/10",
    red: "text-terminal-red bg-terminal-red/10",
    cyan: "text-terminal-cyan bg-terminal-cyan/10",
  };

  return (
    <div
      data-testid={testId}
      className="bg-card border border-card-border rounded-xl p-5 animate-slide-up"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
      </div>
      <div className="font-display text-3xl font-bold text-foreground tracking-tight">
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {subtitle && (
        <div className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-wider">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.stats,
    refetchInterval: 30000,
  });

  const { data: nodes } = useQuery({
    queryKey: ["nodes"],
    queryFn: api.nodes.list,
  });

  const { data: deployments } = useQuery({
    queryKey: ["deployments"],
    queryFn: api.deployments.list,
  });

  const clearMutation = useMutation({
    mutationFn: api.sampleData.clear,
    onSuccess: (data) => {
      invalidateAll();
      toast({ title: "Sample data cleared", description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const hasData = (stats?.totalNodes ?? 0) > 0 || (stats?.totalApps ?? 0) > 0;

  return (
    <Layout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Command Center
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor your fleet of edge nodes, applications, and deployments
          </p>
        </div>
        {hasData && (
          <Button
            data-testid="button-clear-sample-data"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
            onClick={() => {
              if (window.confirm("This will delete ALL nodes, apps, deployments, database configs, and schema mappings. Continue?")) {
                clearMutation.mutate();
              }
            }}
            disabled={clearMutation.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {clearMutation.isPending ? "Clearing..." : "Clear All Data"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            testId="stat-nodes"
            label="Edge Nodes"
            value={stats?.totalNodes ?? 0}
            subtitle={`${stats?.onlineNodes ?? 0} online`}
            icon={Server}
            accent="primary"
          />
          <StatCard
            testId="stat-apps"
            label="Applications"
            value={stats?.totalApps ?? 0}
            subtitle={`${stats?.activeApps ?? 0} running`}
            icon={AppWindow}
            accent="cyan"
          />
          <StatCard
            testId="stat-deployments"
            label="Deployments (24h)"
            value={stats?.recentDeployments ?? 0}
            subtitle={`${stats?.totalDeployments ?? 0} total`}
            icon={Rocket}
            accent="amber"
          />
          <StatCard
            testId="stat-failures"
            label="Failed Deployments"
            value={stats?.failedDeployments ?? 0}
            subtitle={`${stats?.activeDatabases ?? 0} active databases`}
            icon={AlertTriangle}
            accent="red"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" strokeWidth={2} />
            <h3 className="font-display text-sm font-semibold text-foreground">Node Fleet</h3>
          </div>
          <div className="divide-y divide-card-border">
            {(!nodes || nodes.length === 0) ? (
              <div className="p-8 text-center">
                <Server className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No edge nodes registered yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first node to get started</p>
              </div>
            ) : (
              nodes.slice(0, 5).map((node) => (
                <div key={node.id} data-testid={`node-row-${node.id}`} className="px-5 py-3 flex items-center gap-4">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      node.status === "online"
                        ? "bg-terminal-green animate-pulse-glow"
                        : node.status === "degraded"
                        ? "bg-terminal-amber"
                        : "bg-terminal-red"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{node.hostname}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">{node.location}</p>
                    <div className="flex items-center gap-2 mt-0.5 justify-end">
                      <span className="text-[10px] font-mono text-muted-foreground">CPU {node.cpuUsage}%</span>
                      <span className="text-[10px] font-mono text-muted-foreground">MEM {node.memoryUsage}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" strokeWidth={2} />
            <h3 className="font-display text-sm font-semibold text-foreground">Recent Deployments</h3>
          </div>
          <div className="divide-y divide-card-border">
            {(!deployments || deployments.length === 0) ? (
              <div className="p-8 text-center">
                <Rocket className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No deployments yet</p>
                <p className="text-xs text-muted-foreground mt-1">Deploy your first app to see activity</p>
              </div>
            ) : (
              deployments.slice(0, 5).map((dep) => (
                <div key={dep.id} data-testid={`deploy-row-${dep.id}`} className="px-5 py-3 flex items-center gap-4">
                  {dep.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-terminal-green flex-shrink-0" />
                  ) : dep.status === "failed" ? (
                    <AlertTriangle className="w-4 h-4 text-terminal-red flex-shrink-0" />
                  ) : dep.status === "running" ? (
                    <Activity className="w-4 h-4 text-terminal-amber flex-shrink-0 animate-pulse" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">v{dep.version}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {dep.applicationId.slice(0, 8)}... → {dep.nodeId.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                        dep.status === "success"
                          ? "bg-terminal-green/10 text-terminal-green"
                          : dep.status === "failed"
                          ? "bg-terminal-red/10 text-terminal-red"
                          : dep.status === "running"
                          ? "bg-terminal-amber/10 text-terminal-amber"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
