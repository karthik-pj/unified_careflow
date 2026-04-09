import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus,
  Pencil,
  Trash2,
  Users,
  Shield,
  User,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";
import { t, getLang, setLang as persistLang, langLabels } from "@/lib/i18n";

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

export default function AdminUsersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    displayName: "",
    role: "user",
    status: "active",
    legacyCaresetId: "",
    allowedPages: "",
  });

  const [editForm, setEditForm] = useState({
    email: "",
    fullName: "",
    displayName: "",
    role: "user",
    status: "active",
    legacyCaresetId: "",
    allowedPages: "",
  });

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

  const usersQuery = useQuery<UserRecord[]>({
    queryKey: ["/api/admin/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created" });
      setCreateOpen(false);
      setCreateForm({
        username: "",
        password: "",
        email: "",
        fullName: "",
        displayName: "",
        role: "user",
        status: "active",
        legacyCaresetId: "",
        allowedPages: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
      setEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
      setDeleteOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    },
  });

  function handleCreateSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!createForm.username || !createForm.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(createForm);
  }

  function handleEditSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!selectedUser) return;
    editMutation.mutate({ id: selectedUser.id, data: editForm });
  }

  function openEditDialog(user: UserRecord) {
    setSelectedUser(user);
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

  function openDeleteDialog(user: UserRecord) {
    setSelectedUser(user);
    setDeleteOpen(true);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

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
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4 w-full">
          <Skeleton className="h-10 w-64 bg-white/20" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/10" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const users = usersQuery.data || [];

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
          <Link href="/dashboard" data-testid="link-back-dashboard">
            <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 w-full flex-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-white"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
                data-testid="text-page-title"
              >
                User Management
              </h1>
              <p className="text-sm text-white/70" data-testid="text-user-count">
                {users.length} user{users.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="text-white border-white/30 bg-white/15 backdrop-blur-md"
            variant="outline"
            data-testid="button-create-user"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create User
          </Button>
        </div>

        <div className="space-y-3" data-testid="user-list">
          {users.length === 0 ? (
            <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-users">No users found. Create a new user to get started.</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card
                key={user.id}
                className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible"
                data-testid={`card-user-${user.id}`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                        data-testid={`avatar-user-${user.id}`}
                      >
                        {(user.displayName || user.username)
                          .split(/[@.\s]/)
                          .filter(Boolean)
                          .map((p) => p[0]?.toUpperCase())
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="font-semibold text-sm truncate"
                            style={{ color: "#1a2332" }}
                            data-testid={`link-user-detail-${user.id}`}
                          >
                            {user.displayName || user.username}
                          </Link>
                          <Badge
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className="no-default-hover-elevate"
                            data-testid={`badge-role-${user.id}`}
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
                            data-testid={`badge-status-${user.id}`}
                          >
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate" data-testid={`text-email-${user.id}`}>
                          {user.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="hidden md:flex flex-col text-right text-xs text-muted-foreground">
                        <span data-testid={`text-created-${user.id}`}>Created: {formatDate(user.createdAt)}</span>
                        <span data-testid={`text-last-login-${user.id}`}>Last login: {formatDate(user.lastLoginAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button size="icon" variant="ghost" data-testid={`button-view-${user.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(user)}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <footer className="relative z-20 text-center py-4">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
        </p>
      </footer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-testid="dialog-create-user">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
              data-testid="text-create-dialog-title"
            >
              Create New User
            </DialogTitle>
            <DialogDescription>Add a new user to the CareFlow platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username (Unique)</label>
              <Input
                placeholder="johndoe"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                data-testid="input-create-username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="user@hospital.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                data-testid="input-create-email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                data-testid="input-create-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  data-testid="input-create-fullname"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  placeholder="John D."
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  data-testid="input-create-displayname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger data-testid="select-create-role">
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
              <label className="text-sm font-medium">Legacy CareSet ID</label>
              <Input
                type="number"
                placeholder="12345"
                value={createForm.legacyCaresetId}
                onChange={(e) => setCreateForm({ ...createForm, legacyCaresetId: e.target.value })}
                data-testid="input-create-legacy-id"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">CareSet Allowed Pages</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border rounded-md p-3 bg-muted/20">
                {CARESET_PAGES.map((page) => {
                  const pages = createForm.allowedPages.split(",").filter(Boolean);
                  const checked = pages.includes(page.id);
                  return (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${page.id}`}
                        checked={checked}
                        onCheckedChange={(val) => {
                          const newPages = val
                            ? [...pages, page.id]
                            : pages.filter((p) => p !== page.id);
                          setCreateForm({ ...createForm, allowedPages: newPages.join(",") });
                        }}
                      />
                      <Label
                        htmlFor={`create-${page.id}`}
                        className="text-xs cursor-pointer font-normal"
                      >
                        {page.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={createForm.status}
                onValueChange={(v) => setCreateForm({ ...createForm, status: v })}
              >
                <SelectTrigger data-testid="select-create-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                className="text-white"
                data-testid="button-submit-create"
              >
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              Update details for {selectedUser?.displayName || selectedUser?.username}
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
                        id={`edit-${page.id}`}
                        checked={checked}
                        onCheckedChange={(val) => {
                          const newPages = val
                            ? [...pages, page.id]
                            : pages.filter((p) => p !== page.id);
                          setEditForm({ ...editForm, allowedPages: newPages.join(",") });
                        }}
                      />
                      <Label
                        htmlFor={`edit-${page.id}`}
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent data-testid="dialog-delete-user">
          <DialogHeader>
            <DialogTitle data-testid="text-delete-dialog-title">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedUser?.displayName || selectedUser?.username}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
