import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock } from "lucide-react";
import { useEffect } from "react";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";
import type { AppConfig } from "@shared/schema";

export default function DatasheetViewer({ params }: { params: { appId: string } }) {
  const [, setLocation] = useLocation();
  const appId = params.appId;

  const userQuery = useQuery<{ id: string; username: string; role: string; displayName: string | null }>({
    queryKey: ["/api/auth/me"],
  });

  const appQuery = useQuery<AppConfig>({
    queryKey: ["/api/apps", appId],
  });

  useEffect(() => {
    if (userQuery.isError) {
      setLocation("/");
    }
  }, [userQuery.isError, setLocation]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  if (userQuery.isLoading || appQuery.isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
      >
        <header className="px-4 md:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <Skeleton className="h-10 w-40 bg-white/20" />
            <Skeleton className="h-9 w-32 bg-white/20" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-full max-w-4xl h-[70vh] bg-white/10 rounded-md" />
        </div>
      </div>
    );
  }

  if (userQuery.isError) return null;

  const user = userQuery.data;
  const app = appQuery.data;

  if (!app || !app.datasheetUrl) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
      >
        <div className="text-center text-white">
          <Lock className="w-12 h-12 mx-auto mb-4 opacity-60" />
          <h1
            className="text-xl font-bold mb-2"
            style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
            data-testid="text-no-datasheet"
          >
            No Datasheet Available
          </h1>
          <p className="text-white/70 mb-4">This app does not have a datasheet configured yet.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const userEmail = user?.username || "unknown@user.com";

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)" }}
    >
      <header
        className="relative z-30 sticky top-0 px-4 md:px-6 py-3"
        style={{ background: "rgba(46, 92, 191, 0.6)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={careflowLogo} alt="CareFlow" className="h-10 w-auto drop-shadow-lg" data-testid="img-datasheet-logo" />
            <div>
              <h1
                className="text-sm font-bold text-white"
                style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
                data-testid="text-datasheet-title"
              >
                {app.name} — Datasheet
              </h1>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-white/60" />
                <span className="text-xs text-white/60" data-testid="text-confidential-notice">
                  Strictly Confidential
                </span>
              </div>
            </div>
          </div>
          <Link href="/dashboard" data-testid="link-back-dashboard">
            <Button variant="outline" className="border-white/30 bg-white/15 text-white backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-5xl relative" style={{ height: "calc(100vh - 140px)" }}>
          <div className="absolute inset-0 rounded-md overflow-hidden bg-white shadow-2xl" data-testid="datasheet-container">
            <iframe
              src={app.datasheetUrl}
              className="w-full h-full border-0"
              title={`${app.name} Datasheet`}
              sandbox="allow-same-origin allow-scripts allow-popups"
              data-testid="datasheet-iframe"
            />

            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{ zIndex: 20 }}
              data-testid="watermark-overlay"
            >
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 6 }).map((_, row) =>
                  Array.from({ length: 4 }).map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      className="absolute flex flex-col items-center justify-center"
                      style={{
                        left: `${col * 25 + 5}%`,
                        top: `${row * 18 + 3}%`,
                        transform: "rotate(-25deg)",
                        opacity: 0.08,
                      }}
                    >
                      <img
                        src={careflowLogo}
                        alt=""
                        className="w-16 h-auto mb-1"
                        draggable={false}
                      />
                      <span
                        className="text-xs font-bold whitespace-nowrap"
                        style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
                      >
                        {userEmail}
                      </span>
                      <span
                        className="text-[10px] font-semibold whitespace-nowrap uppercase tracking-widest"
                        style={{ color: "#c0392b" }}
                      >
                        Strictly Confidential
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 text-center py-4">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
        </p>
      </footer>
    </div>
  );
}
