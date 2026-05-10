/**
 * Patches the `image:` field of every recipe in mealPlanRecipes.ts
 * with the dish-matched URL from foodImageCache.json.
 *
 * Run:  node scripts/patchRecipeImages.js
 */

const fs   = require("fs");
const path = require("path");

const RECIPES_PATH = path.join(__dirname, "../src/data/mealPlanRecipes.ts");
const CACHE_PATH   = path.join(__dirname, "../src/data/foodImageCache.json");

const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
let   src   = fs.readFileSync(RECIPES_PATH, "utf8");

let patched = 0;
let skipped = 0;

// Match each recipe block's id and image field, then replace the image value.
// Handles both:
//   image: U("some-id"),
//   image: "https://...",
src = src.replace(
  /id:\s*"([^"]+)"([^}]*?)image:\s*([^,\n]+)/gs,
  (match, id, between, oldImg) => {
    const url = cache[id];
    if (!url) { skipped++; return match; }

    // Build the replacement image value — always a plain string literal
    const newImg = `"${url}"`;
    patched++;
    return `id: "${id}"${between}image: ${newImg}`;
  }
);

fs.writeFileSync(RECIPES_PATH, src, "utf8");
console.log(`✅ Patched ${patched} recipes, skipped ${skipped} (not in cache).`);
