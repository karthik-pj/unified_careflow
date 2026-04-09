import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useNdaGate } from "@/hooks/use-nda-gate";
import { ThemeProvider } from "@/stylesheet/ThemeProvider";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AdminUsersPage from "@/pages/admin-users";
import AdminUserDetailPage from "@/pages/admin-user-detail";
import AdminAppsPage from "@/pages/admin-apps";
import DatasheetViewer from "@/pages/datasheet-viewer";
import NdaSignPage from "@/pages/nda-sign";
import NotFound from "@/pages/not-found";

function Router() {
  useActivityTracker();
  useNdaGate();
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/nda" component={NdaSignPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/users/:id" component={AdminUserDetailPage} />
      <Route path="/admin/apps" component={AdminAppsPage} />
      <Route path="/datasheet/:appId" component={DatasheetViewer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
