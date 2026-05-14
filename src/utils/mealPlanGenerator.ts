import { Recipe, RECIPES, filterRecipes, getRecipesByType } from "../data/mealPlanRecipes";

// Maps onboarding cuisine keys → recipe `cuisine` field values
const CUISINE_MAP: Record<string, string[]> = {
  italian:        ["italian"],
  japanese:       ["japanese"],
  mexican:        ["mexican"],
  indian:         ["indian"],
  chinese:        ["chinese"],
  mediterranean:  ["greek", "spanish", "french"],   // closest matches in our DB
  thai:           ["thai"],
  american:       ["american"],
  korean:         ["korean"],
  french:         ["french"],
  middle_eastern: ["greek"],                         // closest in DB
  greek:          ["greek"],
  spanish:        ["spanish"],
  vietnamese:     ["thai"],                          // closest in DB
  african:        ["african"],
  brazilian:      ["american"],                      // closest fallback
  turkish:        ["greek"],                         // closest in DB
  british:        ["european"],
  peruvian:       ["american"],                      // closest fallback
  moroccan:       ["african"],
};

export interface MealPreferences {
  goal: "lose_weight" | "maintain" | "gain_muscle" | "gain_weight";
  dietaryRestrictions: string[]; // 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'
  allergies: string[];           // 'nuts', 'shellfish', 'eggs', 'soy', 'gluten'
  cuisinePreferences: string[];  // 'mediterranean', 'asian', 'american', 'mexican'
  mealsPerDay: 3 | 4 | 5;
  includeSnacks: boolean;
  calorieTarget: number;
  cookingTime: "quick" | "any";  // quick = <15 min, any = no limit
  dislikedIngredients: string[];
}

