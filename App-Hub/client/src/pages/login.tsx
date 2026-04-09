import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Mail, Shield, Globe, Eye, EyeOff } from "lucide-react";
import { t, getLang, setLang as persistLang, langLabels } from "@/lib/i18n";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLangState] = useState(getLang);

  function setLang(code: string) {
    setLangState(code);
    persistLang(code);
  }

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nda/status"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      let description = t("invalidCredentials", lang);
      try {
        const jsonStr = error.message.replace(/^\d+:\s*/, "");
        const parsed = JSON.parse(jsonStr);
        if (parsed.message) description = parsed.message;
      } catch {}
      toast({
        title: t("authFailed", lang),
        description,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: LoginForm) {
    loginMutation.mutate(data);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
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
        <div
          className="absolute w-[400px] h-[400px] rounded-full top-[40%] left-[60%] opacity-8"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
        />
      </div>

      <div className="absolute top-4 right-6 z-20">
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger
            className="w-auto gap-2 border-white/30 bg-white/15 text-white text-xs backdrop-blur-md"
            data-testid="select-language"
          >
            <Globe className="w-3.5 h-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(langLabels).map(([code, label]) => (
              <SelectItem key={code} value={code} data-testid={`option-lang-${code}`}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full flex-1 px-6 pt-12 md:pt-16 pb-8">
        <img
          src={careflowLogo}
          alt="CareFlow"
          className="w-[60vw] max-w-[500px] min-w-[220px] h-auto drop-shadow-xl mb-4"
          style={{ objectFit: "contain" }}
          data-testid="img-hero-logo"
        />

        <p
          className="text-white/90 text-base md:text-lg lg:text-xl tracking-wide text-center max-w-lg drop-shadow-sm mb-10"
          style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
          data-testid="text-tagline"
        >
          {t("tagline", lang)}
        </p>

        <div
          className="w-full max-w-sm rounded-xl p-8 shadow-2xl border border-white/20"
          style={{ background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", fontFamily: '"AA Stetica Medium", sans-serif' }}
          data-testid="login-card"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1" style={{ color: "#2e5cbf" }} data-testid="text-login-title">
              {t("platformLogin", lang)}
            </h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {t("signInSubtitle", lang)}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium" style={{ color: "#1a2332" }}>Username or Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                        <Input
                          type="text"
                          placeholder="Enter your username or email"
                          className="pl-10 bg-white border-gray-200"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium" style={{ color: "#1a2332" }}>{t("password", lang)}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t("passwordPlaceholder", lang)}
                          className="pl-10 pr-10 bg-white border-gray-200"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                          tabIndex={-1}
                        >
                          {showPassword
                            ? <EyeOff className="w-4 h-4" style={{ color: "#9ca3af" }} />
                            : <Eye className="w-4 h-4" style={{ color: "#9ca3af" }} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(!!v)}
                    data-testid="checkbox-remember"
                  />
                  <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: "#6b7280" }}>
                    {t("rememberMe", lang)}
                  </label>
                </div>
                <button type="button" className="text-sm font-medium hover:underline" style={{ color: "#2e5cbf" }}
                        data-testid="link-forgot-password">
                  {t("forgotPassword", lang)}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #2e5cbf 0%, #008ed3 100%)" }}
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? t("authenticating", lang) : t("accessPlatform", lang)}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-3 rounded-md flex items-start gap-3"
               style={{ background: "rgba(46,92,191,0.08)" }}>
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2e5cbf" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#4a5568" }} data-testid="text-security-note">
              {t("securityNote", lang)}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 pb-4 text-center">
          <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
            &copy;2026 CareFlow Systems GmbH &middot; V 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
