import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  AppWindow,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppsCircle } from "@/components/apps-circle";
import { t, getLang, setLang as persistLang, langLabels } from "@/lib/i18n";
import { CareFlowLogo } from "@/stylesheet/Logo";
import { LanguageSelector } from "@/stylesheet/LanguageSelector";
import { UserMenu } from "@/stylesheet/UserMenu";
import { CopyRight } from "@/stylesheet/CopyRight";
import { useTheme } from "@/stylesheet/ThemeProvider";
import { careflowStyles } from "@/stylesheet/styles";

function SessionTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono text-xs" data-testid="text-session-timer">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lang, setLangState] = useState(getLang);
  const { theme, toggle: toggleTheme } = useTheme();

  function setLang(code: string) {
    setLangState(code);
    persistLang(code);
  }

  const userQuery = useQuery<{ id: string; username: string; role: string; displayName: string | null }>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });

  useEffect(() => {
    if (userQuery.isError) {
      setLocation("/");
    }
  }, [userQuery.isError, setLocation]);

  if (userQuery.isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: careflowStyles.background }}
      >
        <div className="p-4 flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-white/20" />
          <Skeleton className="h-9 w-24 bg-white/20" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-[420px] h-[420px] rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (userQuery.isError) {
    return null;
  }

  const user = userQuery.data;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: careflowStyles.background }}
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
        <div
          className="absolute w-[400px] h-[400px] rounded-full top-[30%] left-[70%] opacity-8"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
        style={{ opacity: 0.03 }}
        aria-hidden="true"
      >
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 120px,
            rgba(255,255,255,1) 120px,
            rgba(255,255,255,1) 121px
          )`,
        }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="whitespace-nowrap select-none"
              style={{
                transform: "rotate(-30deg)",
                fontSize: "14px",
                fontFamily: careflowStyles.fonts.brand,
                color: "white",
                lineHeight: careflowStyles.watermark.lineHeight,
                letterSpacing: careflowStyles.watermark.letterSpacing,
              }}
            >
              {`${user?.username || ""} \u00B7 CareFlow Confidential \u00B7 `.repeat(8)}
            </div>
          ))}
        </div>
      </div>

      <header className="relative z-20 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CareFlowLogo size="md" data-testid="img-dashboard-logo" />
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <>
                <Link href="/admin/users">
                  <Button
                    variant="outline"
                    className="border-white/30 bg-white/15 text-white backdrop-blur-md"
                    data-testid="button-admin"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
                <Link href="/admin/apps">
                  <Button
                    variant="outline"
                    className="border-white/30 bg-white/15 text-white backdrop-blur-md"
                    data-testid="button-admin-apps"
                  >
                    <AppWindow className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Apps</span>
                  </Button>
                </Link>
              </>
            )}
            <LanguageSelector
              value={lang}
              onChange={setLang}
              variant="glass"
              data-testid="select-language-dashboard"
            />
            <UserMenu
              username={user?.username || ""}
              displayName={user?.displayName}
              onLogout={() => logoutMutation.mutate()}
              logoutPending={logoutMutation.isPending}
              logoutLabel={t("signOut", lang)}
              theme={theme}
              onToggleTheme={toggleTheme}
              variant="glass"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-4">
        <div className="text-center mt-4 md:mt-6 mb-2">
          <h1
            className="text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-2"
            style={{ fontFamily: careflowStyles.fonts.brand }}
            data-testid="text-welcome"
          >
            {t("welcomeBack", lang)}, {user?.displayName || user?.username?.split("@")[0]}
          </h1>
          <p
            className="text-white/80 text-sm md:text-base max-w-md mx-auto"
            style={{ fontFamily: careflowStyles.fonts.brand }}
          >
            {t("dashboardSubtitle", lang)}
          </p>
        </div>

        <div className="flex items-start justify-center pt-4 md:pt-6">
          <div className="hidden md:block">
            <AppsCircle size={560} />
          </div>
          <div className="block md:hidden">
            <AppsCircle size={370} />
          </div>
        </div>
      </main>

      <div
        className="fixed bottom-4 right-4 z-50 rounded-md p-3 text-white shadow-lg min-w-[200px] backdrop-blur-xl border border-white/20"
        style={{ background: "rgba(26, 35, 50, 0.85)" }}
        data-testid="activity-monitor"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium" style={{ fontFamily: careflowStyles.fonts.brand }}>
            {t("sessionActive", lang)}
          </span>
        </div>
        <div className="text-[0.7rem] text-white/60 leading-relaxed">
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <SessionTimer />
          </p>
          <p>{t("user", lang)}: {user?.username}</p>
        </div>
      </div>

      <footer className="relative z-20 text-center pt-8 pb-3">
        <CopyRight variant="glass" />
      </footer>
    </div>
  );
}
