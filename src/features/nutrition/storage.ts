/**
 * Manual food log (free tier) — stored locally in AsyncStorage.
 * Premium adds AI scanner + meal plans on top; that layer talks to the backend.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJSON, setJSON } from "../../lib/storage";

export type FoodEntry = {
  id: string;
  /** ISO date (YYYY-MM-DD) — the day this food belongs to. */
  date: string;
  /** ISO timestamp when it was logged (used for ordering within a day). */
  loggedAt: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const DEFAULT_GOALS: MacroGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

const KEYS = { food: "@food_entries", goals: "@macro_goals", water: "@water_state" };

// Water goal (ml/day). Simple constant for now; can become user-editable later.
export const WATER_GOAL_ML = 3000;

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

/** Sum macros for a specific day. */
export function totalsForDay(entries: FoodEntry[], day: string): MacroGoals {
  return entries
    .filter((e) => e.date === day)
    .reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

// ── Goals ────────────────────────────────────────────────────────────────────
export async function loadGoals(): Promise<MacroGoals> {
  const g = await getJSON<MacroGoals>(KEYS.goals);
  return g ?? DEFAULT_GOALS;
}

export const saveGoals = (g: MacroGoals) => setJSON(KEYS.goals, g);

// ── Reset (for sign-out) ─────────────────────────────────────────────────────
export async function clearNutritionLocal() {
  await AsyncStorage.multiRemove([KEYS.food, KEYS.goals, KEYS.water]);
}
