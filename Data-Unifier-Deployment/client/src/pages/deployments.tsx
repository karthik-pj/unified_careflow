import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, invalidateAll } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function Deployments() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments"],
    queryFn: api.deployments.list,
    refetchInterval: 30000,
  });

  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: api.apps.list,
  });

  const { data: nodes } = useQuery({
    queryKey: ["nodes"],
    queryFn: api.nodes.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.deployments.create(data as any),
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      toast({ title: "Deployment initiated", description: "Rolling out to target node" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.deployments.update(id, { status } as any),
    onSuccess: () => invalidateAll(),
  });

  const [selectedApp, setSelectedApp] = useState("");
  const [selectedNode, setSelectedNode] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      applicationId: selectedApp,
      nodeId: selectedNode,
      version: formData.get("version") as string,
      status: "pending",
    });
  }

  const appMap = new Map((apps || []).map((a) => [a.id, a]));
  const nodeMap = new Map((nodes || []).map((n) => [n.id, n]));

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-terminal-green" />;
      case "failed": return <AlertTriangle className="w-4 h-4 text-terminal-red" />;
      case "running": return <Activity className="w-4 h-4 text-terminal-amber animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusColors: Record<string, string> = {
    success: "bg-terminal-green/10 text-terminal-green",
    failed: "bg-terminal-red/10 text-terminal-red",
    running: "bg-terminal-amber/10 text-terminal-amber",
    pending: "bg-muted text-muted-foreground",
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Deployments
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage application deployments across your edge fleet
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-deployment" className="gap-2">
              <Plus className="w-4 h-4" />
              New Deployment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border">
            <DialogHeader>
              <DialogTitle className="font-display">Create Deployment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Application</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger data-testid="select-deploy-app">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {(apps || []).map((app) => (
                      <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Node</Label>
                <Select value={selectedNode} onValueChange={setSelectedNode}>
                  <SelectTrigger data-testid="select-deploy-node">
                    <SelectValue placeholder="Select target node" />
                  </SelectTrigger>
                  <SelectContent>
                    {(nodes || []).map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input data-testid="input-deploy-version" id="version" name="version" placeholder="1.2.3" required />
              </div>
              <Button
                data-testid="button-submit-deployment"
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || !selectedApp || !selectedNode}
              >
                {createMutation.isPending ? "Deploying..." : "Deploy"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (!deployments || deployments.length === 0) ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center">
          <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">No deployments yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create your first deployment to roll out an application to your edge nodes.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-card-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            <span>Status</span>
            <span>Application</span>
            <span></span>
            <span>Target Node</span>
            <span>Version</span>
            <span>Time</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-card-border">
            {deployments.map((dep) => {
              const app = appMap.get(dep.applicationId);
              const node = nodeMap.get(dep.nodeId);

              return (
                <div
                  key={dep.id}
                  data-testid={`row-deployment-${dep.id}`}
                  className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors"
                >
                  <div>{statusIcon(dep.status)}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{app?.name || dep.applicationId.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{dep.applicationId.slice(0, 12)}...</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{node?.name || dep.nodeId.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{node?.location || dep.nodeId.slice(0, 12)}</p>
                  </div>
                  <span className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded">
                    v{dep.version}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {dep.startedAt ? new Date(dep.startedAt).toLocaleString() : "—"}
                  </span>
                  <Select
                    value={dep.status}
                    onValueChange={(status) => updateMutation.mutate({ id: dep.id, status })}
                  >
                    <SelectTrigger data-testid={`select-deploy-status-${dep.id}`} className="w-28 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
