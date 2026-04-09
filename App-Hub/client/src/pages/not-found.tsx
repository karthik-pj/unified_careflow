import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
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

      <Card className="w-full max-w-md mx-4 relative z-10 border-0 shadow-xl bg-white/90 backdrop-blur-md">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#C0503A" }} />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
            data-testid="text-404-title"
          >
            404 — Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-404-description">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/">
            <Button
              className="text-white"
              style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
              data-testid="button-go-home"
            >
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>

      <footer className="absolute bottom-4 z-20 text-center">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
        </p>
      </footer>
    </div>
  );
}
