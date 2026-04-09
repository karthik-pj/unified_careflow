import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Server,
  AppWindow,
  Rocket,
  Database,
  TableProperties,
  ChevronRight,
} from "lucide-react";
import { CareFlowLogo, CopyRight } from "@/stylesheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nodes", label: "Edge Nodes", icon: Server },
  { href: "/apps", label: "Applications", icon: AppWindow },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/databases", label: "Databases", icon: Database },
  { href: "/mappings", label: "Schema Mapping", icon: TableProperties },
];

function Sidebar() {
  const [location] = useLocation();

  return (
    <aside
      data-testid="sidebar"
      className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
    >
      <div className="px-4 pt-5 pb-3 flex flex-col items-start gap-1">
        <CareFlowLogo size="xs" withShadow={false} />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            CareDeploy
          </span>
          <span className="text-[9px] font-mono text-sidebar-accent-foreground uppercase tracking-widest">
            Edge Manager
          </span>
        </div>
      </div>

      <nav className="flex-1 px-2 mt-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`
                  group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer
                  ${isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-accent-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-sidebar-accent-foreground group-hover:text-sidebar-foreground"}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-sidebar-accent-foreground" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <div className="p-3 rounded-md bg-sidebar-accent/50 border border-sidebar-border">
          <p className="text-[10px] font-mono text-sidebar-accent-foreground uppercase tracking-wider mb-1">
            System Status
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-glow" />
            <span className="text-xs text-sidebar-foreground">All systems nominal</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <CopyRight variant="default" className="text-sidebar-accent-foreground" />
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark">
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
