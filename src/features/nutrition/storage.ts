/**
 * Manual food log (free tier) - stored locally in AsyncStorage.
 * Premium adds AI scanner + meal plans on top; that layer talks to the backend.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJSON, setJSON } from "../../lib/storage";

/**
 * A single logged food. The four macros (calories/protein/carbs/fat) are
 * required — everything else is optional so entries created by older app
 * versions or by lightweight paths (voice log, restaurant tap) don't break.
 * Units: grams for anything ending in a gram noun (protein, sugar, satFat),
 * milligrams for sodium/cholesterol/calcium/potassium/iron/vitaminC, and
 * micrograms for vitaminA (RAE) / vitaminD / vitaminB12 / folate (DFE).
 */
export type FoodEntry = {
  id: string;
  /** ISO date (YYYY-MM-DD) - the day this food belongs to. */
  date: string;
  /** ISO timestamp when it was logged (used for ordering within a day). */
  loggedAt: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Tier-1 essential nutrients
  fiber?: number;
  sugar?: number;
  sodium?: number;
  satFat?: number;
  cholesterol?: number;
  // Tier-2 micronutrients
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
  /** Local file:// uri of a photo of the food (only when logged via photo). */
  photoUri?: string;
};

/**
 * Daily targets (protein/fiber) or limits (sodium/sugar/satFat).
 * Optional fields default to the RDA constants below so goal sheets don't
 * need every field filled in.
 */
export type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  satFat?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
};

/**
 * Sensible defaults — the four macros are the app's originals; the rest are
 * FDA / USDA recommended daily values for a 2000-kcal adult diet, so the
 * "goal vs actual" bars have something meaningful to show on day one.
 */
export const DEFAULT_GOALS: Required<MacroGoals> = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
  fiber: 28,        // g — FDA daily value
  sugar: 50,        // g — added sugar limit
  sodium: 2300,     // mg — FDA limit
  satFat: 20,       // g — <10% of a 2000-kcal diet
  cholesterol: 300, // mg — FDA limit
  vitaminA: 900,    // µg RAE
  vitaminC: 90,     // mg
  vitaminD: 20,     // µg
  vitaminB12: 2.4,  // µg
  folate: 400,      // µg DFE
  iron: 18,         // mg
  calcium: 1300,    // mg
  potassium: 4700,  // mg
};

/** Every nutrient key in one place — used by totals + display loops. */
export const NUTRIENT_KEYS = [
  "calories", "protein", "carbs", "fat", "fiber",
  "sugar", "sodium", "satFat", "cholesterol",
  "vitaminA", "vitaminC", "vitaminD", "vitaminB12", "folate",
  "iron", "calcium", "potassium",
] as const;

export type NutrientKey = typeof NUTRIENT_KEYS[number];

const KEYS = {
  food: "@food_entries",
  goals: "@macro_goals",
  water: "@water_state",
  /**
   * Local map { [mealLogId]: file:// uri } so photos never leave the device.
   * The food entry itself is persisted to Mongo; this keeps the photo attached.
   */
  photoMap: "@food_photo_map",
};

export type PhotoMap = Record<string, string>;

export async function loadPhotoMap(): Promise<PhotoMap> {
  return (await getJSON<PhotoMap>(KEYS.photoMap)) ?? {};
}
const savePhotoMap = (m: PhotoMap) => setJSON(KEYS.photoMap, m);

export async function setEntryPhoto(id: string, uri: string) {
  const m = await loadPhotoMap();
  m[id] = uri;
  await savePhotoMap(m);
}

export async function removeEntryPhoto(id: string) {
  const m = await loadPhotoMap();
  if (m[id]) {
    delete m[id];
    await savePhotoMap(m);
  }
}

// Water goal (ml/day). Constant default; users can override via loadWaterGoal.
export const WATER_GOAL_ML = 3000;

const WATER_GOAL_KEY = "@water_goal_ml";
export async function loadWaterGoal(): Promise<number> {
  return (await getJSON<number>(WATER_GOAL_KEY)) ?? WATER_GOAL_ML;
}
export const saveWaterGoal = (ml: number) => setJSON(WATER_GOAL_KEY, ml);

// Water: map of ISO day → ml consumed
export type WaterState = Record<string, number>;
export async function loadWater(): Promise<WaterState> {
  return (await getJSON<WaterState>(KEYS.water)) ?? {};
}
export const saveWater = (s: WaterState) => setJSON(KEYS.water, s);
export async function addWaterMl(day: string, ml: number) {
  const s = await loadWater();
  s[day] = Math.max(0, (s[day] ?? 0) + ml);
  await saveWater(s);
  return s[day];
}

// ── Date helpers ─────────────────────────────────────────────────────────────
export const toISODay = (d: Date | string = new Date()) =>
  new Date(d).toLocaleDateString("en-CA");

// ── Food entries ─────────────────────────────────────────────────────────────
export async function loadFoodEntries(): Promise<FoodEntry[]> {
  return (await getJSON<FoodEntry[]>(KEYS.food)) ?? [];
}

export const saveFoodEntries = (entries: FoodEntry[]) =>
  setJSON(KEYS.food, entries);

export const newFoodId = () =>
  `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export async function addFoodEntry(entry: FoodEntry) {
  const list = await loadFoodEntries();
  await saveFoodEntries([...list, entry]);
}

export async function deleteFoodEntry(id: string) {
  const list = await loadFoodEntries();
  await saveFoodEntries(list.filter((e) => e.id !== id));
}

/**
 * Sum every nutrient across the day's entries. Returns a fully-populated
 * object (missing fields default to 0) so callers can render both the four
 * headline macros AND the nutrient-breakdown card without extra null checks.
 */
export function totalsForDay(
  entries: FoodEntry[],
  day: string,
): Required<Pick<MacroGoals, NutrientKey>> {
  const acc: Record<NutrientKey, number> = Object.fromEntries(
    NUTRIENT_KEYS.map((k) => [k, 0]),
  ) as Record<NutrientKey, number>;
  for (const e of entries) {
    if (e.date !== day) continue;
    for (const k of NUTRIENT_KEYS) {
      acc[k] += Number(e[k]) || 0;
    }
  }
  return acc;
}

// ── Goals ────────────────────────────────────────────────────────────────────
export async function loadGoals(): Promise<MacroGoals> {
  const g = await getJSON<MacroGoals>(KEYS.goals);
  return g ?? DEFAULT_GOALS;
}

export const saveGoals = (g: MacroGoals) => setJSON(KEYS.goals, g);

// ── Reset (for sign-out) ─────────────────────────────────────────────────────
export async function clearNutritionLocal() {
  await AsyncStorage.multiRemove([
    KEYS.food,
    KEYS.goals,
    KEYS.water,
    KEYS.photoMap,
  ]);
}
