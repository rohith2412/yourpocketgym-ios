/**
 * verifyExerciseImages.js
 *
 * Fast fix for exerciseImageCache.json:
 * 1. Finds exercises sharing the same image URL (obvious wrong matches)
 * 2. Re-fetches a fresh Pexels image with a precise search query
 * No AI calls — free and runs in ~1 minute.
 *
 * Run:  node scripts/verifyExerciseImages.js
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const PEXELS_KEY = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";
const CACHE_PATH = path.join(__dirname, "../src/data/exerciseImageCache.json");
const DELAY_MS   = 300;

// Exercises we KNOW have wrong/generic images — always re-fetch these
const FORCE_REFETCH = [
  "military press",
  "overhead press",
  "bench dip",
  "romanian deadlift",
  "good morning",
  "face pull",
  "upright row",
  "cable fly",
  "seated cable row",
  "leg press",
  "hip thrust",
  "glute bridge",
  "hyperextension",
  "reverse fly",
  "arnold press",
  "preacher curl",
  "concentration curl",
  "skull crusher",
  "tricep pushdown",
  "cable lateral raise",
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };
    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Bad JSON: " + data.slice(0, 200))); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function searchPexels(query) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const result = await fetchJSON(url, {
      headers: { Authorization: PEXELS_KEY }
    });
    const photos = result?.photos || [];
    if (photos.length === 0) return null;
    // Pick a random one from top 3 to avoid all exercises getting photo[0]
    const pick = photos[Math.floor(Math.random() * Math.min(3, photos.length))];
    return pick.src.large;
  } catch (e) {
    console.log(`  ⚠️  Pexels error: ${e.message}`);
    return null;
  }
}

// Extract Pexels photo ID from URL
function pexelsId(url) {
  const match = url.match(/photos\/(\d+)\//);
  return match ? match[1] : url;
}

async function main() {
  console.log("\n🏋️  Exercise Image Fixer");
  console.log("══════════════════════════════════════\n");

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  const exercises = Object.entries(cache);

  // ── Step 1: Find duplicate image URLs ─────────────────────────────────────
  const urlCount = {};
  for (const [name, url] of exercises) {
    const id = pexelsId(url);
    if (!urlCount[id]) urlCount[id] = [];
    urlCount[id].push(name);
  }

  const duplicates = new Set();
  for (const [id, names] of Object.entries(urlCount)) {
    if (names.length > 1) {
      console.log(`🔁 Shared image (${id}):`);
      names.forEach(n => console.log(`   • ${n}`));
      // Keep the first one (best match), re-fetch the rest
      names.slice(1).forEach(n => duplicates.add(n));
    }
  }

  // ── Step 2: Merge with force-refetch list ──────────────────────────────────
  const toFix = new Set([...duplicates, ...FORCE_REFETCH.filter(n => cache[n])]);

  console.log(`\n📋 Exercises to fix: ${toFix.size}`);
  console.log(`✅ Already unique:   ${exercises.length - toFix.size}\n`);
  console.log("══════════════════════════════════════\n");

  let fixed = 0;
  let failed = 0;

  for (const name of toFix) {
    console.log(`🔧 ${name}`);

    // Try increasingly specific queries
    const queries = [
      `${name} exercise gym`,
      `${name} workout training`,
      `person doing ${name}`,
    ];

    let newUrl = null;
    for (const query of queries) {
      await sleep(DELAY_MS);
      newUrl = await searchPexels(query);
      if (newUrl && pexelsId(newUrl) !== pexelsId(cache[name])) break;
      newUrl = null;
    }

    if (newUrl) {
      cache[name] = newUrl;
      fixed++;
      console.log(`   ✨ Fixed\n`);
    } else {
      failed++;
      console.log(`   ⚠️  No replacement found — keeping original\n`);
    }

    // Save progress after each fix
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }

  // Final save
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log("══════════════════════════════════════");
  console.log(`✨ Fixed   : ${fixed}`);
  console.log(`⚠️  Failed  : ${failed}`);
  console.log(`\n💾 Saved → ${CACHE_PATH}`);
  console.log("\n✅ Done! Rebuild the app to ship the fixed images.\n");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
