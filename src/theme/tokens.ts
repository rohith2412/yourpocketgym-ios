/**
 * Design tokens — the single source of truth for all visual values.
 * Screens and components NEVER hardcode a color, space, or radius.
 * They read from the theme (see ThemeProvider + useTheme).
 */

// ── Spacing scale (4pt grid) ──────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;
export type Spacing = keyof typeof spacing;

// ── Radius scale ──────────────────────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  "2xl": 18,
  full: 999,
} as const;
export type Radius = keyof typeof radius;

// ── Typography ────────────────────────────────────────────────────────────────
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  "2xl": 28,
  "3xl": 40,
} as const;
export type FontSize = keyof typeof fontSize;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;
export type FontWeight = keyof typeof fontWeight;

// ── Semantic colors ───────────────────────────────────────────────────────────
// Named by ROLE, not by value, so light/dark just swap the map.
export type ColorTokens = {
  bg: string; // screen background
  surface: string; // card surface
  surfaceAlt: string; // inset / secondary surface
  text: string; // primary text
  textMuted: string; // secondary text
  textFaint: string; // tertiary text / placeholders
  border: string; // hairline borders
  primary: string; // brand accent
  primaryText: string; // text on primary
  success: string;
  danger: string;
  overlay: string; // modal scrim
  // Inverse pair — for buttons that flip with the theme
  inverseBg: string;
  inverseText: string;
};

// Brand accent (PocketGym orange). shadcn itself is monochrome, but we keep
// one brand accent for highlights; the primary action button uses inverse.
const BRAND = "#e8380d";

// shadcn "zinc" — light
export const lightColors: ColorTokens = {
  bg: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#f4f4f5", // zinc-100 (muted)
  text: "#09090b", // zinc-950
  textMuted: "#71717a", // zinc-500
  textFaint: "#a1a1aa", // zinc-400
  border: "#e4e4e7", // zinc-200
  primary: BRAND,
  primaryText: "#ffffff",
  success: "#16a34a",
  danger: "#ef4444",
  overlay: "rgba(0,0,0,0.45)",
  inverseBg: "#18181b", // zinc-900 (shadcn primary)
  inverseText: "#fafafa",
};

// shadcn "zinc" — dark
export const darkColors: ColorTokens = {
  bg: "#09090b", // zinc-950
  surface: "#18181b", // zinc-900
  surfaceAlt: "#27272a", // zinc-800
  text: "#fafafa",
  textMuted: "#a1a1aa", // zinc-400
  textFaint: "#71717a", // zinc-500
  border: "#27272a", // zinc-800
  primary: "#f7663f",
  primaryText: "#ffffff",
  success: "#22c55e",
  danger: "#f87171",
  overlay: "rgba(0,0,0,0.6)",
  inverseBg: "#ffffff", // pure bright white (primary button on dark)
  inverseText: "#0a0a0a",
};

// ── Shadows (elevation presets) ──────────────────────────────────────────────
export const shadow = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
export type ShadowLevel = keyof typeof shadow;
