/**
 * manualFix.js
 * Hardcodes verified Pexels image URLs for exercises the auto-script got wrong.
 * Run: node scripts/manualFix.js
 */

const fs   = require("fs");
const path = require("path");

const CACHE_PATH = path.join(__dirname, "../src/data/exerciseImageCache.json");
const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));

// Verified correct Pexels photos — alt text confirmed via API
const MANUAL_FIXES = {
  // Overhead / shoulder presses — "man lifting barbell overhead" / "shoulder press exercise"
  "military press":          "https://images.pexels.com/photos/14591574/pexels-photo-14591574.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "overhead press":          "https://images.pexels.com/photos/4720786/pexels-photo-4720786.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "push press":              "https://images.pexels.com/photos/14591572/pexels-photo-14591572.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "seated dumbbell press":   "https://images.pexels.com/photos/7289370/pexels-photo-7289370.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "arnold press":            "https://images.pexels.com/photos/7289370/pexels-photo-7289370.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",

  // Dips — "tricep dips exercises" / "triceps dips using bench"
  "bench dip":               "https://images.pexels.com/photos/8567596/pexels-photo-8567596.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "dips":                    "https://images.pexels.com/photos/12999606/pexels-photo-12999606.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "chest dip":               "https://images.pexels.com/photos/4803875/pexels-photo-4803875.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",

  // Deadlift variations — "athletic woman deadlift" / "man lifting barbell"
  "romanian deadlift":       "https://images.pexels.com/photos/10308253/pexels-photo-10308253.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  "sumo deadlift":           "https://images.pexels.com/photos/4853280/pexels-photo-4853280.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

let count = 0;
for (const [name, url] of Object.entries(MANUAL_FIXES)) {
  if (cache[name] !== undefined) {
    cache[name] = url;
    console.log(`✅ Fixed: ${name}`);
    count++;
  } else {
    console.log(`⚠️  Not in cache: ${name}`);
  }
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
console.log(`\n💾 Saved ${count} fixes → ${CACHE_PATH}`);
