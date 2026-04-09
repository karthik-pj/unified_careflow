import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Nodes from "@/pages/nodes";
import Applications from "@/pages/applications";
import Deployments from "@/pages/deployments";
import Databases from "@/pages/databases";
import SchemaMappings from "@/pages/schema-mappings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/apps" component={Applications} />
      <Route path="/deployments" component={Deployments} />
      <Route path="/databases" component={Databases} />
      <Route path="/mappings" component={SchemaMappings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
