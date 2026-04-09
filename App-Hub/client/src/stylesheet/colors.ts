export const colors = {
  primary: "#2e5cbf",
  secondary: "#008ed3",
  primaryDark: "#1e3d7a",
  secondaryDark: "#006a9e",

  gradient: {
    start: "#2e5cbf",
    q1: "#3a7fd4",
    mid: "#4fb8d7",
    q3: "#6ed4c8",
    end: "#7adbc8",
  },

  light: {
    background: "hsl(216 30% 97%)",
    foreground: "hsl(222 25% 15%)",
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(222 25% 15%)",
    border: "hsl(216 20% 90%)",
    muted: "hsl(216 20% 92%)",
    mutedForeground: "hsl(215 15% 45%)",
    input: "hsl(216 20% 78%)",
  },

  dark: {
    background: "hsl(222 30% 8%)",
    foreground: "hsl(210 20% 95%)",
    card: "hsl(222 25% 11%)",
    cardForeground: "hsl(210 20% 95%)",
    border: "hsl(222 20% 16%)",
    muted: "hsl(222 20% 16%)",
    mutedForeground: "hsl(210 15% 65%)",
    input: "hsl(222 20% 30%)",
  },

  white: "#ffffff",
  black: "#000000",
  destructive: "#b91c1c",
  success: "#22c55e",
  warning: "#f59e0b",
} as const;

export const appColors = {
  carebuild: "#2e5cbf",
  careset: "#008ed3",
  careview: "#6B5FA0",
  carealert: "#D4952A",
  carelog: "#3DA4D4",
  carepath: "#C0503A",
  careorg: "#4DB8A8",
  careapi: "#5A5A5A",
} as const;

export type AppColorKey = keyof typeof appColors;

export const gradients = {
  main: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)",
  subtle: "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 50%, #4fb8d7 100%)",
  dark: "linear-gradient(135deg, #1a2332 0%, #1e3d5f 50%, #1a3a5c 100%)",
} as const;

export type CareFlowColors = typeof colors;
