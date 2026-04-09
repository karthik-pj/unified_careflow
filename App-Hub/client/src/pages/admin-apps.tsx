import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Pencil,
  AppWindow,
  Building2,
  Radio,
  Search,
  ShieldAlert,
  Package,
  BarChart3,
  Settings2,
  Plug,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useState } from "react";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";
import type { AppConfig } from "@shared/schema";

const iconMap: Record<string, any> = {
  carebuild: Building2,
  careset: Radio,
  carevie: Search,
  carealert: ShieldAlert,
  carelog: Package,
  carepath: BarChart3,
  careorg: Settings2,
  careapi: Plug,
};

export default function AdminAppsPage() {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppConfig | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    useCases: "",
    pageUrl: "",
    datasheetUrl: "",
    color: "",
  });

  const appsQuery = useQuery<AppConfig[]>({
    queryKey: ["/api/admin/apps"],
  });

  const editMutation = useMutation({
    mutationFn: async ({ appId, data }: { appId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/apps/${appId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
      toast({ title: "App updated successfully" });
      setEditOpen(false);
      setSelectedApp(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating app", description: error.message, variant: "destructive" });
    },
  });

  function openEditDialog(app: AppConfig) {
    setSelectedApp(app);
    setEditForm({
      name: app.name,
      subtitle: app.subtitle,
      description: app.description,
      useCases: app.useCases,
      pageUrl: app.pageUrl || "",
      datasheetUrl: app.datasheetUrl || "",
      color: app.color,
    });
    setEditOpen(true);
  }

  function handleEditSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!selectedApp) return;
    editMutation.mutate({
      appId: selectedApp.appId,
      data: {
        ...editForm,
        pageUrl: editForm.pageUrl || null,
        datasheetUrl: editForm.datasheetUrl || null,
      },
    });
  }

  if (appsQuery.isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
      >
        <header className="sticky top-0 z-50 px-4 md:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <Skeleton className="h-10 w-40 bg-white/20" />
            <Skeleton className="h-9 w-32 bg-white/20" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4 w-full">
          <Skeleton className="h-10 w-64 bg-white/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md bg-white/10" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const apps = appsQuery.data || [];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full -top-[300px] -left-[200px] opacity-15"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full -bottom-[200px] -right-[150px] opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
        />
      </div>

      <header className="relative z-20 sticky top-0 px-4 md:px-6 py-3" style={{ background: "rgba(46, 92, 191, 0.6)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={careflowLogo} alt="CareFlow" className="h-10 w-auto drop-shadow-lg" data-testid="img-admin-apps-logo" />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/users" data-testid="link-admin-users">
              <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md">
                Users
              </Button>
            </Link>
            <Link href="/dashboard" data-testid="link-back-dashboard">
              <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 w-full flex-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <AppWindow className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-page-title"
            >
              App Management
            </h1>
            <p className="text-sm text-white/70">
              Configure app details, descriptions, and links
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="app-config-list">
          {apps.map((app) => {
            const Icon = iconMap[app.appId] || AppWindow;
            return (
              <Card
                key={app.appId}
                className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible"
                data-testid={`card-app-${app.appId}`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: app.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold text-sm"
                            style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
                            data-testid={`text-app-name-${app.appId}`}
                          >
                            {app.name}
                          </span>
                          <span className="text-xs" style={{ color: app.color }}>
                            {app.subtitle}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-app-desc-${app.appId}`}>
                          {app.description || "No description set"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {app.pageUrl && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <ExternalLink className="w-3 h-3" />
                              Page linked
                            </span>
                          )}
                          {app.datasheetUrl && (
                            <a
                              href={`/datasheet/${app.appId}`}
                              className="inline-flex items-center gap-1 text-xs"
                              style={{ color: app.color }}
                              data-testid={`link-datasheet-${app.appId}`}
                            >
                              <FileText className="w-3 h-3" />
                              View Datasheet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(app)}
                      data-testid={`button-edit-app-${app.appId}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <footer className="relative z-20 text-center py-4">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
        </p>
      </footer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-app">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-edit-app-title"
            >
              Edit {selectedApp?.name}
            </DialogTitle>
            <DialogDescription>
              Update app details, description, and links
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  data-testid="input-app-name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Subtitle</label>
                <Input
                  value={editForm.subtitle}
                  onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                  data-testid="input-app-subtitle"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="resize-none text-sm"
                rows={3}
                data-testid="input-app-description"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Use Cases (one per line)</label>
              <Textarea
                value={editForm.useCases}
                onChange={(e) => setEditForm({ ...editForm, useCases: e.target.value })}
                className="resize-none text-sm"
                rows={4}
                placeholder={"Use case 1\nUse case 2\nUse case 3"}
                data-testid="input-app-usecases"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Page URL</label>
              <Input
                value={editForm.pageUrl}
                onChange={(e) => setEditForm({ ...editForm, pageUrl: e.target.value })}
                placeholder="https://app.careflow.com/carebuild"
                data-testid="input-app-pageurl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Datasheet URL (PDF or document link)</label>
              <Input
                value={editForm.datasheetUrl}
                onChange={(e) => setEditForm({ ...editForm, datasheetUrl: e.target.value })}
                placeholder="https://docs.careflow.com/carebuild-datasheet.pdf"
                data-testid="input-app-datasheeturl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-9 h-9 rounded cursor-pointer border-0"
                  data-testid="input-app-color"
                />
                <Input
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="flex-1"
                  placeholder="#2e5cbf"
                  data-testid="input-app-color-hex"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-testid="button-cancel-edit-app"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
                style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                className="text-white"
                data-testid="button-submit-edit-app"
              >
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
