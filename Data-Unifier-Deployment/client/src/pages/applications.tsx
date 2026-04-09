import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, invalidateAll } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AppWindow,
  Trash2,
  GitBranch,
  Globe,
  Play,
  Square,
} from "lucide-react";

export default function Applications() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: api.apps.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.apps.create(data as any),
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      toast({ title: "Application added", description: "Ready for deployment" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.apps.delete(id),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Application removed" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.apps.update(id, { status } as any),
    onSuccess: () => invalidateAll(),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      repository: formData.get("repository") as string || undefined,
      port: parseInt(formData.get("port") as string) || 3000,
      status: "inactive",
    });
  }

  const statusColors: Record<string, string> = {
    running: "bg-terminal-green/10 text-terminal-green border-terminal-green/20",
    inactive: "bg-muted text-muted-foreground border-muted",
    error: "bg-terminal-red/10 text-terminal-red border-terminal-red/20",
    deploying: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/20",
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Applications
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your application portfolio and configurations
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-app" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border">
            <DialogHeader>
              <DialogTitle className="font-display">Register Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Application Name</Label>
                <Input data-testid="input-app-name" id="name" name="name" placeholder="crm-dashboard" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea data-testid="input-app-description" id="description" name="description" placeholder="Customer relationship management dashboard" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository URL</Label>
                  <Input data-testid="input-app-repo" id="repository" name="repository" placeholder="github.com/org/repo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input data-testid="input-app-port" id="port" name="port" type="number" placeholder="3000" defaultValue="3000" />
                </div>
              </div>
              <Button data-testid="button-submit-app" type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Application"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (!apps || apps.length === 0) ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center">
          <AppWindow className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">No applications registered</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first application to start managing deployments across your edge fleet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {apps.map((app) => (
            <div
              key={app.id}
              data-testid={`card-app-${app.id}`}
              className="bg-card border border-card-border rounded-xl p-5 animate-slide-up flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AppWindow className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{app.name}</h3>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${statusColors[app.status] || statusColors.inactive}`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
                <Button
                  data-testid={`button-delete-app-${app.id}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(app.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {app.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{app.description}</p>
              )}

              <div className="flex-1" />

              <div className="space-y-2 mb-4">
                {app.repository && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="font-mono truncate">{app.repository}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-mono">Port {app.port}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {app.status === "running" ? (
                  <Button
                    data-testid={`button-stop-app-${app.id}`}
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => updateStatusMutation.mutate({ id: app.id, status: "inactive" })}
                  >
                    <Square className="w-3 h-3" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    data-testid={`button-start-app-${app.id}`}
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => updateStatusMutation.mutate({ id: app.id, status: "running" })}
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
