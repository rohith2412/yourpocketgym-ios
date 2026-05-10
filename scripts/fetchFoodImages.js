/**
 * Fetches a dish-matched Pexels photo for every recipe and writes
 * src/data/foodImageCache.json  (recipeId → imageUrl).
 *
 * Resolution order:
 *   1. Pexels search — full dish name (e.g. "black bean tacos")
 *   2. Pexels search — first 2 words  (e.g. "black bean")
 *   3. Pexels search — main ingredient (e.g. "chicken")
 *   4. TheMealDB   — name search      (guaranteed CDN, no 404)
 *   5. TheMealDB   — ingredient filter
 *
 * Run:  node scripts/fetchFoodImages.js
 */

const fs   = require("fs");
const path = require("path");

const PEXELS_KEY = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";

// ── helpers ───────────────────────────────────────────────────────────────────

const NATIONALITY_RE =
  /^(Cambodian|Korean|Japanese|Thai|Vietnamese|Indian|Chinese|Mexican|Greek|Italian|Spanish|German|French|Moroccan|Lebanese|Turkish|Israeli|Iranian|Nigerian|Ethiopian|Peruvian|Brazilian|Argentinian|Bangladeshi|Burmese|Samoan|Hawaiian|Filipino|Malaysian|Indonesian|Portuguese|Ukrainian|Czech|Belgian|Dutch|South African|Tanzanian|Chilean|Puerto Rican|Barbadian|American|British|Scottish|Irish|Canadian|Australian|Taiwanese|Singaporean|Sri Lankan|Pakistani|Nepali|Afghani|Uzbek|Georgian|Armenian|Azerbaijani|Kenyan|Ugandan|Rwandan|Senegalese|Ghanaian|Egyptian|Sudanese|Libyan|Algerian|Tunisian|Somali)\s+/gi;

const UNIT_RE = /\b(cups?|tbsps?|tsps?|g|kg|ml|oz|lb|lbs|slices?|pieces?|medium|large|small|cans?|bunch|handful|pinch|dash|cloves?|sprigs?|halves?|heads?)\b/gi;
const QTY_RE  = /[\d¼½¾⅓⅔⅛⅜⅝⅞\-–\/]+/g;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getQueries(name, ingredients) {
  const stripped = name.replace(NATIONALITY_RE, "").trim();
  const words    = stripped.split(/\s+/).filter(Boolean);

  const ingRaw = (ingredients?.[0] ?? "")
    .replace(QTY_RE, "").replace(UNIT_RE, "").replace(/[,()]/g, "").trim();
  const SKIP = new Set(["of","and","or","the","a","an","with","fresh","dried","cooked","raw","chopped","sliced","diced","minced","grated","crushed"]);
  const ingWord = ingRaw.split(/\s+/).find(w => w.length > 2 && !SKIP.has(w.toLowerCase())) ?? "";

  return [
    stripped,                       // "Black Bean Tacos"
    words.slice(0, 2).join(" "),    // "Black Bean"
    words[0],                       // "Black"
    ingWord,                        // "chicken"
  ].filter((q, i, a) => q.length > 1 && a.indexOf(q) === i);
}

// ── Pexels ────────────────────────────────────────────────────────────────────

async function searchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const photo = json?.photos?.[0];
    if (photo) return photo.src.large; // ~940px wide, sharp
  } catch {}
  return null;
}

// ── TheMealDB (fallback) ──────────────────────────────────────────────────────

async function mealdbByName(queries) {
  for (const q of queries) {
    try {
      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
      const json = await res.json();
      const thumb = json?.meals?.[0]?.strMealThumb;
      if (thumb) return thumb;
    } catch {}
    await sleep(80);
  }
  return null;
}

async function mealdbByIngredient(ingredient) {
  if (!ingredient || ingredient.length < 2) return null;
  try {
    const res   = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
    const json  = await res.json();
    const meals = json?.meals;
    if (meals?.length) {
      const idx = ingredient.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % meals.length;
      return meals[idx].strMealThumb ?? meals[0].strMealThumb;
    }
  } catch {}
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const src    = fs.readFileSync(path.join(__dirname, "../src/data/mealPlanRecipes.ts"), "utf8");
  const blocks = [...src.matchAll(/id:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?mealType:\s*"([^"]+)"[^}]*?ingredients:\s*(\[[^\]]+\])/gs)];

  const recipes = blocks.map(m => {
    let ingredients = [];
    try { ingredients = JSON.parse(m[4].replace(/'/g, '"')); } catch {}
    return { id: m[1], name: m[2], mealType: m[3], ingredients };
  });

  console.log(`Found ${recipes.length} recipes. Fetching images from Pexels…\n`);

  const result = {};
  let pexels = 0, mealdb = 0, fallback = 0;

  for (let i = 0; i < recipes.length; i++) {
    const r       = recipes[i];
    const queries = getQueries(r.name, r.ingredients);
    let   url     = null;

    // 1 + 2 + 3 — Pexels (try each query until we get a photo)
    for (const q of queries) {
      url = await searchPexels(q);
      if (url) break;
      await sleep(220); // stay well under 200 req/min limit
    }

    if (url) {
      pexels++;
      result[r.id] = url;
      console.log(`✓  [${i+1}/${recipes.length}] ${r.name}`);
      await sleep(220);
      continue;
    }

    // 4 — TheMealDB name search
    url = await mealdbByName(queries);
    if (url) {
      mealdb++;
      result[r.id] = url;
      console.log(`~m [${i+1}/${recipes.length}] ${r.name}  (TheMealDB meal)`);
      await sleep(120);
      continue;
    }

    // 5 — TheMealDB ingredient filter
    const ingWord = queries[queries.length - 1];
    url = await mealdbByIngredient(ingWord);
    if (url) {
      mealdb++;
      result[r.id] = url;
      console.log(`~i [${i+1}/${recipes.length}] ${r.name}  (TheMealDB ingredient)`);
      await sleep(120);
      continue;
    }

    // Should never reach here
    fallback++;
    result[r.id] = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ingWord || "Chicken")}-Medium.png`;
    console.log(`✗  [${i+1}/${recipes.length}] ${r.name}  (illustration fallback)`);
  }

  const outPath = path.join(__dirname, "../src/data/foodImageCache.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   ${pexels}  Pexels dish-matched photos`);
  console.log(`   ${mealdb}  TheMealDB fallback photos`);
  console.log(`   ${fallback}  illustration fallbacks`);
  console.log(`   → src/data/foodImageCache.json`);
}

main().catch(console.error);
