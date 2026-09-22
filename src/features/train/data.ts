export const EXERCISE_LIBRARY = {
  Chest: ["Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Fly", "Cable Fly", "Push-Up", "Chest Dip", "Incline Dumbbell Press", "Pec Deck Machine", "Landmine Press"],
  Back: ["Pull-Up", "Chin-Up", "Lat Pulldown", "Seated Cable Row", "Barbell Row", "Dumbbell Row", "T-Bar Row", "Face Pull", "Deadlift", "Romanian Deadlift", "Good Morning", "Back Extension"],
  Shoulders: ["Overhead Press", "Dumbbell Shoulder Press", "Arnold Press", "Lateral Raise", "Front Raise", "Rear Delt Fly", "Upright Row", "Cable Lateral Raise", "Machine Shoulder Press", "Shrug"],
  Arms: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl", "Incline Dumbbell Curl", "Concentration Curl", "Tricep Pushdown", "Skull Crusher", "Close-Grip Bench", "Overhead Tricep Extension", "Dips", "Diamond Push-Up"],
  Legs: ["Squat", "Front Squat", "Leg Press", "Hack Squat", "Bulgarian Split Squat", "Lunge", "Romanian Deadlift", "Leg Curl", "Leg Extension", "Calf Raise", "Glute Bridge", "Hip Thrust", "Step-Up", "Sumo Deadlift"],
  Core: ["Plank", "Crunch", "Sit-Up", "Leg Raise", "Hanging Leg Raise", "Ab Wheel Rollout", "Cable Crunch", "Russian Twist", "Bicycle Crunch", "Dead Bug", "Pallof Press", "Dragon Flag"],
} as const;

export type MuscleGroup = keyof typeof EXERCISE_LIBRARY;
export const MUSCLE_GROUPS = Object.keys(EXERCISE_LIBRARY) as MuscleGroup[];

// ── Small helpers ─────────────────────────────────────────────────────────────
type LikeSet = { reps: number; weight: number };
type LikeLog = { date: string; exercises: { sets: LikeSet[] }[] };

export const totalVolSets = (sets: LikeSet[]) => sets.reduce((s, x) => s + x.reps * x.weight, 0);
export const maxWeight = (sets: LikeSet[]) => (sets.length ? Math.max(...sets.map((s) => s.weight)) : 0);
export const totalVolLog = (log: LikeLog) =>
  log.exercises.reduce((sum, ex) => sum + ex.exercises?.length ?? 0 + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0);

/** Rolling 7-day activity: array of {label, active, today}. */
export function getWeekActivity(logs: LikeLog[]) {
  const days = [];
  const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toLocaleDateString("en-CA");
    const active = logs.some((l) => new Date(l.date).toLocaleDateString("en-CA") === iso);
    days.push({ label: dayLetters[d.getDay()], date: d.getDate(), active, today: i === 0 });
  }
  return days;
}
