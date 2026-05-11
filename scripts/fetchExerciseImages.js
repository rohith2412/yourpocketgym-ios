/**
 * Fetches a real gym photo for every common exercise and writes
 * src/data/exerciseImageCache.json  (normalizedName → imageUrl).
 *
 * Resolution order:
 *   1. Pexels — "{exercise name} exercise workout"
 *   2. Pexels — "{muscle group} gym workout"
 *
 * Keys are lowercased + trimmed so runtime lookup is just:
 *   exerciseImageCache[normalizeExKey(ex.name)]
 *
 * Run:  node scripts/fetchExerciseImages.js
 */

const fs   = require("fs");
const path = require("path");

const PEXELS_KEY = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";

// ── Exercise list ─────────────────────────────────────────────────────────────

const EXERCISES = [
  // ── Chest ──────────────────────────────────────────────────────────────────
  { name: "Bench Press",               muscle: "chest" },
  { name: "Incline Bench Press",       muscle: "chest" },
  { name: "Decline Bench Press",       muscle: "chest" },
  { name: "Dumbbell Bench Press",      muscle: "chest" },
  { name: "Dumbbell Fly",              muscle: "chest" },
  { name: "Incline Dumbbell Press",    muscle: "chest" },
  { name: "Incline Dumbbell Fly",      muscle: "chest" },
  { name: "Cable Fly",                 muscle: "chest" },
  { name: "Low Cable Fly",             muscle: "chest" },
  { name: "High Cable Fly",            muscle: "chest" },
  { name: "Push Up",                   muscle: "chest" },
  { name: "Wide Push Up",              muscle: "chest" },
  { name: "Decline Push Up",           muscle: "chest" },
  { name: "Incline Push Up",           muscle: "chest" },
  { name: "Dips",                      muscle: "chest" },
  { name: "Chest Dip",                 muscle: "chest" },
  { name: "Chest Press Machine",       muscle: "chest" },
  { name: "Pec Deck",                  muscle: "chest" },
  { name: "Smith Machine Bench Press", muscle: "chest" },
  { name: "Landmine Press",            muscle: "chest" },
  { name: "Svend Press",               muscle: "chest" },
  { name: "Plate Press",               muscle: "chest" },

  // ── Back ───────────────────────────────────────────────────────────────────
  { name: "Pull Up",                   muscle: "back" },
  { name: "Chin Up",                   muscle: "back" },
  { name: "Neutral Grip Pull Up",      muscle: "back" },
  { name: "Assisted Pull Up",          muscle: "back" },
  { name: "Barbell Row",               muscle: "back" },
  { name: "Bent Over Row",             muscle: "back" },
  { name: "Pendlay Row",               muscle: "back" },
  { name: "Dumbbell Row",              muscle: "back" },
  { name: "Single Arm Dumbbell Row",   muscle: "back" },
  { name: "Lat Pulldown",              muscle: "back" },
  { name: "Wide Grip Lat Pulldown",    muscle: "back" },
  { name: "Close Grip Lat Pulldown",   muscle: "back" },
  { name: "Seated Cable Row",          muscle: "back" },
  { name: "Cable Row",                 muscle: "back" },
  { name: "Chest Supported Row",       muscle: "back" },
  { name: "Meadows Row",               muscle: "back" },
  { name: "Deadlift",                  muscle: "back" },
  { name: "Romanian Deadlift",         muscle: "back" },
  { name: "Stiff Leg Deadlift",        muscle: "back" },
  { name: "T-Bar Row",                 muscle: "back" },
  { name: "Face Pull",                 muscle: "back" },
  { name: "Hyperextension",            muscle: "back" },
  { name: "Back Extension",            muscle: "back" },
  { name: "Good Morning",              muscle: "back" },
  { name: "Rack Pull",                 muscle: "back" },
  { name: "Inverted Row",              muscle: "back" },
  { name: "Renegade Row",              muscle: "back" },
  { name: "Cable Pullover",            muscle: "back" },
  { name: "Straight Arm Pulldown",     muscle: "back" },

  // ── Shoulders ──────────────────────────────────────────────────────────────
  { name: "Overhead Press",            muscle: "shoulders" },
  { name: "Military Press",            muscle: "shoulders" },
  { name: "Dumbbell Shoulder Press",   muscle: "shoulders" },
  { name: "Seated Dumbbell Press",     muscle: "shoulders" },
  { name: "Arnold Press",              muscle: "shoulders" },
  { name: "Lateral Raise",             muscle: "shoulders" },
  { name: "Dumbbell Lateral Raise",    muscle: "shoulders" },
  { name: "Cable Lateral Raise",       muscle: "shoulders" },
  { name: "Front Raise",               muscle: "shoulders" },
  { name: "Dumbbell Front Raise",      muscle: "shoulders" },
  { name: "Plate Front Raise",         muscle: "shoulders" },
  { name: "Rear Delt Fly",             muscle: "shoulders" },
  { name: "Bent Over Lateral Raise",   muscle: "shoulders" },
  { name: "Upright Row",               muscle: "shoulders" },
  { name: "Barbell Upright Row",       muscle: "shoulders" },
  { name: "Shrugs",                    muscle: "shoulders" },
  { name: "Barbell Shrug",             muscle: "shoulders" },
  { name: "Dumbbell Shrug",            muscle: "shoulders" },
  { name: "Push Press",                muscle: "shoulders" },
  { name: "Bradford Press",            muscle: "shoulders" },
  { name: "Behind The Neck Press",     muscle: "shoulders" },
  { name: "Handstand Push Up",         muscle: "shoulders" },
  { name: "Pike Push Up",              muscle: "shoulders" },
  { name: "Machine Shoulder Press",    muscle: "shoulders" },
  { name: "Cable Front Raise",         muscle: "shoulders" },

  // ── Arms — Biceps ──────────────────────────────────────────────────────────
  { name: "Barbell Curl",              muscle: "arms" },
  { name: "Dumbbell Curl",             muscle: "arms" },
  { name: "Alternating Dumbbell Curl", muscle: "arms" },
  { name: "Hammer Curl",               muscle: "arms" },
  { name: "Cross Body Hammer Curl",    muscle: "arms" },
  { name: "Incline Dumbbell Curl",     muscle: "arms" },
  { name: "Preacher Curl",             muscle: "arms" },
  { name: "EZ Bar Curl",               muscle: "arms" },
  { name: "EZ Bar Preacher Curl",      muscle: "arms" },
  { name: "Cable Curl",                muscle: "arms" },
  { name: "Concentration Curl",        muscle: "arms" },
  { name: "Reverse Curl",              muscle: "arms" },
  { name: "Spider Curl",               muscle: "arms" },
  { name: "Zottman Curl",              muscle: "arms" },
  { name: "21s Curl",                  muscle: "arms" },
  { name: "Machine Curl",              muscle: "arms" },

  // ── Arms — Triceps ─────────────────────────────────────────────────────────
  { name: "Tricep Pushdown",           muscle: "arms" },
  { name: "Cable Tricep Pushdown",     muscle: "arms" },
  { name: "Rope Pushdown",             muscle: "arms" },
  { name: "Skull Crushers",            muscle: "arms" },
  { name: "EZ Bar Skull Crusher",      muscle: "arms" },
  { name: "Overhead Tricep Extension", muscle: "arms" },
  { name: "Dumbbell Tricep Extension", muscle: "arms" },
  { name: "Close Grip Bench Press",    muscle: "arms" },
  { name: "Tricep Kickback",           muscle: "arms" },
  { name: "Diamond Push Up",           muscle: "arms" },
  { name: "Tricep Dip",                muscle: "arms" },
  { name: "Bench Dip",                 muscle: "arms" },
  { name: "Cable Overhead Extension",  muscle: "arms" },
  { name: "JM Press",                  muscle: "arms" },

  // ── Legs ───────────────────────────────────────────────────────────────────
  { name: "Squat",                     muscle: "legs" },
  { name: "Barbell Squat",             muscle: "legs" },
  { name: "Back Squat",                muscle: "legs" },
  { name: "Front Squat",               muscle: "legs" },
  { name: "Goblet Squat",              muscle: "legs" },
  { name: "Sumo Squat",                muscle: "legs" },
  { name: "Hack Squat",                muscle: "legs" },
  { name: "Smith Machine Squat",       muscle: "legs" },
  { name: "Box Squat",                 muscle: "legs" },
  { name: "Pause Squat",               muscle: "legs" },
  { name: "Overhead Squat",            muscle: "legs" },
  { name: "Leg Press",                 muscle: "legs" },
  { name: "Leg Extension",             muscle: "legs" },
  { name: "Leg Curl",                  muscle: "legs" },
  { name: "Seated Leg Curl",           muscle: "legs" },
  { name: "Lying Leg Curl",            muscle: "legs" },
  { name: "Lunge",                     muscle: "legs" },
  { name: "Walking Lunge",             muscle: "legs" },
  { name: "Reverse Lunge",             muscle: "legs" },
  { name: "Side Lunge",                muscle: "legs" },
  { name: "Bulgarian Split Squat",     muscle: "legs" },
  { name: "Split Squat",               muscle: "legs" },
  { name: "Calf Raise",                muscle: "legs" },
  { name: "Seated Calf Raise",         muscle: "legs" },
  { name: "Standing Calf Raise",       muscle: "legs" },
  { name: "Donkey Calf Raise",         muscle: "legs" },
  { name: "Step Up",                   muscle: "legs" },
  { name: "Box Jump",                  muscle: "legs" },
  { name: "Depth Jump",                muscle: "legs" },
  { name: "Jump Squat",                muscle: "legs" },
  { name: "Nordic Hamstring Curl",     muscle: "legs" },
  { name: "Single Leg Romanian Deadlift", muscle: "legs" },
  { name: "Single Leg Press",          muscle: "legs" },
  { name: "Pistol Squat",              muscle: "legs" },
  { name: "Wall Sit",                  muscle: "legs" },
  { name: "Sissy Squat",               muscle: "legs" },

  // ── Glutes ─────────────────────────────────────────────────────────────────
  { name: "Hip Thrust",                muscle: "glutes" },
  { name: "Barbell Hip Thrust",        muscle: "glutes" },
  { name: "Glute Bridge",              muscle: "glutes" },
  { name: "Single Leg Glute Bridge",   muscle: "glutes" },
  { name: "Cable Kickback",            muscle: "glutes" },
  { name: "Donkey Kick",               muscle: "glutes" },
  { name: "Fire Hydrant",              muscle: "glutes" },
  { name: "Sumo Deadlift",             muscle: "glutes" },
  { name: "Curtsy Lunge",              muscle: "glutes" },
  { name: "Banded Squat Walk",         muscle: "glutes" },
  { name: "Glute Kickback Machine",    muscle: "glutes" },
  { name: "Abductor Machine",          muscle: "glutes" },
  { name: "Adductor Machine",          muscle: "glutes" },
  { name: "Frog Pump",                 muscle: "glutes" },
  { name: "Romanian Split Squat",      muscle: "glutes" },

  // ── Core / Abs ─────────────────────────────────────────────────────────────
  { name: "Plank",                     muscle: "core" },
  { name: "Side Plank",                muscle: "core" },
  { name: "Weighted Plank",            muscle: "core" },
  { name: "Crunch",                    muscle: "core" },
  { name: "Weighted Crunch",           muscle: "core" },
  { name: "Bicycle Crunch",            muscle: "core" },
  { name: "Leg Raise",                 muscle: "core" },
  { name: "Hanging Leg Raise",         muscle: "core" },
  { name: "Toes To Bar",               muscle: "core" },
  { name: "Russian Twist",             muscle: "core" },
  { name: "Weighted Russian Twist",    muscle: "core" },
  { name: "Ab Rollout",                muscle: "core" },
  { name: "Ab Wheel Rollout",          muscle: "core" },
  { name: "Cable Crunch",              muscle: "core" },
  { name: "Mountain Climber",          muscle: "core" },
  { name: "Hollow Hold",               muscle: "core" },
  { name: "Hollow Body Rock",          muscle: "core" },
  { name: "V Up",                      muscle: "core" },
  { name: "Dead Bug",                  muscle: "core" },
  { name: "Pallof Press",              muscle: "core" },
  { name: "Landmine Rotation",         muscle: "core" },
  { name: "Dragon Flag",               muscle: "core" },
  { name: "Flutter Kicks",             muscle: "core" },
  { name: "Scissor Kicks",             muscle: "core" },
  { name: "Sit Up",                    muscle: "core" },
  { name: "Decline Sit Up",            muscle: "core" },
  { name: "Toe Touch Crunch",          muscle: "core" },
  { name: "Reverse Crunch",            muscle: "core" },
  { name: "Woodchop",                  muscle: "core" },
  { name: "Cable Woodchop",            muscle: "core" },
  { name: "Ab Machine",                muscle: "core" },
  { name: "Suitcase Carry",            muscle: "core" },
  { name: "Farmer Carry",              muscle: "core" },

  // ── Cardio / Full body ─────────────────────────────────────────────────────
  { name: "Burpee",                    muscle: "cardio" },
  { name: "Jump Rope",                 muscle: "cardio" },
  { name: "Double Under",              muscle: "cardio" },
  { name: "Jumping Jacks",             muscle: "cardio" },
  { name: "High Knees",                muscle: "cardio" },
  { name: "Battle Ropes",              muscle: "cardio" },
  { name: "Rowing Machine",            muscle: "cardio" },
  { name: "Treadmill Run",             muscle: "cardio" },
  { name: "Stair Climber",             muscle: "cardio" },
  { name: "Sled Push",                 muscle: "cardio" },
  { name: "Sled Pull",                 muscle: "cardio" },
  { name: "Kettlebell Swing",          muscle: "cardio" },
  { name: "Box Step Up",               muscle: "cardio" },
  { name: "Sprint",                    muscle: "cardio" },
  { name: "Assault Bike",              muscle: "cardio" },
  { name: "Ski Erg",                   muscle: "cardio" },
  { name: "Bear Crawl",                muscle: "cardio" },
  { name: "Inchworm",                  muscle: "cardio" },
  { name: "Lateral Shuffle",           muscle: "cardio" },

  // ── Full Body / Compound ───────────────────────────────────────────────────
  { name: "Clean",                     muscle: "cardio" },
  { name: "Power Clean",               muscle: "cardio" },
  { name: "Hang Clean",                muscle: "cardio" },
  { name: "Clean And Press",           muscle: "cardio" },
  { name: "Snatch",                    muscle: "cardio" },
  { name: "Hang Snatch",               muscle: "cardio" },
  { name: "Thruster",                  muscle: "cardio" },
  { name: "Turkish Get Up",            muscle: "cardio" },
  { name: "Kettlebell Clean",          muscle: "cardio" },
  { name: "Kettlebell Press",          muscle: "shoulders" },
  { name: "Kettlebell Goblet Squat",   muscle: "legs" },
  { name: "Kettlebell Deadlift",       muscle: "back" },
  { name: "Trap Bar Deadlift",         muscle: "back" },
  { name: "Sumo Deadlift High Pull",   muscle: "back" },
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
    const photo = json?.photos?.[0];
    if (photo) return photo.src.large;
  } catch {}
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Load existing cache so we don't re-fetch what we already have
  const outPath = path.join(__dirname, "../src/data/exerciseImageCache.json");
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(outPath, "utf8")); } catch {}

  const toFetch = EXERCISES.filter(({ name }) => !existing[name.toLowerCase().trim()]);
  console.log(`Total: ${EXERCISES.length} exercises. Already cached: ${EXERCISES.length - toFetch.length}. Fetching: ${toFetch.length}\n`);

  const result = { ...existing };
  let hits = 0, fallback = 0, skipped = EXERCISES.length - toFetch.length;

  for (let i = 0; i < toFetch.length; i++) {
    const { name, muscle } = toFetch[i];
    const key = name.toLowerCase().trim();

    // Try 1: exact exercise name + context
    let url = await searchPexels(`${name} exercise gym workout`);
    await sleep(260);

    // Try 2: muscle group fallback
    if (!url) {
      url = await searchPexels(`${muscle} gym workout fitness`);
      await sleep(260);
      fallback++;
      console.log(`~ [${i+1}/${toFetch.length}] ${name}  (muscle fallback: ${muscle})`);
    } else {
      hits++;
      console.log(`✓ [${i+1}/${toFetch.length}] ${name}`);
    }

    if (url) result[key] = url;
  }

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   ${skipped}  already cached (skipped)`);
  console.log(`   ${hits}  new exact matches`);
  console.log(`   ${fallback}  muscle-group fallbacks`);
  console.log(`   ${Object.keys(result).length} total entries → src/data/exerciseImageCache.json`);
}

main().catch(console.error);
