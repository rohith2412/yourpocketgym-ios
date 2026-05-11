/**
 * workoutPlanGenerator.ts
 *
 * Generates a complete weekly workout plan entirely on-device.
 * No API calls, no costs, works offline.
 *
 * Logic:
 *  1. Determine split based on daysPerWeek (full-body / upper-lower / PPL / Arnold)
 *  2. Filter exercises by equipment
 *  3. Prioritise focus areas
 *  4. Apply goal-specific rep/set schemes
 *  5. Respect experience level for exercise selection & volume
 *  6. Inject rest days to fill the week
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExerciseEntry = {
  name: string;
  muscleGroup: string;
  equipment: EquipmentTag[];
  compound: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
};

type EquipmentTag =
  | "barbell" | "dumbbell" | "cable" | "machine"
  | "bodyweight" | "kettlebell" | "band" | "any";

export type PlanExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
};

export type PlanDay = {
  day: string;
  label: string;
  focus: string;
  estimatedTime: number;
  restDay?: boolean;
  exercises: PlanExercise[];
};

export type WorkoutPlan = {
  planTitle: string;
  planSummary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  weeklyVolume: string;
  days: PlanDay[];
  weeklyGoals: string[];
  nutritionTips: string[];
  progressionTips: string[];
};

// ─── Exercise Database ────────────────────────────────────────────────────────

const DB: ExerciseEntry[] = [
  // ── Chest ─────────────────────────────────────────────────────────────────
  { name: "Bench Press",              muscleGroup: "chest",     equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Incline Bench Press",      muscleGroup: "chest",     equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Decline Bench Press",      muscleGroup: "chest",     equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Dumbbell Bench Press",     muscleGroup: "chest",     equipment: ["dumbbell"],             compound: true,  difficulty: "beginner" },
  { name: "Incline Dumbbell Press",   muscleGroup: "chest",     equipment: ["dumbbell"],             compound: true,  difficulty: "beginner" },
  { name: "Dumbbell Fly",             muscleGroup: "chest",     equipment: ["dumbbell"],             compound: false, difficulty: "beginner" },
  { name: "Incline Dumbbell Fly",     muscleGroup: "chest",     equipment: ["dumbbell"],             compound: false, difficulty: "intermediate" },
  { name: "Cable Fly",                muscleGroup: "chest",     equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "High Cable Fly",           muscleGroup: "chest",     equipment: ["cable"],                compound: false, difficulty: "intermediate" },
  { name: "Push Up",                  muscleGroup: "chest",     equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Wide Push Up",             muscleGroup: "chest",     equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Decline Push Up",          muscleGroup: "chest",     equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Dips",                     muscleGroup: "chest",     equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Pec Deck",                 muscleGroup: "chest",     equipment: ["machine"],              compound: false, difficulty: "beginner" },
  { name: "Chest Press Machine",      muscleGroup: "chest",     equipment: ["machine"],              compound: true,  difficulty: "beginner" },

  // ── Back ──────────────────────────────────────────────────────────────────
  { name: "Deadlift",                 muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Barbell Row",              muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Bent Over Row",            muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Romanian Deadlift",        muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Pull Up",                  muscleGroup: "back",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Chin Up",                  muscleGroup: "back",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Inverted Row",             muscleGroup: "back",      equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Dumbbell Row",             muscleGroup: "back",      equipment: ["dumbbell"],             compound: true,  difficulty: "beginner" },
  { name: "Single Arm Dumbbell Row",  muscleGroup: "back",      equipment: ["dumbbell"],             compound: true,  difficulty: "beginner" },
  { name: "Lat Pulldown",             muscleGroup: "back",      equipment: ["cable", "machine"],     compound: true,  difficulty: "beginner" },
  { name: "Seated Cable Row",         muscleGroup: "back",      equipment: ["cable"],                compound: true,  difficulty: "beginner" },
  { name: "Face Pull",                muscleGroup: "back",      equipment: ["cable", "band"],        compound: false, difficulty: "beginner" },
  { name: "Straight Arm Pulldown",    muscleGroup: "back",      equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "Hyperextension",           muscleGroup: "back",      equipment: ["machine", "bodyweight"],compound: false, difficulty: "beginner" },
  { name: "Rack Pull",                muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "advanced" },
  { name: "T-Bar Row",                muscleGroup: "back",      equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Renegade Row",             muscleGroup: "back",      equipment: ["dumbbell"],             compound: true,  difficulty: "advanced" },
  { name: "Kettlebell Deadlift",      muscleGroup: "back",      equipment: ["kettlebell"],           compound: true,  difficulty: "beginner" },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  { name: "Overhead Press",           muscleGroup: "shoulders", equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Military Press",           muscleGroup: "shoulders", equipment: ["barbell"],              compound: true,  difficulty: "beginner" },
  { name: "Dumbbell Shoulder Press",  muscleGroup: "shoulders", equipment: ["dumbbell"],             compound: true,  difficulty: "beginner" },
  { name: "Arnold Press",             muscleGroup: "shoulders", equipment: ["dumbbell"],             compound: true,  difficulty: "intermediate" },
  { name: "Lateral Raise",            muscleGroup: "shoulders", equipment: ["dumbbell", "cable"],    compound: false, difficulty: "beginner" },
  { name: "Front Raise",              muscleGroup: "shoulders", equipment: ["dumbbell", "cable"],    compound: false, difficulty: "beginner" },
  { name: "Rear Delt Fly",            muscleGroup: "shoulders", equipment: ["dumbbell", "cable"],    compound: false, difficulty: "beginner" },
  { name: "Cable Lateral Raise",      muscleGroup: "shoulders", equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "Upright Row",              muscleGroup: "shoulders", equipment: ["barbell", "dumbbell"],  compound: false, difficulty: "intermediate" },
  { name: "Shrugs",                   muscleGroup: "shoulders", equipment: ["barbell", "dumbbell"],  compound: false, difficulty: "beginner" },
  { name: "Push Press",               muscleGroup: "shoulders", equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Pike Push Up",             muscleGroup: "shoulders", equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Handstand Push Up",        muscleGroup: "shoulders", equipment: ["bodyweight"],           compound: true,  difficulty: "advanced" },
  { name: "Kettlebell Press",         muscleGroup: "shoulders", equipment: ["kettlebell"],           compound: true,  difficulty: "intermediate" },

  // ── Biceps ────────────────────────────────────────────────────────────────
  { name: "Barbell Curl",             muscleGroup: "arms",      equipment: ["barbell"],              compound: false, difficulty: "beginner" },
  { name: "EZ Bar Curl",              muscleGroup: "arms",      equipment: ["barbell"],              compound: false, difficulty: "beginner" },
  { name: "Dumbbell Curl",            muscleGroup: "arms",      equipment: ["dumbbell"],             compound: false, difficulty: "beginner" },
  { name: "Hammer Curl",              muscleGroup: "arms",      equipment: ["dumbbell"],             compound: false, difficulty: "beginner" },
  { name: "Incline Dumbbell Curl",    muscleGroup: "arms",      equipment: ["dumbbell"],             compound: false, difficulty: "intermediate" },
  { name: "Concentration Curl",       muscleGroup: "arms",      equipment: ["dumbbell"],             compound: false, difficulty: "beginner" },
  { name: "Preacher Curl",            muscleGroup: "arms",      equipment: ["barbell", "machine"],   compound: false, difficulty: "intermediate" },
  { name: "Cable Curl",               muscleGroup: "arms",      equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "Chin Up",                  muscleGroup: "arms",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Band Curl",                muscleGroup: "arms",      equipment: ["band"],                 compound: false, difficulty: "beginner" },

  // ── Triceps ───────────────────────────────────────────────────────────────
  { name: "Tricep Pushdown",          muscleGroup: "arms",      equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "Skull Crushers",           muscleGroup: "arms",      equipment: ["barbell"],              compound: false, difficulty: "intermediate" },
  { name: "Overhead Tricep Extension",muscleGroup: "arms",      equipment: ["dumbbell", "cable"],    compound: false, difficulty: "beginner" },
  { name: "Tricep Kickback",          muscleGroup: "arms",      equipment: ["dumbbell"],             compound: false, difficulty: "beginner" },
  { name: "Close Grip Bench Press",   muscleGroup: "arms",      equipment: ["barbell"],              compound: true,  difficulty: "intermediate" },
  { name: "Diamond Push Up",          muscleGroup: "arms",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Bench Dip",                muscleGroup: "arms",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Rope Pushdown",            muscleGroup: "arms",      equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "EZ Bar Skull Crusher",     muscleGroup: "arms",      equipment: ["barbell"],              compound: false, difficulty: "intermediate" },

  // ── Legs ──────────────────────────────────────────────────────────────────
  { name: "Squat",                    muscleGroup: "legs",      equipment: ["barbell", "bodyweight"],compound: true,  difficulty: "beginner" },
  { name: "Front Squat",              muscleGroup: "legs",      equipment: ["barbell"],              compound: true,  difficulty: "advanced" },
  { name: "Goblet Squat",             muscleGroup: "legs",      equipment: ["dumbbell", "kettlebell"],compound: true, difficulty: "beginner" },
  { name: "Bulgarian Split Squat",    muscleGroup: "legs",      equipment: ["dumbbell", "barbell", "bodyweight"], compound: true, difficulty: "intermediate" },
  { name: "Lunge",                    muscleGroup: "legs",      equipment: ["dumbbell", "barbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Walking Lunge",            muscleGroup: "legs",      equipment: ["dumbbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Reverse Lunge",            muscleGroup: "legs",      equipment: ["dumbbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Leg Press",                muscleGroup: "legs",      equipment: ["machine"],              compound: true,  difficulty: "beginner" },
  { name: "Leg Extension",            muscleGroup: "legs",      equipment: ["machine"],              compound: false, difficulty: "beginner" },
  { name: "Leg Curl",                 muscleGroup: "legs",      equipment: ["machine"],              compound: false, difficulty: "beginner" },
  { name: "Romanian Deadlift",        muscleGroup: "legs",      equipment: ["barbell", "dumbbell"],  compound: true,  difficulty: "intermediate" },
  { name: "Calf Raise",               muscleGroup: "legs",      equipment: ["machine", "barbell", "dumbbell", "bodyweight"], compound: false, difficulty: "beginner" },
  { name: "Seated Calf Raise",        muscleGroup: "legs",      equipment: ["machine"],              compound: false, difficulty: "beginner" },
  { name: "Box Jump",                 muscleGroup: "legs",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Step Up",                  muscleGroup: "legs",      equipment: ["dumbbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Wall Sit",                 muscleGroup: "legs",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Jump Squat",               muscleGroup: "legs",      equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Pistol Squat",             muscleGroup: "legs",      equipment: ["bodyweight"],           compound: true,  difficulty: "advanced" },
  { name: "Kettlebell Goblet Squat",  muscleGroup: "legs",      equipment: ["kettlebell"],           compound: true,  difficulty: "beginner" },
  { name: "Hack Squat",               muscleGroup: "legs",      equipment: ["machine", "barbell"],   compound: true,  difficulty: "intermediate" },
  { name: "Nordic Hamstring Curl",    muscleGroup: "legs",      equipment: ["bodyweight"],           compound: false, difficulty: "advanced" },

  // ── Glutes ────────────────────────────────────────────────────────────────
  { name: "Hip Thrust",               muscleGroup: "glutes",    equipment: ["barbell", "dumbbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Glute Bridge",             muscleGroup: "glutes",    equipment: ["barbell", "dumbbell", "bodyweight"], compound: true, difficulty: "beginner" },
  { name: "Cable Kickback",           muscleGroup: "glutes",    equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "Donkey Kick",              muscleGroup: "glutes",    equipment: ["bodyweight", "band"],   compound: false, difficulty: "beginner" },
  { name: "Fire Hydrant",             muscleGroup: "glutes",    equipment: ["bodyweight", "band"],   compound: false, difficulty: "beginner" },
  { name: "Sumo Deadlift",            muscleGroup: "glutes",    equipment: ["barbell", "dumbbell"],  compound: true,  difficulty: "intermediate" },
  { name: "Curtsy Lunge",             muscleGroup: "glutes",    equipment: ["dumbbell", "bodyweight"], compound: true, difficulty: "intermediate" },
  { name: "Abductor Machine",         muscleGroup: "glutes",    equipment: ["machine"],              compound: false, difficulty: "beginner" },
  { name: "Frog Pump",                muscleGroup: "glutes",    equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },

  // ── Core ──────────────────────────────────────────────────────────────────
  { name: "Plank",                    muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Side Plank",               muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Dead Bug",                 muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Hollow Hold",              muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "intermediate" },
  { name: "Crunch",                   muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Bicycle Crunch",           muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Leg Raise",                muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },
  { name: "Hanging Leg Raise",        muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "intermediate" },
  { name: "Russian Twist",            muscleGroup: "core",      equipment: ["bodyweight", "dumbbell"], compound: false, difficulty: "beginner" },
  { name: "Mountain Climber",         muscleGroup: "core",      equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Ab Rollout",               muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "intermediate" },
  { name: "Cable Crunch",             muscleGroup: "core",      equipment: ["cable"],                compound: false, difficulty: "beginner" },
  { name: "V Up",                     muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "intermediate" },
  { name: "Toes To Bar",              muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "advanced" },
  { name: "Pallof Press",             muscleGroup: "core",      equipment: ["cable", "band"],        compound: false, difficulty: "intermediate" },
  { name: "Flutter Kicks",            muscleGroup: "core",      equipment: ["bodyweight"],           compound: false, difficulty: "beginner" },

  // ── Cardio ────────────────────────────────────────────────────────────────
  { name: "Burpee",                   muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Jump Rope",                muscleGroup: "cardio",    equipment: ["any"],                  compound: true,  difficulty: "beginner" },
  { name: "High Knees",               muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Jumping Jacks",            muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Mountain Climber",         muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Battle Ropes",             muscleGroup: "cardio",    equipment: ["any"],                  compound: true,  difficulty: "intermediate" },
  { name: "Kettlebell Swing",         muscleGroup: "cardio",    equipment: ["kettlebell"],           compound: true,  difficulty: "intermediate" },
  { name: "Box Jump",                 muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "intermediate" },
  { name: "Sprint",                   muscleGroup: "cardio",    equipment: ["bodyweight"],           compound: true,  difficulty: "beginner" },
  { name: "Sled Push",                muscleGroup: "cardio",    equipment: ["any"],                  compound: true,  difficulty: "advanced" },
  { name: "Rowing Machine",           muscleGroup: "cardio",    equipment: ["machine"],              compound: true,  difficulty: "beginner" },
];

// ─── Splits ───────────────────────────────────────────────────────────────────

type Split = { label: string; focus: string; muscleGroups: string[] }[];

function getSplit(days: number, goal: string): Split {
  // Full body for 3 days or fat loss / endurance
  if (days <= 3 || goal === "Endurance") {
    const bases = [
      { label: "Full Body A", focus: "Compound Focus",   muscleGroups: ["chest","back","legs","core"] },
      { label: "Full Body B", focus: "Strength Focus",   muscleGroups: ["shoulders","back","legs","arms"] },
      { label: "Full Body C", focus: "Athletic Focus",   muscleGroups: ["chest","legs","glutes","core","cardio"] },
    ];
    return bases.slice(0, days);
  }

  if (days === 4) {
    return [
      { label: "Upper Body A", focus: "Push Focus",  muscleGroups: ["chest","shoulders","arms"] },
      { label: "Lower Body A", focus: "Quad Focus",  muscleGroups: ["legs","glutes","core"] },
      { label: "Upper Body B", focus: "Pull Focus",  muscleGroups: ["back","shoulders","arms"] },
      { label: "Lower Body B", focus: "Hamstring Focus", muscleGroups: ["legs","glutes","core"] },
    ];
  }

  if (days === 5) {
    return [
      { label: "Push Day",   focus: "Chest & Shoulders", muscleGroups: ["chest","shoulders","arms"] },
      { label: "Pull Day",   focus: "Back & Biceps",     muscleGroups: ["back","arms"] },
      { label: "Leg Day",    focus: "Lower Body",        muscleGroups: ["legs","glutes"] },
      { label: "Upper Body", focus: "Strength & Volume", muscleGroups: ["chest","back","shoulders","arms"] },
      { label: "Core & Cardio", focus: "Conditioning",  muscleGroups: ["core","cardio","legs"] },
    ];
  }

  // 6–7 days: Push / Pull / Legs × 2
  return [
    { label: "Push Day A",  focus: "Chest & Triceps",    muscleGroups: ["chest","arms"] },
    { label: "Pull Day A",  focus: "Back & Biceps",      muscleGroups: ["back","arms"] },
    { label: "Leg Day A",   focus: "Quads & Calves",     muscleGroups: ["legs"] },
    { label: "Push Day B",  focus: "Shoulders & Chest",  muscleGroups: ["shoulders","chest","arms"] },
    { label: "Pull Day B",  focus: "Back & Rear Delts",  muscleGroups: ["back","shoulders"] },
    { label: "Leg Day B",   focus: "Hamstrings & Glutes",muscleGroups: ["legs","glutes","core"] },
  ].slice(0, days);
}

// ─── Equipment filter ─────────────────────────────────────────────────────────

function getEquipmentTags(equipment: string): EquipmentTag[] {
  const e = equipment.toLowerCase();
  if (e.includes("full gym"))       return ["barbell","dumbbell","cable","machine","bodyweight","kettlebell"];
  if (e.includes("barbell"))        return ["barbell","dumbbell","bodyweight"];
  if (e.includes("dumbbell"))       return ["dumbbell","bodyweight"];
  if (e.includes("kettlebell"))     return ["kettlebell","dumbbell","bodyweight"];
  if (e.includes("resistance band") || e.includes("band")) return ["band","bodyweight"];
  if (e.includes("bodyweight"))     return ["bodyweight"];
  if (e.includes("home gym"))       return ["barbell","dumbbell","bodyweight","band"];
  return ["barbell","dumbbell","cable","machine","bodyweight"]; // default: assume full gym
}

function hasEquipment(ex: ExerciseEntry, allowed: EquipmentTag[]): boolean {
  if (ex.equipment.includes("any")) return true;
  return ex.equipment.some(e => allowed.includes(e));
}

// ─── Rep / set schemes ────────────────────────────────────────────────────────

type Scheme = { sets: number; reps: string; rest: string };

function getScheme(goal: string, isCompound: boolean, experience: string): Scheme {
  const vol = experience === "Advanced" ? 1 : 0; // advanced gets +1 set on compounds

  if (goal === "Improve strength") {
    return isCompound
      ? { sets: 4 + vol, reps: "4-6",  rest: "2-3 min" }
      : { sets: 3,       reps: "8-10", rest: "60-90 sec" };
  }
  if (goal === "Build muscle") {
    return isCompound
      ? { sets: 3 + vol, reps: "8-12", rest: "60-90 sec" }
      : { sets: 3,       reps: "10-15",rest: "45-60 sec" };
  }
  if (goal === "Lose fat") {
    return isCompound
      ? { sets: 3,       reps: "12-15",rest: "30-45 sec" }
      : { sets: 3,       reps: "15-20",rest: "30 sec" };
  }
  if (goal === "Endurance") {
    return isCompound
      ? { sets: 3,       reps: "15-20",rest: "30 sec" }
      : { sets: 2,       reps: "20-25",rest: "20 sec" };
  }
  // General fitness
  return isCompound
    ? { sets: 3,         reps: "10-12",rest: "60 sec" }
    : { sets: 3,         reps: "12-15",rest: "45 sec" };
}

// ─── Selector ─────────────────────────────────────────────────────────────────

// Stable deterministic shuffle (seeded by planTitle + dayLabel)
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let s = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickExercises(
  muscleGroups: string[],
  allowedEquip: EquipmentTag[],
  experience: string,
  focusAreas: string,
  injuries: string,
  sessionLength: number, // minutes
  seed: string,
): ExerciseEntry[] {
  const maxLevel = experience === "Beginner" ? "beginner"
    : experience === "Advanced" ? "advanced" : "intermediate";
  const levelOrder = ["beginner", "intermediate", "advanced"];
  const maxIdx     = levelOrder.indexOf(maxLevel);

  const injuryLower = injuries.toLowerCase();
  const focusLower  = focusAreas.toLowerCase();

  // Count how many exercises we can fit given session length
  // Rough estimate: compound ~4 min/set, isolation ~3 min/set, warm-up 5 min
  const timePerEx  = 4;
  const warmup     = 5;
  const maxExCount = Math.max(3, Math.floor((sessionLength - warmup) / timePerEx));

  const results: ExerciseEntry[] = [];

  // Distribute slots across muscle groups (prioritise focused areas)
  const slotMap: Record<string, number> = {};
  for (const mg of muscleGroups) {
    const isFocused = focusLower.includes(mg) || focusLower.includes("full body");
    slotMap[mg] = (slotMap[mg] || 0) + (isFocused ? 2 : 1);
  }
  const totalSlots = Object.values(slotMap).reduce((a, b) => a + b, 0);
  const usedNames  = new Set<string>();

  for (const mg of muscleGroups) {
    const slots    = Math.max(1, Math.round((slotMap[mg] / totalSlots) * maxExCount));
    const pool     = seededShuffle(
      DB.filter(ex =>
        ex.muscleGroup === mg &&
        hasEquipment(ex, allowedEquip) &&
        levelOrder.indexOf(ex.difficulty) <= maxIdx &&
        !injuryLower.includes(ex.muscleGroup) &&
        !usedNames.has(ex.name)
      ),
      seed + mg,
    );

    // Always lead with at least one compound if available
    const compounds   = pool.filter(e => e.compound);
    const isolations  = pool.filter(e => !e.compound);
    const ordered     = [...compounds, ...isolations];

    for (let i = 0; i < Math.min(slots, ordered.length); i++) {
      usedNames.add(ordered[i].name);
      results.push(ordered[i]);
      if (results.length >= maxExCount) break;
    }
    if (results.length >= maxExCount) break;
  }

  return results;
}

// ─── Time estimator ───────────────────────────────────────────────────────────

function estimateTime(exercises: ExerciseEntry[], goal: string): number {
  const setsPerEx = goal === "Improve strength" ? 4.5 : 3;
  const restSec   = goal === "Improve strength" ? 150 : goal === "Build muscle" ? 75 : 40;
  const setDurSec = 45; // avg time under tension per set
  const warmup    = 5;
  const total     = exercises.length * setsPerEx * ((setDurSec + restSec) / 60) + warmup;
  return Math.round(Math.max(20, Math.min(90, total)));
}

// ─── Plan metadata ────────────────────────────────────────────────────────────

function planTitle(goal: string, days: number, experience: string): string {
  const titles: Record<string, string[]> = {
    "Build muscle":     ["Hypertrophy Blueprint", "Mass Builder Protocol", "Size & Strength Plan"],
    "Lose fat":         ["Shred & Condition", "Fat Loss Accelerator", "Lean Body Protocol"],
    "Improve strength": ["Raw Strength Program", "Power Builder Plan", "Strength Foundation"],
    "General fitness":  ["All-Round Athletic Plan", "Fitness Foundation Program", "Complete Fitness Plan"],
    "Endurance":        ["Endurance & Conditioning", "Stamina Builder Plan", "Athletic Endurance Protocol"],
  };
  const opts  = titles[goal] || titles["General fitness"];
  const seed  = (goal + days + experience).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${opts[seed % opts.length]} — ${days}×/week`;
}

const WEEKLY_GOALS: Record<string, string[]> = {
  "Build muscle":     ["Hit protein target every day (1.6–2g per kg bodyweight)", "Log progressive overload each session", "Sleep 7-9 hours for optimal muscle protein synthesis", "Stay hydrated — 3L water minimum"],
  "Lose fat":         ["Maintain a 300-500 calorie daily deficit", "Hit 8,000+ steps on rest days", "Prioritise protein to preserve muscle mass", "Track your meals — awareness drives results"],
  "Improve strength": ["Rest 2–3 minutes between heavy compound sets", "Log every working set weight and reps", "Eat at maintenance or slight surplus", "Prioritise sleep — strength gains happen at night"],
  "General fitness":  ["Stay consistent — 3 workouts beats 7 planned and 0 done", "Add 10 min of walking daily", "Focus on form over weight", "Hydrate and recover between sessions"],
  "Endurance":        ["Keep rest periods short (20–40 sec)", "Add Zone 2 cardio on rest days", "Eat complex carbs for sustained energy", "Track heart rate — stay in the 70-85% max zone"],
};
const NUTRITION_TIPS: Record<string, string[]> = {
  "Build muscle":     ["Eat 1.6–2.2g protein per kg bodyweight daily", "Time carbs around workouts for energy and recovery", "Don't skip meals — muscle growth needs a caloric surplus"],
  "Lose fat":         ["Eat protein first at every meal to stay full", "Avoid liquid calories — water, black coffee, plain tea", "Don't cut too aggressively — 500 cal deficit max"],
  "Improve strength": ["Eat maintenance calories or slight surplus (+200–300)", "Prioritise carbs before training — they fuel lifts", "Post-workout: 30–40g protein within 60 minutes"],
  "General fitness":  ["Eat whole foods 80% of the time", "Don't skip breakfast before morning sessions", "Include vegetables at every meal for micronutrients"],
  "Endurance":        ["Carb load slightly before long sessions", "Replenish electrolytes after heavy sweat sessions", "Eat a balanced meal 2–3 hours before training"],
};
const PROGRESSION_TIPS: Record<string, string[]> = {
  "Build muscle":     ["Add 2.5kg to compound lifts every 1-2 weeks when you hit the top rep range", "Switch rep ranges every 4 weeks to avoid adaptation", "Deload every 6–8 weeks — take weight down 40% for a week"],
  "Lose fat":         ["Don't sacrifice form for speed — injury kills momentum", "Increase weights every 2 weeks to maintain muscle", "Add 5 min to cardio blocks each week"],
  "Improve strength": ["Run a linear progression — add weight every session until you can't", "When stuck, drop to 80% and rebuild over 3 weeks", "Record maxes monthly — seeing progress is motivating"],
  "General fitness":  ["Increase reps or weight every 2 weeks", "Introduce new exercises every 6 weeks to stay engaged", "Track your sessions — consistency is the only metric that matters"],
  "Endurance":        ["Reduce rest by 5 seconds each week", "Add a round to circuits every 2 weeks", "Once cardio feels easy, increase intensity before duration"],
};

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateWorkoutPlan(profile: {
  goal: string;
  experience: string;
  daysPerWeek: string;
  equipment: string;
  focusAreas: string;
  sessionLength: string;
  injuries: string;
}): WorkoutPlan {
  const goal        = profile.goal         || "General fitness";
  const experience  = profile.experience   || "Beginner";
  const days        = Math.min(7, Math.max(1, parseInt(profile.daysPerWeek) || 4));
  const equipment   = profile.equipment    || "Full gym";
  const focusAreas  = profile.focusAreas   || "";
  const injuries    = profile.injuries     || "";
  const sessionLen  = Math.max(20, parseInt(profile.sessionLength) || 45);

  const allowedEquip = getEquipmentTags(equipment);
  const split        = getSplit(days, goal);
  const seed         = goal + experience + equipment + focusAreas;

  const workoutDays: PlanDay[] = split.map((s, i) => {
    const exercises = pickExercises(
      s.muscleGroups, allowedEquip, experience,
      focusAreas, injuries, sessionLen,
      seed + s.label + i,
    );

    const planExercises: PlanExercise[] = exercises.map(ex => {
      const scheme = getScheme(goal, ex.compound, experience);
      return {
        name:        ex.name,
        muscleGroup: ex.muscleGroup,
        sets:        scheme.sets,
        reps:        scheme.reps,
        rest:        scheme.rest,
      };
    });

    const estTime = estimateTime(exercises, goal);

    return {
      day:           ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i] || "Monday",
      label:         s.label,
      focus:         s.focus,
      estimatedTime: estTime,
      exercises:     planExercises,
    };
  });

  // Pad remaining days as rest days
  const allDayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const restDays: PlanDay[] = allDayNames.slice(days).map(d => ({
    day:           d,
    label:         "Rest Day",
    focus:         "Recovery",
    estimatedTime: 0,
    restDay:       true,
    exercises:     [],
  }));

  const totalSets = workoutDays.reduce((acc, d) =>
    acc + d.exercises.reduce((a, e) => a + e.sets, 0), 0);

  const diffMap: Record<string, "Beginner" | "Intermediate" | "Advanced"> = {
    Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced",
  };

  return {
    planTitle:       planTitle(goal, days, experience),
    planSummary:     `A ${days}-day-per-week ${goal.toLowerCase()} program tailored for ${experience.toLowerCase()} athletes with ${equipment.toLowerCase()}.`,
    difficulty:      diffMap[experience] || "Intermediate",
    weeklyVolume:    `${totalSets} sets / week`,
    days:            [...workoutDays, ...restDays],
    weeklyGoals:     WEEKLY_GOALS[goal]     || WEEKLY_GOALS["General fitness"],
    nutritionTips:   NUTRITION_TIPS[goal]   || NUTRITION_TIPS["General fitness"],
    progressionTips: PROGRESSION_TIPS[goal] || PROGRESSION_TIPS["General fitness"],
  };
}
