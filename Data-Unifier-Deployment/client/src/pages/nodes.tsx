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
  Server,
  Trash2,
  MapPin,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";

export default function Nodes() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["nodes"],
    queryFn: api.nodes.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.nodes.create(data as any),
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      toast({ title: "Node registered", description: "Edge node added to fleet" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.nodes.delete(id),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Node removed", description: "Edge node removed from fleet" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.nodes.update(id, { status } as any),
    onSuccess: () => invalidateAll(),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      hostname: formData.get("hostname") as string,
      ipAddress: formData.get("ipAddress") as string,
      location: formData.get("location") as string,
      os: formData.get("os") as string || "Ubuntu 22.04",
      status: "offline",
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
    });
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Edge Nodes
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your fleet of Linux edge servers
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-node" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Node
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border">
            <DialogHeader>
              <DialogTitle className="font-display">Register Edge Node</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Node Name</Label>
                <Input data-testid="input-node-name" id="name" name="name" placeholder="edge-eu-west-01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input data-testid="input-node-hostname" id="hostname" name="hostname" placeholder="edge01.example.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input data-testid="input-node-ip" id="ipAddress" name="ipAddress" placeholder="192.168.1.100" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input data-testid="input-node-location" id="location" name="location" placeholder="Frankfurt, DE" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="os">Operating System</Label>
                <Input data-testid="input-node-os" id="os" name="os" placeholder="Ubuntu 22.04" defaultValue="Ubuntu 22.04" />
              </div>
              <Button data-testid="button-submit-node" type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Registering..." : "Register Node"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (!nodes || nodes.length === 0) ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center">
          <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">No edge nodes yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Register your first Linux edge server to start deploying applications across your fleet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              data-testid={`card-node-${node.id}`}
              className="bg-card border border-card-border rounded-xl p-5 animate-slide-up"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      node.status === "online"
                        ? "bg-terminal-green animate-pulse-glow"
                        : node.status === "degraded"
                        ? "bg-terminal-amber"
                        : "bg-terminal-red"
                    }`}
                  />
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">{node.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{node.hostname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={node.status}
                    onValueChange={(status) => updateStatusMutation.mutate({ id: node.id, status })}
                  >
                    <SelectTrigger data-testid={`select-status-${node.id}`} className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    data-testid={`button-delete-node-${node.id}`}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(node.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{node.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{node.ipAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">CPU</span>
                  </div>
                  <div className="text-sm font-mono font-semibold text-foreground">{node.cpuUsage}%</div>
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (node.cpuUsage ?? 0) > 80 ? "bg-terminal-red" : (node.cpuUsage ?? 0) > 50 ? "bg-terminal-amber" : "bg-terminal-green"
                      }`}
                      style={{ width: `${node.cpuUsage ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MemoryStick className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">MEM</span>
                  </div>
                  <div className="text-sm font-mono font-semibold text-foreground">{node.memoryUsage}%</div>
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (node.memoryUsage ?? 0) > 80 ? "bg-terminal-red" : (node.memoryUsage ?? 0) > 50 ? "bg-terminal-amber" : "bg-terminal-green"
                      }`}
                      style={{ width: `${node.memoryUsage ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">DISK</span>
                  </div>
                  <div className="text-sm font-mono font-semibold text-foreground">{node.diskUsage}%</div>
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (node.diskUsage ?? 0) > 80 ? "bg-terminal-red" : (node.diskUsage ?? 0) > 50 ? "bg-terminal-amber" : "bg-terminal-green"
                      }`}
                      style={{ width: `${node.diskUsage ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-card-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{node.os}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : "Never"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
