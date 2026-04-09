import { useState, createContext, useContext, type ReactNode } from "react";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SupportedLanguage = "de" | "en" | "fr" | "es" | "it";

export const languageLabels: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  es: "Español",
  it: "Italiano",
};

const STORAGE_KEY = "careflow-lang";

function getStoredLang(): SupportedLanguage {
  if (typeof window === "undefined") return "de";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in languageLabels) return stored as SupportedLanguage;
  return "de";
}

function persistLang(lang: SupportedLanguage) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

interface LanguageContextValue {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLang?: SupportedLanguage;
}

export function LanguageProvider({ children, defaultLang }: LanguageProviderProps) {
  const [lang, setLangState] = useState<SupportedLanguage>(defaultLang ?? getStoredLang);

  function setLang(code: SupportedLanguage) {
    setLangState(code);
    persistLang(code);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  variant?: "glass" | "default";
  className?: string;
  "data-testid"?: string;
}

export function LanguageSelector({
  value,
  onChange,
  variant = "default",
  className = "",
  "data-testid": testId = "select-language",
}: LanguageSelectorProps) {
  const variantClasses =
    variant === "glass"
      ? "border-white/30 bg-white/15 text-white backdrop-blur-md"
      : "border-border bg-card text-foreground";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`w-auto gap-2 text-xs ${variantClasses} ${className}`.trim()}
        data-testid={testId}
      >
        <Globe className="w-3.5 h-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(languageLabels) as [SupportedLanguage, string][]).map(
          ([code, label]) => (
            <SelectItem key={code} value={code} data-testid={`option-lang-${code}`}>
              {label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
