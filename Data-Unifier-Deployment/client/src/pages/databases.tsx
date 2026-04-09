import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, invalidateAll } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Database,
  Trash2,
  Server,
  Shield,
  Layers,
} from "lucide-react";

export default function Databases() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["databases"],
    queryFn: api.databases.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.databases.create(data as any),
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      toast({ title: "Database configured", description: "Connection pool ready" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.databases.delete(id),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Database config removed" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.databases.update(id, { isActive } as any),
    onSuccess: () => invalidateAll(),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      host: formData.get("host") as string,
      port: parseInt(formData.get("port") as string) || 5432,
      database: formData.get("database") as string,
      username: formData.get("username") as string,
      schemaPrefix: formData.get("schemaPrefix") as string || undefined,
      poolSize: parseInt(formData.get("poolSize") as string) || 20,
      isActive: true,
    });
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Database Configurations
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage shared PostgreSQL connections for your unified database strategy
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-database" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Add Database Connection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input data-testid="input-db-name" id="name" name="name" placeholder="production-central" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input data-testid="input-db-host" id="host" name="host" placeholder="db.example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input data-testid="input-db-port" id="port" name="port" type="number" placeholder="5432" defaultValue="5432" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input data-testid="input-db-database" id="database" name="database" placeholder="fleet_db" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input data-testid="input-db-username" id="username" name="username" placeholder="fleet_admin" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schemaPrefix">Schema Prefix</Label>
                  <Input data-testid="input-db-schema" id="schemaPrefix" name="schemaPrefix" placeholder="app_" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poolSize">Pool Size</Label>
                  <Input data-testid="input-db-pool" id="poolSize" name="poolSize" type="number" placeholder="20" defaultValue="20" />
                </div>
              </div>
              <Button data-testid="button-submit-database" type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Connecting..." : "Add Connection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Unified Database Strategy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All your applications connect to a single centralized PostgreSQL database using schema-based separation.
              Configure PgBouncer connection pooling for optimal performance across edge nodes.
              Each app gets its own schema prefix while sharing a common data layer.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (!configs || configs.length === 0) ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">No database connections</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Configure your centralized PostgreSQL database connection to unify data across all applications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              data-testid={`card-db-${config.id}`}
              className="bg-card border border-card-border rounded-xl p-5 animate-slide-up"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.isActive ? "bg-terminal-green/10" : "bg-muted"}`}>
                    <Database className={`w-5 h-5 ${config.isActive ? "text-terminal-green" : "text-muted-foreground"}`} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-sm font-semibold text-foreground">{config.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${config.isActive ? "bg-terminal-green/10 text-terminal-green" : "bg-muted text-muted-foreground"}`}>
                        {config.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Server className="w-3 h-3" />
                        <span className="font-mono">{config.host}:{config.port}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Database className="w-3 h-3" />
                        <span className="font-mono">{config.database}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        <span className="font-mono">Pool: {config.poolSize}</span>
                      </div>
                    </div>

                    {config.schemaPrefix && (
                      <div className="mt-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          Schema: <span className="text-foreground">{config.schemaPrefix}*</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    data-testid={`switch-db-active-${config.id}`}
                    checked={config.isActive}
                    onCheckedChange={(isActive) => toggleMutation.mutate({ id: config.id, isActive })}
                  />
                  <Button
                    data-testid={`button-delete-db-${config.id}`}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(config.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
