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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
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

const BRAND = "#e8380d";

export const lightColors: ColorTokens = {
  bg: "#fafaf8",
  surface: "#ffffff",
  surfaceAlt: "#f2f2f5",
  text: "#0e0e0e",
  textMuted: "#71717a",
  textFaint: "#a1a1aa",
  border: "#e4e4e7",
  primary: BRAND,
  primaryText: "#ffffff",
  success: "#16a34a",
  danger: "#ef4444",
  overlay: "rgba(0,0,0,0.45)",
  inverseBg: "#0e0e0e",
  inverseText: "#fafafa",
};

export const darkColors: ColorTokens = {
  bg: "#0b0b0c",
  surface: "#141416",
  surfaceAlt: "#1c1c1f",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  textFaint: "#71717a",
  border: "#27272a",
  primary: "#f7663f",
  primaryText: "#ffffff",
  success: "#22c55e",
  danger: "#f87171",
  overlay: "rgba(0,0,0,0.6)",
  inverseBg: "#fafafa",
  inverseText: "#0e0e0e",
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
