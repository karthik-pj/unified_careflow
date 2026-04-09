import { colors, gradients } from "./colors";

export const careflowStyles = {
  fonts: {
    brand: '"AA Stetica Medium", sans-serif' as const,
    sans: "'DM Sans', sans-serif" as const,
    serif: "'Playfair Display', serif" as const,
    mono: "'Fira Code', monospace" as const,
  },

  fontUrls: [
    "https://fonts.cdnfonts.com/css/aa-stetica-medium",
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap",
  ] as const,

  borderRadius: {
    sm: "0.1875rem",
    md: "0.375rem",
    lg: "0.5625rem",
    xl: "0.75rem",
    full: "9999px",
  },

  background: gradients.main,

  glassPanel: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },

  darkPanel: {
    background: "rgba(26, 35, 50, 0.85)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },

  watermark: {
    opacity: 0.03,
    rotation: "-30deg",
    fontSize: "14px",
    letterSpacing: "8px",
    lineHeight: "80px",
  },

  colors,
  gradients,
};

export function injectCareFlowFonts() {
  if (typeof document === "undefined") return;
  careflowStyles.fontUrls.forEach((url) => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  });
}