export interface DayMeal {
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
  snack?: Recipe;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface MealPlanDay {
  date: string; // "2026-03-01"
  label: string; // "Sat, Mar 1"
  meals: DayMeal;
}

export interface MealPlan {
  id: string;
  createdAt: string;
  preferences: MealPreferences;
  duration: "week" | "month";
  days: MealPlanDay[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatLabel(date: Date): string {
  return `${DAY_LABELS[date.getDay()]}, ${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFilterTags(prefs: MealPreferences): string[] {
  const tags: string[] = [];
  if (prefs.dietaryRestrictions.includes("vegan")) tags.push("vegan");
  else if (prefs.dietaryRestrictions.includes("vegetarian")) tags.push("vegetarian");
  if (prefs.dietaryRestrictions.includes("gluten-free")) tags.push("gluten-free");
  if (prefs.goal === "gain_muscle" || prefs.goal === "lose_weight") tags.push("high-protein");
  if (prefs.cookingTime === "quick") tags.push("quick");
  return tags;
}

// Scale a recipe's macros to match a calorie target (adjusts serving size).
// Clamps the scale factor to [0.5, 3.0] to keep portions realistic.
function scaleRecipe(recipe: Recipe, targetCal: number): Recipe {
  if (!recipe.calories || recipe.calories === 0) return recipe;
  // Add a small random overage (50-100 cal) so totals feel natural, not perfectly calculated
  const jitter = 50 + Math.floor(Math.random() * 51);
  const scale = Math.min(3.0, Math.max(0.5, (targetCal + jitter) / recipe.calories));
  if (Math.abs(scale - 1) < 0.05) return recipe; // close enough, no scaling needed
  return {
    ...recipe,
    calories: Math.round(recipe.calories * scale),
    protein:  Math.round(recipe.protein  * scale),
    carbs:    Math.round(recipe.carbs    * scale),
    fat:      Math.round(recipe.fat      * scale),
  };
}

// Pick the recipe whose calories are closest to targetCal, then scale its
// macros to hit the target exactly (adjusting serving size).
function pickRecipe(
  pool: Recipe[],
  used: Set<string>,
  targetCal: number,
): Recipe {
  const available = pool.filter((r) => !used.has(r.id));
  const source = available.length > 0 ? available : pool;
  // Sort by proximity to calorie target, with a small random tie-breaker for variety
  const pick = source.reduce((best, r) => {
    const bestDiff = Math.abs(best.calories - targetCal) - Math.random() * 40;
    const rDiff    = Math.abs(r.calories - targetCal)    - Math.random() * 40;
    return rDiff < bestDiff ? r : best;
  });
  used.add(pick.id);
  if (used.size > 30) used.clear();
  return scaleRecipe(pick, targetCal);
}

// Returns recipe cuisine values allowed by the user's cuisine preferences.
// If no preference is set, all cuisines are allowed.
function getAllowedCuisines(cuisinePrefs: string[]): Set<string> | null {
  if (cuisinePrefs.length === 0) return null; // null = no restriction
  const allowed = new Set<string>();
  for (const pref of cuisinePrefs) {
    const mapped = CUISINE_MAP[pref] ?? [pref];
    mapped.forEach((c) => allowed.add(c));
  }
  return allowed;
}

function filterByCuisine(recipes: Recipe[], allowed: Set<string> | null): Recipe[] {
  if (!allowed) return recipes;
  return recipes.filter((r) => allowed.has(r.cuisine));
}

export function generateMealPlan(
  prefs: MealPreferences,
  duration: "week" | "month"
): MealPlan {
  const numDays = duration === "week" ? 7 : 30;
  const tags     = getFilterTags(prefs);
  const allergies = prefs.allergies;
  const allowedCuisines = getAllowedCuisines(prefs.cuisinePreferences);

  // Filter recipe pools by dietary tags + allergies + cuisine
  const filterPool = (type: Recipe["mealType"]) => {
    const byType    = getRecipesByType(type);
    const byDiet    = filterRecipes(byType, tags, allergies);
    const byCuisine = filterByCuisine(byDiet, allowedCuisines);
    // Fallback chain: cuisine+diet → cuisine only → all
    if (byCuisine.length >= 3) return shuffle(byCuisine);
    const cuisineOnly = filterByCuisine(byType, allowedCuisines);
    if (cuisineOnly.length >= 3) return shuffle(cuisineOnly);
    return shuffle(byType);
  };

  const bPool = filterPool("breakfast");
  const lPool = filterPool("lunch");
  const dPool = filterPool("dinner");
  const sPool = filterPool("snack");

  const usedB = new Set<string>();
  const usedL = new Set<string>();
  const usedD = new Set<string>();
  const usedS = new Set<string>();

  // Per-meal calorie targets that sum to the daily goal
  const target   = prefs.calorieTarget;
  const hasSnack = prefs.includeSnacks;
  const calB = Math.round(target * (hasSnack ? 0.25 : 0.30)); // breakfast
  const calL = Math.round(target * (hasSnack ? 0.33 : 0.38)); // lunch
  const calD = Math.round(target * (hasSnack ? 0.32 : 0.32)); // dinner
  const calS = Math.round(target * 0.10);                      // snack

  const days: MealPlanDay[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  // Start from Monday of the current week
  const dow = start.getDay();
  const diffToMon = dow === 0 ? 6 : dow - 1;
  start.setDate(start.getDate() - diffToMon);

  for (let i = 0; i < numDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const breakfast = pickRecipe(bPool, usedB, calB);
    const lunch     = pickRecipe(lPool, usedL, calL);
    const dinner    = pickRecipe(dPool, usedD, calD);
    const snack     = hasSnack ? pickRecipe(sPool, usedS, calS) : undefined;

    const totalCalories =
      breakfast.calories + lunch.calories + dinner.calories + (snack?.calories ?? 0);
    const totalProtein =
      breakfast.protein + lunch.protein + dinner.protein + (snack?.protein ?? 0);
    const totalCarbs =
      breakfast.carbs + lunch.carbs + dinner.carbs + (snack?.carbs ?? 0);
    const totalFat =
      breakfast.fat + lunch.fat + dinner.fat + (snack?.fat ?? 0);

    days.push({
      date: formatDate(date),
      label: formatLabel(date),
      meals: { breakfast, lunch, dinner, snack, totalCalories, totalProtein, totalCarbs, totalFat },
    });
  }

  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    preferences: prefs,
    duration,
    days,
  };
}

export const DEFAULT_PREFERENCES: MealPreferences = {
  goal: "maintain",
  dietaryRestrictions: [],
  allergies: [],
  cuisinePreferences: [],
  mealsPerDay: 3,
  includeSnacks: true,
  calorieTarget: 2000,
  cookingTime: "any",
  dislikedIngredients: [],
};
