export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Goal = "fat loss" | "muscle gain" | "maintenance" | "weight gain";

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
};

export type Ingredient = { item: string; amount: string };

export type Recipe = {
  name: string;
  emoji: string;
  goal: Goal;
  mealType: MealType;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  macros: Macros;
  ingredients: Ingredient[];
  steps: string[];
  proteinSources?: string[];
  tip?: string;
  dietaryTags?: string[];
  calorieRange?: string;
  maxProtein?: number;
  totalTime?: number;
};

export type PlanDay = {
  day: number; // 1..N
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snack: Recipe | null;
};

export type Plan = {
  goal: Goal;
  days: PlanDay[];
  totals: Macros; // per-day averages
};
