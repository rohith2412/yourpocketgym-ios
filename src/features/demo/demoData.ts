// Rich, deterministic sample data for App Store screenshots.
// Everything is derived from "today" so screenshots always look fresh.

import type { FoodEntry, MacroGoals, WaterState } from "../nutrition/storage";
import type { WeightEntry } from "../progress/storage";
import type { Routine } from "../routines/storage";
import type { SleepEntry, MoodEntry } from "../recovery/storage";
import type { WorkoutLog } from "../train/api";

const DAY_MS = 24 * 60 * 60 * 1000;

function iso(d: Date): string {
  return d.toLocaleDateString("en-CA");
}
function daysBack(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ─── Food ────────────────────────────────────────────────────────────────────

const MEAL_TEMPLATES = [
  // Breakfast
  { name: "Greek yogurt with berries",   calories: 240, protein: 22, carbs: 28, fat: 4  },
  { name: "Overnight oats",              calories: 380, protein: 15, carbs: 55, fat: 10 },
  { name: "Avocado toast, two eggs",     calories: 470, protein: 22, carbs: 32, fat: 26 },
  { name: "Protein pancakes",            calories: 430, protein: 32, carbs: 48, fat: 12 },
  { name: "Scrambled eggs and bacon",    calories: 520, protein: 34, carbs: 6,  fat: 39 },
  { name: "Banana peanut butter oats",   calories: 450, protein: 18, carbs: 62, fat: 14 },
  // Lunch
  { name: "Grilled chicken salad",       calories: 420, protein: 42, carbs: 18, fat: 20 },
  { name: "Turkey wrap",                 calories: 490, protein: 30, carbs: 44, fat: 18 },
  { name: "Tuna poke bowl",              calories: 540, protein: 40, carbs: 58, fat: 14 },
  { name: "Chicken burrito bowl",        calories: 680, protein: 46, carbs: 72, fat: 20 },
  { name: "Caesar salad with shrimp",    calories: 390, protein: 34, carbs: 14, fat: 22 },
  { name: "Lentil soup and sourdough",   calories: 410, protein: 20, carbs: 60, fat: 9  },
  // Dinner
  { name: "Salmon and quinoa bowl",      calories: 560, protein: 38, carbs: 48, fat: 22 },
  { name: "Steak with sweet potato",     calories: 640, protein: 45, carbs: 55, fat: 24 },
  { name: "Ribeye and rice",             calories: 720, protein: 52, carbs: 60, fat: 28 },
  { name: "Chicken stir fry",            calories: 520, protein: 44, carbs: 46, fat: 16 },
  { name: "Spaghetti bolognese",         calories: 660, protein: 34, carbs: 78, fat: 22 },
  { name: "Cod, potatoes and greens",    calories: 480, protein: 42, carbs: 40, fat: 14 },
  { name: "Chicken tikka and naan",      calories: 700, protein: 44, carbs: 66, fat: 26 },
  // Snacks
  { name: "Protein shake",               calories: 210, protein: 30, carbs: 12, fat: 3  },
  { name: "Cottage cheese and almonds",  calories: 320, protein: 26, carbs: 12, fat: 18 },
  { name: "Apple and peanut butter",     calories: 270, protein: 8,  carbs: 30, fat: 15 },
  { name: "Beef jerky",                  calories: 160, protein: 26, carbs: 8,  fat: 3  },
  { name: "Rice cakes and honey",        calories: 190, protein: 3,  carbs: 42, fat: 1  },
];

export function generateFoodEntries(days = 30): FoodEntry[] {
  const rand = seededRandom(42);
  const out: FoodEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysBack(i);
    const dateISO = iso(d);
    // 4–5 entries a day: three meals plus a snack or two, which is what a
    // committed logger's day actually looks like.
    const mealCount = 4 + (rand() > 0.45 ? 1 : 0);
    const usedToday = new Set<string>();
    for (let m = 0; m < mealCount; m++) {
      let tmpl = MEAL_TEMPLATES[Math.floor(rand() * MEAL_TEMPLATES.length)];
      // Two identical rows in one day is the detail that gives away sample data.
      for (let tries = 0; tries < 6 && usedToday.has(tmpl.name); tries++) {
        tmpl = MEAL_TEMPLATES[Math.floor(rand() * MEAL_TEMPLATES.length)];
      }
      usedToday.add(tmpl.name);
      const hour = 7 + m * 3 + Math.floor(rand() * 2);
      const loggedAt = new Date(d);
      loggedAt.setHours(hour, Math.floor(rand() * 60), 0, 0);
      out.push({
        id: `demo_f_${i}_${m}`,
        date: dateISO,
        loggedAt: loggedAt.toISOString(),
        name: tmpl.name,
        calories: tmpl.calories,
        protein: tmpl.protein,
        carbs: tmpl.carbs,
        fat: tmpl.fat,
      });
    }
  }
  return out;
}

