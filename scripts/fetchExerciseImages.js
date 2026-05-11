/**
 * Fetches a real gym photo for every common exercise and writes
 * src/data/exerciseImageCache.json  (normalizedName → imageUrl).
 *
 * Resolution order:
 *   1. Pexels — "{exercise name} exercise workout"
 *   2. Pexels — "{muscle group} gym workout"
 *
 * Keys are lowercased + trimmed so runtime lookup is just:
 *   exerciseImageCache[ex.name.toLowerCase().trim()]
 *
 * Run:  node scripts/fetchExerciseImages.js
 */

const fs   = require("fs");
const path = require("path");

const PEXELS_KEY = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";

// ── Exercise list ─────────────────────────────────────────────────────────────
// Covers the most common exercises an AI trainer generates across all groups.

const EXERCISES = [
  // Chest
  { name: "Bench Press",              muscle: "chest" },
  { name: "Incline Bench Press",      muscle: "chest" },
  { name: "Decline Bench Press",      muscle: "chest" },
  { name: "Dumbbell Fly",             muscle: "chest" },
  { name: "Incline Dumbbell Press",   muscle: "chest" },
  { name: "Cable Fly",                muscle: "chest" },
  { name: "Push Up",                  muscle: "chest" },
  { name: "Dips",                     muscle: "chest" },
  { name: "Chest Press Machine",      muscle: "chest" },
  { name: "Pec Deck",                 muscle: "chest" },

  // Back
  { name: "Pull Up",                  muscle: "back" },
  { name: "Chin Up",                  muscle: "back" },
  { name: "Barbell Row",              muscle: "back" },
  { name: "Dumbbell Row",             muscle: "back" },
  { name: "Lat Pulldown",             muscle: "back" },
  { name: "Seated Cable Row",         muscle: "back" },
  { name: "Deadlift",                 muscle: "back" },
  { name: "Romanian Deadlift",        muscle: "back" },
  { name: "T-Bar Row",                muscle: "back" },
  { name: "Face Pull",                muscle: "back" },
  { name: "Hyperextension",           muscle: "back" },

  // Shoulders
  { name: "Overhead Press",           muscle: "shoulders" },
  { name: "Dumbbell Shoulder Press",  muscle: "shoulders" },
  { name: "Lateral Raise",            muscle: "shoulders" },
  { name: "Front Raise",              muscle: "shoulders" },
  { name: "Arnold Press",             muscle: "shoulders" },
  { name: "Upright Row",              muscle: "shoulders" },
  { name: "Rear Delt Fly",            muscle: "shoulders" },
  { name: "Cable Lateral Raise",      muscle: "shoulders" },
  { name: "Shrugs",                   muscle: "shoulders" },

  // Arms – Biceps
  { name: "Barbell Curl",             muscle: "arms" },
  { name: "Dumbbell Curl",            muscle: "arms" },
  { name: "Hammer Curl",              muscle: "arms" },
  { name: "Incline Dumbbell Curl",    muscle: "arms" },
  { name: "Preacher Curl",            muscle: "arms" },
  { name: "Cable Curl",               muscle: "arms" },
  { name: "Concentration Curl",       muscle: "arms" },
  { name: "EZ Bar Curl",              muscle: "arms" },

  // Arms – Triceps
  { name: "Tricep Pushdown",          muscle: "arms" },
  { name: "Skull Crushers",           muscle: "arms" },
  { name: "Overhead Tricep Extension",muscle: "arms" },
  { name: "Close Grip Bench Press",   muscle: "arms" },
  { name: "Tricep Kickback",          muscle: "arms" },
  { name: "Diamond Push Up",          muscle: "arms" },

  // Legs
  { name: "Squat",                    muscle: "legs" },
  { name: "Barbell Squat",            muscle: "legs" },
  { name: "Front Squat",              muscle: "legs" },
  { name: "Goblet Squat",             muscle: "legs" },
  { name: "Leg Press",                muscle: "legs" },
  { name: "Leg Extension",            muscle: "legs" },
  { name: "Leg Curl",                 muscle: "legs" },
  { name: "Lunge",                    muscle: "legs" },
  { name: "Walking Lunge",            muscle: "legs" },
  { name: "Bulgarian Split Squat",    muscle: "legs" },
  { name: "Calf Raise",               muscle: "legs" },
  { name: "Seated Calf Raise",        muscle: "legs" },
  { name: "Step Up",                  muscle: "legs" },
  { name: "Box Jump",                 muscle: "legs" },
  { name: "Sumo Squat",               muscle: "legs" },
  { name: "Hack Squat",               muscle: "legs" },

  // Glutes
  { name: "Hip Thrust",               muscle: "glutes" },
  { name: "Glute Bridge",             muscle: "glutes" },
  { name: "Cable Kickback",           muscle: "glutes" },
  { name: "Donkey Kick",              muscle: "glutes" },
  { name: "Sumo Deadlift",            muscle: "glutes" },
  { name: "Curtsy Lunge",             muscle: "glutes" },

  // Core / Abs
  { name: "Plank",                    muscle: "core" },
  { name: "Side Plank",               muscle: "core" },
  { name: "Crunch",                   muscle: "core" },
  { name: "Bicycle Crunch",           muscle: "core" },
  { name: "Leg Raise",                muscle: "core" },
  { name: "Russian Twist",            muscle: "core" },
  { name: "Ab Rollout",               muscle: "core" },
  { name: "Cable Crunch",             muscle: "core" },
  { name: "Mountain Climber",         muscle: "core" },
  { name: "Hollow Hold",              muscle: "core" },
  { name: "V Up",                     muscle: "core" },
  { name: "Dead Bug",                 muscle: "core" },

  // Cardio / Full body
  { name: "Burpee",                   muscle: "cardio" },
  { name: "Jump Rope",                muscle: "cardio" },
  { name: "Jumping Jacks",            muscle: "cardio" },
  { name: "High Knees",               muscle: "cardio" },
  { name: "Battle Ropes",             muscle: "cardio" },
  { name: "Rowing Machine",           muscle: "cardio" },
  { name: "Treadmill Run",            muscle: "cardio" },
  { name: "Stair Climber",            muscle: "cardio" },
  { name: "Sled Push",                muscle: "cardio" },
  { name: "Kettlebell Swing",         muscle: "cardio" },
  { name: "Box Step Up",              muscle: "cardio" },
  { name: "Sprint",                   muscle: "cardio" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    // Prefer medium size (~1200px) for good quality without huge payload
    const photo = json?.photos?.[0];
    if (photo) return photo.src.large;
  } catch {}
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching images for ${EXERCISES.length} exercises from Pexels…\n`);

  const result = {};
  let hits = 0, fallback = 0;

  for (let i = 0; i < EXERCISES.length; i++) {
    const { name, muscle } = EXERCISES[i];
    const key = name.toLowerCase().trim();

    // Try 1: exact exercise name
    let url = await searchPexels(`${name} exercise gym workout`);
    await sleep(250);

    // Try 2: muscle group gym if exercise search failed
    if (!url) {
      url = await searchPexels(`${muscle} gym workout fitness`);
      await sleep(250);
      fallback++;
      console.log(`~ [${i+1}/${EXERCISES.length}] ${name}  (muscle fallback: ${muscle})`);
    } else {
      hits++;
      console.log(`✓ [${i+1}/${EXERCISES.length}] ${name}`);
    }

    if (url) result[key] = url;
  }

  const outPath = path.join(__dirname, "../src/data/exerciseImageCache.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   ${hits}  exact exercise matches`);
  console.log(`   ${fallback}  muscle-group fallbacks`);
  console.log(`   → src/data/exerciseImageCache.json`);
}

main().catch(console.error);
