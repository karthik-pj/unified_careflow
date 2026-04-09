import { LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  username: string;
  displayName?: string | null;
  onLogout: () => void;
  logoutPending?: boolean;
  logoutLabel?: string;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  variant?: "glass" | "default";
  "data-testid"?: string;
}

function getInitials(email: string): string {
  return email
    .split("@")[0]
    .split(".")
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "CF";
}

export function UserMenu({
  username,
  displayName,
  onLogout,
  logoutPending = false,
  logoutLabel = "Sign Out",
  theme,
  onToggleTheme,
  variant = "glass",
  "data-testid": testId = "user-menu",
}: UserMenuProps) {
  const initials = getInitials(username);
  const isGlass = variant === "glass";

  const btnClass = isGlass
    ? "border-white/30 bg-white/15 text-white backdrop-blur-md"
    : "border-border bg-secondary text-foreground";

  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      {onToggleTheme && (
        <Button
          variant="outline"
          size="icon"
          className={btnClass}
          onClick={onToggleTheme}
          data-testid="button-toggle-theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      )}

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2"
        style={
          isGlass
            ? { background: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.4)" }
            : { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary) / 0.7)" }
        }
        data-testid="avatar-user"
      >
        {initials}
      </div>

      <div className="hidden sm:flex flex-col">
        <span
          className={`text-sm font-medium ${isGlass ? "text-white" : "text-foreground"}`}
          data-testid="text-display-name"
        >
          {displayName || username.split("@")[0]}
        </span>
        <span
          className={`text-xs ${isGlass ? "text-white/60" : "text-muted-foreground"}`}
          data-testid="text-user-email"
        >
          {username}
        </span>
      </div>

      <Button
        variant="outline"
        className={btnClass}
        onClick={onLogout}
        disabled={logoutPending}
        data-testid="button-logout"
      >
        <LogOut className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">{logoutLabel}</span>
      </Button>
    </div>
  );
}