export const DEMO_MACRO_GOALS: MacroGoals = {
  calories: 2200,
  protein: 165,
  carbs: 240,
  fat: 70,
};

// ─── Water ───────────────────────────────────────────────────────────────────

export function generateWater(days = 30): WaterState {
  const rand = seededRandom(11);
  const water: WaterState = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = daysBack(i);
    // 1.8L – 3.2L per day
    water[iso(d)] = Math.round((1800 + rand() * 1400) / 250) * 250;
  }
  return water;
}
export const DEMO_WATER_GOAL_ML = 3000;

// ─── Weight ──────────────────────────────────────────────────────────────────

export function generateWeightLog(days = 60): WeightEntry[] {
  // Trending down slowly, with realistic day-to-day noise
  const rand = seededRandom(7);
  const startLb = 182;
  const targetLb = 172;
  const out: WeightEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysBack(i);
    const t = 1 - i / (days - 1); // 0..1
    const trend = startLb + (targetLb - startLb) * t;
    const noise = (rand() - 0.5) * 1.2;
    const lb = +(trend + noise).toFixed(1);
    out.push({
      id: `demo_w_${i}`,
      date: iso(d),
      loggedAt: d.toISOString(),
      lb,
    });
  }
  return out;
}

// ─── Routines ────────────────────────────────────────────────────────────────

export function generateRoutine(): Routine {
  const now = new Date().toISOString();
  return {
    id: "demo_r_main",
    createdAt: now,
    updatedAt: now,
    days: {
      1: {
        name: "Push day",
        exercises: [
          { name: "Bench press",            muscleGroup: "Chest" },
          { name: "Overhead press",         muscleGroup: "Shoulders" },
          { name: "Incline dumbbell press", muscleGroup: "Chest" },
          { name: "Triceps rope pushdown",  muscleGroup: "Arms" },
        ],
      },
      2: {
        name: "Pull day",
        exercises: [
          { name: "Deadlift",         muscleGroup: "Back" },
          { name: "Pull-ups",         muscleGroup: "Back" },
          { name: "Barbell row",      muscleGroup: "Back" },
          { name: "Barbell curl",     muscleGroup: "Arms" },
        ],
      },
      3: {
        name: "Legs",
        exercises: [
          { name: "Back squat",       muscleGroup: "Legs" },
          { name: "Romanian deadlift", muscleGroup: "Legs" },
          { name: "Leg press",        muscleGroup: "Legs" },
          { name: "Calf raises",      muscleGroup: "Legs" },
        ],
      },
      4: {
        name: "Push day",
        exercises: [
          { name: "Incline bench press", muscleGroup: "Chest" },
          { name: "Lateral raises",      muscleGroup: "Shoulders" },
          { name: "Dips",                muscleGroup: "Chest" },
        ],
      },
      5: {
        name: "Pull day",
        exercises: [
          { name: "Weighted pull-ups", muscleGroup: "Back" },
          { name: "Cable row",         muscleGroup: "Back" },
          { name: "Face pulls",        muscleGroup: "Shoulders" },
        ],
      },
    },
  };
}

// ─── Sleep + Mood ────────────────────────────────────────────────────────────

export function generateSleep(days = 30): SleepEntry[] {
  const rand = seededRandom(21);
  const out: SleepEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysBack(i);
    const hours = +(6.5 + rand() * 2.2).toFixed(1);
    const quality = (Math.max(1, Math.min(5, Math.round(3 + (hours - 7) * 1.2))) as 1 | 2 | 3 | 4 | 5);
    out.push({
      date: iso(d),
      hours,
      quality,
      loggedAt: d.toISOString(),
    });
  }
  return out;
}

export function generateMood(days = 30): MoodEntry[] {
  const rand = seededRandom(84);
  const out: MoodEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysBack(i);
    const score = (Math.max(2, Math.min(5, Math.round(3.6 + (rand() - 0.5) * 2))) as 1 | 2 | 3 | 4 | 5);
    out.push({
      date: iso(d),
      score,
      loggedAt: d.toISOString(),
    });
  }
  return out;
}

// ─── Workout logs (for useWorkoutLogs override) ──────────────────────────────

