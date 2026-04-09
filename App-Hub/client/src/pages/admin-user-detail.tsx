import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Pencil,
  KeyRound,
  Shield,
  User,
  LogIn,
  Eye,
  Rocket,
  Power,
  Clock,
  Activity,
  BarChart3,
  AppWindow,
  ToggleLeft,
} from "lucide-react";
import { useState } from "react";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";

interface UserRecord {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  email: string | null;
  fullName: string | null;
  legacyCaresetId: number | null;
  allowedPages: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ActivityRecord {
  id: number;
  userId: string;
  action: string;
  appId: string | null;
  route: string | null;
  durationSeconds: number | null;
  metadata: any;
  createdAt: string;
}

interface StatsRecord {
  totalSessions: number;
  totalDuration: number;
  appsUsed: string[];
}

interface FeatureRecord {
  id: number;
  userId: string;
  appId: string;
  enabled: boolean;
  grantedAt: string;
  grantedBy: string | null;
}

const appDefs = [
  { id: "carebuild", name: "CareBuild", color: "#2e5cbf" },
  { id: "careset", name: "CareSet", color: "#008ed3" },
  { id: "carevie", name: "CareView", color: "#6B5FA0" },
  { id: "carealert", name: "CareAlert", color: "#D4952A" },
  { id: "carelog", name: "CareLog", color: "#3DA4D4" },
  { id: "carepath", name: "CarePath", color: "#C0503A" },
  { id: "careorg", name: "CareOrg", color: "#4DB8A8" },
  { id: "careapi", name: "CareAPI", color: "#5A5A5A" },
];

const CARESET_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "buildings", label: "Buildings" },
  { id: "gateways", label: "Gateways" },
  { id: "beacons", label: "Beacons" },
  { id: "live_tracking", label: "Live Tracking" },
  { id: "alert_zones", label: "Alert Zones" },
  { id: "gateway_planning", label: "Gateway Planning" },
  { id: "mqtt", label: "MQTT Configuration" },
  { id: "user_management", label: "User Management" },
  { id: "signal_diagnostics", label: "Signal Diagnostics" },
];

