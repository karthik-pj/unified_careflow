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
  TableProperties,
  Trash2,
  ArrowRight,
  Copy,
  Filter,
  Columns3,
  Table2,
} from "lucide-react";

const FIELD_TYPES = [
  "text", "varchar", "integer", "bigint", "boolean",
  "timestamp", "date", "jsonb", "uuid", "decimal", "serial",
];

export default function SchemaMappings() {
  const [open, setOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [filterApp, setFilterApp] = useState<string>("all");
  const [filterVersion, setFilterVersion] = useState<string>("all");
  const { toast } = useToast();

  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: api.apps.list,
  });

  const { data: allMappings, isLoading } = useQuery({
    queryKey: ["mappings"],
    queryFn: api.mappings.list,
  });

  const filteredMappings = (allMappings || []).filter((m) => {
    if (filterApp !== "all" && m.applicationId !== filterApp) return false;
    if (filterVersion !== "all" && m.version !== filterVersion) return false;
    return true;
  });

  const versions = [...new Set((allMappings || []).map((m) => m.version))].sort();
  const appVersions = filterApp !== "all"
    ? [...new Set((allMappings || []).filter((m) => m.applicationId === filterApp).map((m) => m.version))].sort()
    : versions;

  const groupedByTable = filteredMappings.reduce<Record<string, typeof filteredMappings>>((acc, m) => {
    const key = `${m.sourceTable} → ${m.targetTable}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const appMap = new Map((apps || []).map((a) => [a.id, a]));

  const [selectedApp, setSelectedApp] = useState("");
  const [formVersion, setFormVersion] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.mappings.create(data as any),
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      toast({ title: "Mapping created", description: "Field mapping added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.mappings.delete(id),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Mapping removed" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.mappings.update(id, { isActive } as any),
    onSuccess: () => invalidateAll(),
  });

  const [copyApp, setCopyApp] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [copyTo, setCopyTo] = useState("");

  const copyMutation = useMutation({
    mutationFn: () => api.mappings.copyToVersion(copyApp, copyFrom, copyTo),
    onSuccess: (result) => {
      invalidateAll();
      setCopyOpen(false);
      toast({ title: "Mappings copied", description: `${result.length} mappings carried to v${copyTo}` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      applicationId: selectedApp,
      version: formVersion,
      sourceTable: formData.get("sourceTable") as string,
      sourceField: formData.get("sourceField") as string,
      sourceType: formData.get("sourceType") as string,
      targetTable: formData.get("targetTable") as string,
      targetField: formData.get("targetField") as string,
      targetType: formData.get("targetType") as string,
      transformRule: (formData.get("transformRule") as string) || null,
      isActive: true,
    });
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Schema Mapping
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Map each app's original database fields to the unified central database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-copy-mappings" variant="secondary" className="gap-2">
                <Copy className="w-4 h-4" />
                Copy to Version
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-card-border">
              <DialogHeader>
                <DialogTitle className="font-display">Copy Mappings to New Version</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mb-4">
                When you update an app in Replit and push a new version, carry the existing field mappings forward so you only need to adjust what changed.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Application</Label>
                  <Select value={copyApp} onValueChange={setCopyApp}>
                    <SelectTrigger data-testid="select-copy-app">
                      <SelectValue placeholder="Select app" />
                    </SelectTrigger>
                    <SelectContent>
                      {(apps || []).map((app) => (
                        <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Version</Label>
                    <Input data-testid="input-copy-from" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} placeholder="1.0.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>To Version</Label>
                    <Input data-testid="input-copy-to" value={copyTo} onChange={(e) => setCopyTo(e.target.value)} placeholder="1.1.0" />
                  </div>
                </div>
                <Button
                  data-testid="button-submit-copy"
                  className="w-full"
                  disabled={!copyApp || !copyFrom || !copyTo || copyMutation.isPending}
                  onClick={() => copyMutation.mutate()}
                >
                  {copyMutation.isPending ? "Copying..." : "Copy Mappings"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-mapping" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-card-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Add Field Mapping</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Application</Label>
                    <Select value={selectedApp} onValueChange={setSelectedApp}>
                      <SelectTrigger data-testid="select-mapping-app">
                        <SelectValue placeholder="Select app" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apps || []).map((app) => (
                          <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Input data-testid="input-mapping-version" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} placeholder="1.0.0" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-card-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Table2 className="w-4 h-4 text-terminal-amber" />
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Source (App's DB)</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceTable">Table</Label>
                      <Input data-testid="input-source-table" id="sourceTable" name="sourceTable" placeholder="customers" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceField">Field</Label>
                      <Input data-testid="input-source-field" id="sourceField" name="sourceField" placeholder="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select name="sourceType" defaultValue="text">
                        <SelectTrigger data-testid="select-source-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Columns3 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">Target (Central DB)</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetTable">Table</Label>
                      <Input data-testid="input-target-table" id="targetTable" name="targetTable" placeholder="contacts" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetField">Field</Label>
                      <Input data-testid="input-target-field" id="targetField" name="targetField" placeholder="email_address" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select name="targetType" defaultValue="text">
                        <SelectTrigger data-testid="select-target-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transformRule">Transform Rule (optional)</Label>
                  <Input data-testid="input-transform-rule" id="transformRule" name="transformRule" placeholder="LOWER(value), CAST(value AS integer), CONCAT(first, ' ', last)" />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    SQL expression to transform the value during migration. Use "value" as placeholder for the source field.
                  </p>
                </div>

                <Button data-testid="button-submit-mapping" type="submit" className="w-full" disabled={createMutation.isPending || !selectedApp}>
                  {createMutation.isPending ? "Adding..." : "Add Field Mapping"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-terminal-amber/10 flex items-center justify-center flex-shrink-0">
            <TableProperties className="w-5 h-5 text-terminal-amber" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">How Schema Mapping Works</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each of your Replit apps has its own database tables and field names. When consolidating into a single central database,
              this lookup table defines how each app's original fields map to the unified schema. Mappings are versioned — when you
              update an app in Replit and deploy a new version, use <strong>"Copy to Version"</strong> to carry forward existing mappings,
              then adjust only the fields that changed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterApp} onValueChange={(v) => { setFilterApp(v); setFilterVersion("all"); }}>
          <SelectTrigger data-testid="filter-app" className="w-48">
            <SelectValue placeholder="All apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            {(apps || []).map((app) => (
              <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVersion} onValueChange={setFilterVersion}>
          <SelectTrigger data-testid="filter-version" className="w-36">
            <SelectValue placeholder="All versions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            {appVersions.map((v) => (
              <SelectItem key={v} value={v}>v{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground font-mono ml-auto">
          {filteredMappings.length} mapping{filteredMappings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center">
          <TableProperties className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">No schema mappings yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add field mappings to define how each app's database tables and columns translate to your central unified database.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByTable).map(([tableKey, mappings]) => {
            const [sourceTable, targetTable] = tableKey.split(" → ");
            const appName = appMap.get(mappings[0].applicationId)?.name || "Unknown";
            const version = mappings[0].version;

            return (
              <div
                key={tableKey + mappings[0].applicationId + version}
                className="bg-card border border-card-border rounded-xl overflow-hidden animate-slide-up"
              >
                <div className="px-5 py-3 border-b border-card-border flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-terminal-amber/10 text-terminal-amber">
                      {appName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                      v{version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-terminal-amber font-medium">{sourceTable}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-primary font-medium">{targetTable}</span>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_auto_auto_auto] gap-x-4 px-5 py-2 border-b border-card-border/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  <span>Source Field</span>
                  <span></span>
                  <span>Target Field</span>
                  <span>Transform</span>
                  <span>Active</span>
                  <span></span>
                </div>

                <div className="divide-y divide-card-border/50">
                  {mappings.map((m) => (
                    <div
                      key={m.id}
                      data-testid={`row-mapping-${m.id}`}
                      className="grid grid-cols-[1fr_auto_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 items-center hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-foreground">{m.sourceField}</span>
                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{m.sourceType}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-foreground">{m.targetField}</span>
                        <span className="text-[10px] font-mono text-primary/70 px-1.5 py-0.5 rounded bg-primary/5">{m.targetType}</span>
                      </div>
                      <div className="w-36">
                        {m.transformRule ? (
                          <span className="text-[10px] font-mono text-terminal-cyan bg-terminal-cyan/10 px-2 py-0.5 rounded truncate block">
                            {m.transformRule}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">direct</span>
                        )}
                      </div>
                      <Switch
                        data-testid={`switch-mapping-${m.id}`}
                        checked={m.isActive}
                        onCheckedChange={(isActive) => toggleMutation.mutate({ id: m.id, isActive })}
                        className="scale-75"
                      />
                      <Button
                        data-testid={`button-delete-mapping-${m.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(m.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
