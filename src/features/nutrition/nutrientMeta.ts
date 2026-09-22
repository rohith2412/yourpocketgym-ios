import type { NutrientKey } from "./storage";

/**
 * Display metadata for every nutrient — label, unit, and whether hitting the
 * target is "good" (protein, fiber, vitamins) or "bad" (sugar, sodium, satFat,
 * cholesterol). "Good" bars fill toward the goal in success color; "bad"
 * bars fill toward the limit in danger color once past 100%.
 */
export type NutrientKind = "target" | "limit";

export type NutrientMeta = {
  key: NutrientKey;
  label: string;
  short: string;
  unit: string;
  kind: NutrientKind;
  /** Section header this nutrient belongs under in the breakdown card. */
  group: "macro" | "essential" | "vitamin" | "mineral";
  /**
   * Base color used for this nutrient's progress bar + accent dot. Kept in
   * one place so re-theming the breakdown card is a single edit — screens
   * never hardcode a hex.
   */
  color: string;
};

// Palette — chosen to feel bright without breaking the monochrome design:
// warm tones for limits (sugar/sodium/satFat/chol.), cool tones for targets,
// and a distinct hue per micronutrient so bars are visually scannable.
export const NUTRIENT_META: NutrientMeta[] = [
  { key: "calories",    label: "Calories",     short: "Cal",     unit: "kcal", kind: "target", group: "macro",     color: "#f97316" },
  { key: "protein",     label: "Protein",      short: "Protein", unit: "g",    kind: "target", group: "macro",     color: "#8b5cf6" },
  { key: "carbs",       label: "Carbs",        short: "Carbs",   unit: "g",    kind: "target", group: "macro",     color: "#f59e0b" },
  { key: "fat",         label: "Fat",          short: "Fat",     unit: "g",    kind: "target", group: "macro",     color: "#0ea5e9" },
  { key: "fiber",       label: "Fiber",        short: "Fiber",   unit: "g",    kind: "target", group: "essential", color: "#10b981" },
  { key: "sugar",       label: "Added sugar",  short: "Sugar",   unit: "g",    kind: "limit",  group: "essential", color: "#f43f5e" },
  { key: "sodium",      label: "Sodium",       short: "Sodium",  unit: "mg",   kind: "limit",  group: "essential", color: "#fb923c" },
  { key: "satFat",      label: "Saturated fat",short: "Sat fat", unit: "g",    kind: "limit",  group: "essential", color: "#ef4444" },
  { key: "cholesterol", label: "Cholesterol",  short: "Chol.",   unit: "mg",   kind: "limit",  group: "essential", color: "#e11d48" },
  { key: "vitaminA",    label: "Vitamin A",    short: "A",       unit: "µg",   kind: "target", group: "vitamin",   color: "#f59e0b" },
  { key: "vitaminC",    label: "Vitamin C",    short: "C",       unit: "mg",   kind: "target", group: "vitamin",   color: "#eab308" },
  { key: "vitaminD",    label: "Vitamin D",    short: "D",       unit: "µg",   kind: "target", group: "vitamin",   color: "#fde047" },
  { key: "vitaminB12",  label: "Vitamin B12",  short: "B12",     unit: "µg",   kind: "target", group: "vitamin",   color: "#a855f7" },
  { key: "folate",      label: "Folate",       short: "Folate",  unit: "µg",   kind: "target", group: "vitamin",   color: "#22c55e" },
  { key: "iron",        label: "Iron",         short: "Iron",    unit: "mg",   kind: "target", group: "mineral",   color: "#dc2626" },
  { key: "calcium",     label: "Calcium",      short: "Calcium", unit: "mg",   kind: "target", group: "mineral",   color: "#f3f4f6" },
  { key: "potassium",   label: "Potassium",    short: "Potas.",  unit: "mg",   kind: "target", group: "mineral",   color: "#38bdf8" },
];

export const GROUP_LABELS: Record<NutrientMeta["group"], string> = {
  macro:     "Macros",
  essential: "Essential",
  vitamin:   "Vitamins",
  mineral:   "Minerals",
};

/** Small Ionicon per group — used for the section header pill. */
export const GROUP_ICONS: Record<NutrientMeta["group"], string> = {
  macro:     "flame-outline",
  essential: "shield-checkmark-outline",
  vitamin:   "sunny-outline",
  mineral:   "diamond-outline",
};

/** Pretty-print a number: 0.4 → "0.4", 1234 → "1,234". */
export function formatValue(v: number, unit: string): string {
  if (unit === "kcal" || unit === "mg" || unit === "µg") {
    return Math.round(v).toLocaleString();
  }
  return (Math.round(v * 10) / 10).toLocaleString();
}
