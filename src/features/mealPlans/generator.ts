import recipes from "./recipes.json";
import type { Goal, MealType, Plan, PlanDay, Recipe, Macros } from "./types";

const ALL: Recipe[] = recipes as Recipe[];

export type DietaryTag = "vegan" | "vegetarian" | "keto" | "low-carb" | "high-fiber" | "gluten-free" | "dairy-free";
export const ALL_DIET_TAGS: DietaryTag[] = [
  "high-fiber",
  "gluten-free",
  "vegetarian",
  "vegan",
  "keto",
  "low-carb",
  "dairy-free",
];

function passesDiet(r: Recipe, tags: DietaryTag[]): boolean {
  if (tags.length === 0) return true;
  const rt = r.dietaryTags ?? [];
  return tags.every((t) => rt.includes(t));
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Filter recipes by goal + diet tags. Falls back if the filter is too tight. */
function pool(goal: Goal, mealType: MealType, diet: DietaryTag[]): Recipe[] {
  const strict = ALL.filter(
    (r) => r.goal === goal && r.mealType === mealType && passesDiet(r, diet),
  );
  if (strict.length >= 3) return strict;
  const anyGoal = ALL.filter((r) => r.mealType === mealType && passesDiet(r, diet));
  if (anyGoal.length >= 3) return anyGoal;
  // Give up on diet if that empties us; user prefers something to nothing
  return ALL.filter((r) => r.mealType === mealType);
}

/** Pick N unique recipes from a pool (cycling if the pool is smaller). */
function pickN(candidates: Recipe[], n: number): Recipe[] {
  const shuffled = shuffle(candidates);
  const out: Recipe[] = [];
  for (let i = 0; i < n; i++) {
    out.push(shuffled[i % shuffled.length]);
  }
  return out;
}

const empty: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function addMacros(a: Macros, b?: Macros | null): Macros {
  if (!b) return a;
  return {
    calories: a.calories + (b.calories ?? 0),
    protein: a.protein + (b.protein ?? 0),
    carbs: a.carbs + (b.carbs ?? 0),
    fat: a.fat + (b.fat ?? 0),
  };
}

export function generatePlan(
  goal: Goal,
  days: number,
  includeSnack: boolean,
  diet: DietaryTag[] = [],
): Plan {
  const breakfasts = pickN(pool(goal, "breakfast", diet), days);
  const lunches = pickN(pool(goal, "lunch", diet), days);
  const dinners = pickN(pool(goal, "dinner", diet), days);
  const snacks = includeSnack ? pickN(pool(goal, "snack", diet), days) : new Array<Recipe | null>(days).fill(null);

  const planDays: PlanDay[] = [];
  let totals: Macros = { ...empty };
  for (let i = 0; i < days; i++) {
    const day: PlanDay = {
      day: i + 1,
      breakfast: breakfasts[i] ?? null,
      lunch: lunches[i] ?? null,
      dinner: dinners[i] ?? null,
      snack: snacks[i] ?? null,
    };
    planDays.push(day);
    totals = addMacros(addMacros(addMacros(addMacros(totals, day.breakfast?.macros), day.lunch?.macros), day.dinner?.macros), day.snack?.macros);
  }

  // Average per day
  const perDay: Macros = {
    calories: Math.round(totals.calories / days),
    protein: Math.round(totals.protein / days),
    carbs: Math.round(totals.carbs / days),
    fat: Math.round(totals.fat / days),
  };

  return { goal, days: planDays, totals: perDay };
}

/** Replace a single slot on a day with a different random recipe. */
export function swapSlot(
  plan: Plan,
  dayIdx: number,
  slot: MealType,
  diet: DietaryTag[],
): Plan {
  const candidates = pool(plan.goal, slot, diet).filter(
    (r) => r.name !== plan.days[dayIdx][slot]?.name,
  );
  const next = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] ?? null;
  const days = plan.days.map((d, i) => (i === dayIdx ? { ...d, [slot]: next } : d));

  // Recompute daily average
  let totals = { ...empty };
  days.forEach((d) => {
    totals = addMacros(
      addMacros(addMacros(addMacros(totals, d.breakfast?.macros), d.lunch?.macros), d.dinner?.macros),
      d.snack?.macros,
    );
  });
  const per: Macros = {
    calories: Math.round(totals.calories / days.length),
    protein: Math.round(totals.protein / days.length),
    carbs: Math.round(totals.carbs / days.length),
    fat: Math.round(totals.fat / days.length),
  };
  return { ...plan, days, totals: per };
}

/** Aggregate all ingredients across the plan. Simple dedupe by lowercased item;
 *  amounts are concatenated with a "+" when they can't be numerically merged. */
export type GroceryItem = { item: string; amount: string; count: number };

export function buildGroceryList(plan: Plan): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  const collect = (r?: Recipe | null) => {
    if (!r) return;
    r.ingredients.forEach((ing) => {
      const key = ing.item.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        // Try to add numeric amounts if both look like "Ng" / "N pcs"
        const merged = tryAddAmounts(existing.amount, ing.amount);
        existing.amount = merged ?? `${existing.amount} + ${ing.amount}`;
      } else {
        map.set(key, { item: ing.item, amount: ing.amount, count: 1 });
      }
    });
  };
  plan.days.forEach((d) => {
    collect(d.breakfast);
    collect(d.lunch);
    collect(d.dinner);
    collect(d.snack);
  });
  return Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item));
}

function tryAddAmounts(a: string, b: string): string | null {
  // Very simple: match a leading number + unit like "300g" or "1 cup"
  const re = /^\s*(\d+(?:\.\d+)?)\s*(\S+)?/;
  const ma = a.match(re);
  const mb = b.match(re);
  if (!ma || !mb) return null;
  if ((ma[2] || "").toLowerCase() !== (mb[2] || "").toLowerCase()) return null;
  const sum = parseFloat(ma[1]) + parseFloat(mb[1]);
  return `${Math.round(sum * 10) / 10}${ma[2] ? " " + ma[2] : ""}`;
}