function getActionIcon(action: string) {
  switch (action) {
    case "login":
      return <LogIn className="w-4 h-4" />;
    case "page_visit":
      return <Eye className="w-4 h-4" />;
    case "app_launch":
      return <Rocket className="w-4 h-4" />;
    case "app_close":
      return <Power className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "login":
      return "Logged in";
    case "page_visit":
      return "Visited page";
    case "app_launch":
      return "Launched app";
    case "app_close":
      return "Closed app";
    default:
      return action;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    email: "",
    fullName: "",
    displayName: "",
    role: "user",
    status: "active",
    legacyCaresetId: "",
    allowedPages: "",
  });

  const usersQuery = useQuery<UserRecord[]>({
    queryKey: ["/api/admin/users"],
  });

  const activityQuery = useQuery<ActivityRecord[]>({
    queryKey: ["/api/admin/users", params.id, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${params.id}/activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const statsQuery = useQuery<StatsRecord>({
    queryKey: ["/api/admin/users", params.id, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${params.id}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const featuresQuery = useQuery<FeatureRecord[]>({
    queryKey: ["/api/admin/users", params.id, "features"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${params.id}/features`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
      setEditOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${params.id}/password`, { password });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated" });
      setPasswordOpen(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error resetting password", description: error.message, variant: "destructive" });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async (data: { appId: string; enabled: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${params.id}/features`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", params.id, "features"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error toggling feature", description: error.message, variant: "destructive" });
    },
  });

  if (usersQuery.isLoading) {
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
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 w-full">
          <Skeleton className="h-48 w-full rounded-xl bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/10" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl bg-white/10" />
        </main>
      </div>
    );
  }

  const users = usersQuery.data || [];
  const user = users.find((u) => String(u.id) === String(params.id));

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
      >
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4" data-testid="text-user-not-found">User not found</p>
            <Link href="/admin/users">
              <Button variant="outline" data-testid="link-back-users-notfound">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (user.displayName || user.username)
    .split(/[@.\s]/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  function openEditDialog() {
    if (!user) return;
    setEditForm({
      email: user.email || "",
      fullName: user.fullName || "",
      displayName: user.displayName || "",
      role: user.role,
      status: user.status,
      legacyCaresetId: user.legacyCaresetId?.toString() || "",
      allowedPages: user.allowedPages || "",
    });
    setEditOpen(true);
  }

  function handleEditSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    editMutation.mutate(editForm);
  }

  function handlePasswordSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!newPassword) {
      toast({ title: "Password is required", variant: "destructive" });
      return;
    }
    resetPasswordMutation.mutate(newPassword);
  }

  const activities = activityQuery.data || [];
  const stats = statsQuery.data;
  const features = featuresQuery.data || [];

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
            <img src={careflowLogo} alt="CareFlow" className="h-10 w-auto drop-shadow-lg" data-testid="img-admin-logo" />
          </div>
          <Link href="/admin/users" data-testid="link-back-users">
            <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Users
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 w-full flex-1">
        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-user-info">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                  data-testid="avatar-user-detail"
                >
                  {initials}
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
                    data-testid="text-user-display-name"
                  >
                    {user.displayName || user.username}
                  </h1>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {user.username} {user.email && `(${user.email})`}
                  </p>
                  {user.fullName && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-user-fullname">
                      Full Name: {user.fullName}
                    </p>
                  )}
                  {user.legacyCaresetId && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-user-legacy-id">
                      Legacy CareSet ID: {user.legacyCaresetId}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="no-default-hover-elevate"
                      data-testid="badge-user-role"
                    >
                      {user.role === "admin" ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {user.role}
                    </Badge>
                    <Badge
                      variant={user.status === "active" ? "outline" : "destructive"}
                      className="no-default-hover-elevate"
                      data-testid="badge-user-status"
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" onClick={openEditDialog} data-testid="button-edit-user">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setNewPassword(""); setPasswordOpen(true); }}
                  data-testid="button-reset-password"
                >
                  <KeyRound className="w-4 h-4 mr-1" />
                  Reset Password
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="text-sm">
                <span className="text-muted-foreground">Created:</span>{" "}
                <span data-testid="text-user-created">{formatDate(user.createdAt)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Last Login:</span>{" "}
                <span data-testid="text-user-last-login">{formatDate(user.lastLoginAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="stats-section">
          {statsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : stats ? (
            <>
              <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-stat-sessions">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                    >
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                      <p className="text-xl font-bold" style={{ color: "#1a2332" }} data-testid="text-stat-sessions">
                        {stats.totalSessions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-stat-duration">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Duration</p>
                      <p className="text-xl font-bold" style={{ color: "#1a2332" }} data-testid="text-stat-duration">
                        {formatDuration(stats.totalDuration)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-stat-apps">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                    >
                      <AppWindow className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Apps Used</p>
                      <p className="text-xl font-bold" style={{ color: "#1a2332" }} data-testid="text-stat-apps">
                        {stats.appsUsed.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-feature-access">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle
              className="text-lg"
              style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-features-title"
            >
              <div className="flex items-center gap-2">
                <ToggleLeft className="w-5 h-5" style={{ color: "#2e5cbf" }} />
                Feature Access
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featuresQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="feature-toggles">
                {appDefs.map((app) => {
                  const feature = features.find((f) => f.appId === app.id);
                  const enabled = feature?.enabled ?? false;
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border"
                      data-testid={`feature-row-${app.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: app.color }}
                        >
                          {app.name.slice(4, 6).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#1a2332" }}>
                          {app.name}
                        </span>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => {
                          toggleFeatureMutation.mutate({ appId: app.id, enabled: checked });
                        }}
                        disabled={toggleFeatureMutation.isPending}
                        data-testid={`switch-feature-${app.id}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-activity-timeline">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle
              className="text-lg"
              style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-activity-title"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: "#2e5cbf" }} />
                Activity Timeline
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-activity">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-1" data-testid="activity-list">
                {activities.map((activity) => {
                  const appDef = appDefs.find((a) => a.id === activity.appId);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-md border"
                      data-testid={`activity-item-${activity.id}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: appDef?.color || "#2e5cbf" }}
                      >
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#1a2332" }} data-testid={`text-activity-action-${activity.id}`}>
                          {getActionLabel(activity.action)}
                          {activity.appId && appDef && (
                            <span className="text-muted-foreground font-normal"> — {appDef.name}</span>
                          )}
                          {activity.route && (
                            <span className="text-muted-foreground font-normal"> ({activity.route})</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-activity-time-${activity.id}`}>
                          {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                      {activity.durationSeconds != null && (
                        <Badge variant="secondary" className="no-default-hover-elevate flex-shrink-0" data-testid={`badge-duration-${activity.id}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(activity.durationSeconds)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="relative z-20 text-center py-4">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
        </p>
      </footer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-edit-dialog-title"
            >
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update details for {user.displayName || user.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="user@hospital.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Full name"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  data-testid="input-edit-fullname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                placeholder="Full name"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                data-testid="input-edit-displayname"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="operator">Operator (Bypass NDA)</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Legacy CareSet ID</label>
              <Input
                type="number"
                placeholder="12345"
                value={editForm.legacyCaresetId}
                onChange={(e) => setEditForm({ ...editForm, legacyCaresetId: e.target.value })}
                data-testid="input-edit-legacy-id"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">CareSet Allowed Pages</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border rounded-md p-3 bg-muted/20">
                {CARESET_PAGES.map((page) => {
                  const pages = editForm.allowedPages.split(",").filter(Boolean);
                  const checked = pages.includes(page.id);
                  return (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-detail-${page.id}`}
                        checked={checked}
                        onCheckedChange={(val) => {
                          const newPages = val
                            ? [...pages, page.id]
                            : pages.filter((p) => p !== page.id);
                          setEditForm({ ...editForm, allowedPages: newPages.join(",") });
                        }}
                      />
                      <Label
                        htmlFor={`edit-detail-${page.id}`}
                        className="text-xs cursor-pointer font-normal"
                      >
                        {page.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
                style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                className="text-white"
                data-testid="button-submit-edit"
              >
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-password-dialog-title"
            >
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {user.displayName || user.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                data-testid="button-cancel-password"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                className="text-white"
                data-testid="button-submit-password"
              >
                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
