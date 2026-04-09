import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function sendActivity(data: { action: string; appId?: string; route?: string; durationSeconds?: number; metadata?: any }) {
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function useActivityTracker() {
  const [location] = useLocation();
  const lastRoute = useRef<string | null>(null);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    if (lastRoute.current && lastRoute.current !== location) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 0) {
        sendActivity({
          action: "page_visit",
          route: lastRoute.current,
          durationSeconds: duration,
        });
      }
    }
    lastRoute.current = location;
    startTime.current = Date.now();
  }, [location]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastRoute.current) {
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        if (duration > 0) {
          const data = JSON.stringify({
            action: "page_visit",
            route: lastRoute.current,
            durationSeconds: duration,
          });
          navigator.sendBeacon("/api/activity", new Blob([data], { type: "application/json" }));
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}

export function trackAppLaunch(appId: string) {
  sendActivity({ action: "app_launch", appId });
}

export function trackAppClose(appId: string, durationSeconds: number) {
  sendActivity({ action: "app_close", appId, durationSeconds });
}