const WORKOUT_TEMPLATES: { name: string; muscleGroup: string; sets: [number, number][] }[][] = [
  [ // Push
    { name: "Bench press",            muscleGroup: "Chest",     sets: [[8, 185], [8, 185], [6, 205], [6, 205]] },
    { name: "Incline dumbbell press", muscleGroup: "Chest",     sets: [[10, 60], [10, 60], [10, 60]] },
    { name: "Overhead press",         muscleGroup: "Shoulders", sets: [[8, 115], [8, 115], [8, 115]] },
    { name: "Lateral raise",          muscleGroup: "Shoulders", sets: [[15, 20], [15, 20], [15, 20]] },
    { name: "Triceps rope pushdown",  muscleGroup: "Arms",      sets: [[12, 55], [12, 55], [12, 55]] },
    { name: "Cable fly",              muscleGroup: "Chest",     sets: [[12, 35], [12, 35], [12, 35]] },
  ],
  [ // Pull
    { name: "Deadlift",               muscleGroup: "Back",      sets: [[5, 275], [5, 295], [3, 315]] },
    { name: "Pull-ups",               muscleGroup: "Back",      sets: [[8, 0], [8, 0], [7, 0]] },
    { name: "Barbell row",            muscleGroup: "Back",      sets: [[10, 155], [10, 155], [10, 155]] },
    { name: "Face pull",              muscleGroup: "Shoulders", sets: [[15, 40], [15, 40], [15, 40]] },
    { name: "Barbell curl",           muscleGroup: "Arms",      sets: [[10, 75], [10, 75], [8, 85]] },
    { name: "Hammer curl",            muscleGroup: "Arms",      sets: [[12, 30], [12, 30], [12, 30]] },
  ],
  [ // Legs
    { name: "Back squat",             muscleGroup: "Legs",      sets: [[8, 225], [6, 245], [4, 275]] },
    { name: "Romanian deadlift",      muscleGroup: "Legs",      sets: [[10, 185], [10, 185], [10, 185]] },
    { name: "Leg press",              muscleGroup: "Legs",      sets: [[12, 360], [12, 360], [12, 360]] },
    { name: "Walking lunge",          muscleGroup: "Legs",      sets: [[12, 40], [12, 40]] },
    { name: "Hanging leg raise",      muscleGroup: "Core",      sets: [[12, 0], [12, 0], [10, 0]] },
    { name: "Cable crunch",           muscleGroup: "Core",      sets: [[15, 60], [15, 60], [15, 60]] },
  ],
  [ // Upper
    { name: "Incline bench press",    muscleGroup: "Chest",     sets: [[8, 155], [8, 155], [6, 175]] },
    { name: "Weighted pull-ups",      muscleGroup: "Back",      sets: [[6, 25], [6, 25], [5, 25]] },
    { name: "Seated dumbbell press",  muscleGroup: "Shoulders", sets: [[10, 50], [10, 50], [8, 55]] },
    { name: "Chest-supported row",    muscleGroup: "Back",      sets: [[12, 90], [12, 90], [12, 90]] },
    { name: "Skull crushers",         muscleGroup: "Arms",      sets: [[12, 65], [12, 65], [10, 75]] },
    { name: "Preacher curl",          muscleGroup: "Arms",      sets: [[10, 60], [10, 60], [10, 60]] },
  ],
  [ // Lower
    { name: "Front squat",            muscleGroup: "Legs",      sets: [[6, 185], [6, 185], [5, 205]] },
    { name: "Hip thrust",             muscleGroup: "Legs",      sets: [[10, 275], [10, 275], [10, 295]] },
    { name: "Leg curl",               muscleGroup: "Legs",      sets: [[12, 110], [12, 110], [12, 110]] },
    { name: "Calf raise",             muscleGroup: "Legs",      sets: [[15, 180], [15, 180], [15, 180]] },
    { name: "Ab wheel rollout",       muscleGroup: "Core",      sets: [[12, 0], [12, 0], [10, 0]] },
    { name: "Plank",                  muscleGroup: "Core",      sets: [[1, 0], [1, 0], [1, 0]] },
  ],
  [ // Arms and core
    { name: "Close-grip bench",       muscleGroup: "Arms",      sets: [[8, 145], [8, 145], [8, 145]] },
    { name: "Incline curl",           muscleGroup: "Arms",      sets: [[12, 25], [12, 25], [12, 25]] },
    { name: "Overhead triceps ext.",  muscleGroup: "Arms",      sets: [[12, 70], [12, 70], [12, 70]] },
    { name: "Rear delt fly",          muscleGroup: "Shoulders", sets: [[15, 20], [15, 20], [15, 20]] },
    { name: "Russian twist",          muscleGroup: "Core",      sets: [[20, 25], [20, 25]] },
    { name: "Decline sit-up",         muscleGroup: "Core",      sets: [[15, 10], [15, 10], [15, 10]] },
  ],
];

export function generateWorkoutLogs(days = 45): WorkoutLog[] {
  const rand = seededRandom(3);
  const out: WorkoutLog[] = [];
  for (let i = 0; i < days; i++) {
    // Rest two days a week, offset so the streak strip isn't a visible pattern.
    if (i % 7 === 3 || i % 7 === 6) continue;
    const d = daysBack(i);
    const tmpl = WORKOUT_TEMPLATES[i % WORKOUT_TEMPLATES.length];
    out.push({
      _id: `demo_wo_${i}`,
      date: d.toISOString(),
      exercises: tmpl.map((ex) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets.map(([reps, weight], idx) => ({
          setNumber: idx + 1,
          reps,
          // Round to nearest 2.5 lb — real users lift in plate increments,
          // not floating-point decimals.
          weight: Math.round((weight + (rand() - 0.5) * 4) / 2.5) * 2.5,
        })),
      })),
    });
  }
  return out;
}
