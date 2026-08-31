/**
 * Lightweight client-side gate: only lets messages related to health/fitness
 * reach the Coach API. Not perfect (can't replace a real classifier), but
 * catches obvious off-topic requests without spending an API call.
 */

// Broad allow-list of fitness / nutrition / health / recovery terms.
const FITNESS_TERMS = [
  // training
  "workout", "workouts", "exercise", "exercises", "training", "train", "gym",
  "lift", "lifting", "lifted", "cardio", "run", "running", "jog", "jogging",
  "sprint", "sprints", "hiit", "yoga", "pilates", "stretch", "stretches",
  "stretching", "mobility", "flexibility", "warmup", "warm-up", "cooldown",
  "cool-down", "form", "technique", "posture",
  // lifts
  "bench", "squat", "squats", "deadlift", "deadlifts", "press", "pressing",
  "curl", "curls", "row", "rows", "pullup", "pull-up", "pullups", "chinup",
  "chin-up", "pushup", "push-up", "pushups", "lunge", "lunges", "plank",
  "planks", "dip", "dips", "burpee", "burpees", "snatch", "clean", "jerk",
  "overhead", "shoulder press", "lat pulldown", "romanian",
  // muscles / body
  "muscle", "muscles", "chest", "back", "shoulder", "shoulders", "arm",
  "arms", "leg", "legs", "quad", "quads", "hamstring", "hamstrings", "glute",
  "glutes", "calf", "calves", "bicep", "biceps", "tricep", "triceps", "abs",
  "core", "traps", "lats", "delts", "forearm", "forearms", "neck", "hip",
  "hips", "spine", "posterior chain", "physique", "body",
  // programming / metrics
  "rep", "reps", "set", "sets", "volume", "intensity", "tempo", "rir", "rpe",
  "1rm", "one rep max", "pr", "personal record", "plan", "routine", "split",
  "hypertrophy", "strength", "endurance", "power", "conditioning",
  // nutrition
  "eat", "eating", "food", "meal", "meals", "diet", "nutrition", "calorie",
  "calories", "cal", "kcal", "macro", "macros", "protein", "carb", "carbs",
  "fat", "fats", "fiber", "sugar", "hydration", "water", "supplement",
  "supplements", "creatine", "whey", "casein", "vitamin", "vitamins",
  "electrolyte", "electrolytes", "caffeine", "pre-workout", "preworkout",
  "post-workout", "postworkout", "fasting", "cut", "bulk", "cutting",
  "bulking", "recomp", "maintenance", "deficit", "surplus",
  // health / recovery / body composition
  "sleep", "rest", "recovery", "recover", "injury", "injured", "sore",
  "soreness", "pain", "cramp", "cramps", "mobility", "stretch", "massage",
  "foam roll", "weight", "weigh", "bmi", "fat loss", "gain", "lose", "loss",
  "fit", "fitness", "shape", "tone", "toned", "lean", "cut", "cuts",
  "flexibility", "cardiovascular", "heart rate", "hr", "steps", "activity",
  // greetings + meta questions about coach itself (always allowed)
  "hi", "hello", "hey", "hola", "yo", "sup", "thanks", "thank you", "ok",
  "coach", "help", "advice", "tip", "tips", "how do i", "how can i",
  "what should i", "what can you do", "who are you",
];

// Terms that indicate off-topic (weather, coding, politics, generic AI chat).
// Presence of these strong signals blocks even if a fitness term appears.
const OFF_TOPIC_HARD_BLOCK = [
  "weather", "temperature outside", "stock", "stocks", "crypto", "bitcoin",
  "president", "election", "politics", "war", "javascript", "python",
  "typescript", "code", "coding", "program", "programming", "html", "css",
  "sql", "recipe for chocolate", "movie", "movies", "netflix", "song",
  "song lyrics", "joke", "poem", "story", "essay",
];

/** Returns true if the message looks health/fitness related. */
export function isFitnessRelated(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length === 0) return false;

  // Very short greetings — always allowed
  if (t.length <= 5) return true;

  // Hard block signals win regardless
  for (const kw of OFF_TOPIC_HARD_BLOCK) {
    if (t.includes(kw)) return false;
  }

  // Otherwise: at least one fitness/health term must appear
  for (const kw of FITNESS_TERMS) {
    if (t.includes(kw)) return true;
  }
  return false;
}
