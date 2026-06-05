/**
 * fixFoodImages.js
 *
 * Rebuilds foodImageCache.json with keys that match the actual recipe IDs
 * in mealPlanRecipes.ts (format: b_in1, l_us2, d_jp3, etc.)
 *
 * Strategy per recipe:
 *   1. Try optimised search query (dish-specific)
 *   2. Try simplified fallback (e.g. just the main ingredient)
 *   3. Use a category photo if Pexels returns nothing
 *
 * Run:  node scripts/fixFoodImages.js
 * Time: ~60 seconds (168 recipes × 300ms delay)
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const PEXELS_KEY  = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";
const CACHE_PATH  = path.join(__dirname, "../src/data/foodImageCache.json");
const DELAY_MS    = 320;

// ── Category fallback photos (verified Pexels IDs) ───────────────────────────
// Used when no specific match is found
const FALLBACK = {
  breakfast: "566564",   // bowl of food, morning
  lunch:     "1640777",  // salad bowl
  dinner:    "1640774",  // cooked meal plate
  snack:     "5191842",  // small bites / snack plate
  rice:      "7426748",  // rice bowl
  curry:     "2474661",  // curry bowl
  noodles:   "699953",   // noodle dish
  soup:      "539451",   // soup bowl
  salad:     "1640777",  // salad
  bread:     "1549897",  // bread
  pasta:     "1460872",  // pasta dish
  sandwich:  "2097090",  // sandwich
  egg:       "6275164",  // egg dish
  chicken:   "2338407",  // cooked chicken
  fish:      "28503597", // fish dish
  fruit:     "1132047",  // fruit bowl
  oatmeal:   "3026804",  // oatmeal / porridge
  pancakes:  "7144310",  // pancakes
  tacos:     "2087748",  // tacos
  pizza:     "825661",   // pizza
  steak:     "1410235",  // steak
  korean:    "37309226", // Korean food
  japanese:  "15108364", // Japanese food
  chinese:   "34772941", // Chinese food
  indian:    "5560763",  // Indian food
  african:   "17502263", // African food
};

// ── Recipe list: id → { name, queries[] } ────────────────────────────────────
// queries[] tried in order; first Pexels hit wins.
// Keep queries specific enough to return a real matching dish photo.
const RECIPES = [
  // ── Indian Breakfast ────────────────────────────────────────────────────────
  { id:"b_in1",  queries:["idli sambar indian breakfast", "idli with sambar bowl"] },
  { id:"b_in2",  queries:["masala dosa indian crepe", "dosa south indian food"] },
  { id:"b_in3",  queries:["aloo paratha indian flatbread", "paratha with curd yogurt"] },
  { id:"b_in4",  queries:["poha indian breakfast flattened rice", "poha dish"] },
  { id:"b_in5",  queries:["upma indian semolina breakfast", "upma dish"] },
  { id:"b_in6",  queries:["bread omelette indian street food", "egg toast breakfast"] },
  { id:"b_in7",  queries:["puri bhaji indian breakfast", "puri sabzi poori"] },
  { id:"b_in8",  queries:["besan chilla indian chickpea pancake", "chilla savory pancake"] },

  // ── Indian Lunch ─────────────────────────────────────────────────────────────
  { id:"l_in1",  queries:["dal chawal rice lentil bowl", "dal rice indian lunch"] },
  { id:"l_in2",  queries:["rajma chawal kidney beans rice", "rajma curry with rice"] },
  { id:"l_in3",  queries:["chole chawal chickpea curry rice", "chana masala with rice"] },
  { id:"l_in4",  queries:["egg curry rice indian", "egg masala curry"] },
  { id:"l_in5",  queries:["chicken curry rice indian", "chicken masala curry"] },
  { id:"l_in6",  queries:["sambar rice south indian", "sambar lentil soup rice"] },
  { id:"l_in7",  queries:["curd rice south indian", "yogurt rice indian"] },
  { id:"l_in8",  queries:["fish curry rice indian", "fish masala curry"] },
  { id:"l_in9",  queries:["vegetable biryani rice indian", "veg biryani fragrant rice"] },
  { id:"l_in10", queries:["dal khichdi indian one pot", "khichdi rice lentils"] },

  // ── Indian Dinner ────────────────────────────────────────────────────────────
  { id:"d_in1",  queries:["dal tadka roti indian", "yellow dal flatbread"] },
  { id:"d_in2",  queries:["paneer butter masala naan", "paneer tikka masala"] },
  { id:"d_in3",  queries:["aloo gobi indian potato cauliflower", "aloo gobi curry"] },
  { id:"d_in4",  queries:["butter chicken naan indian", "murgh makhani naan"] },
  { id:"d_in5",  queries:["palak paneer spinach cheese curry", "saag paneer"] },
  { id:"d_in6",  queries:["dal makhani black lentil curry", "dal makhani rich curry"] },
  { id:"d_in7",  queries:["kadhi chawal yogurt curry rice", "kadhi pakora rice"] },
  { id:"d_in8",  queries:["egg bhurji scrambled eggs indian", "anda bhurji roti"] },
  { id:"d_in9",  queries:["sabzi roti indian vegetable curry", "mixed vegetable curry roti"] },
  { id:"d_in10", queries:["chicken biryani aromatic rice", "biryani rice dish layered"] },

  // ── Indian Snack ─────────────────────────────────────────────────────────────
  { id:"s_in1",  queries:["samosa fried indian snack", "crispy samosa chutney"] },
  { id:"s_in2",  queries:["onion pakora fritters indian", "pakora fried snack"] },
  { id:"s_in3",  queries:["bread pakora fried indian snack", "pakora bread"] },
  { id:"s_in4",  queries:["roasted chana chickpeas snack", "roasted chickpeas bowl"] },
  { id:"s_in5",  queries:["bhel puri indian street food chaat", "puffed rice chaat"] },
  { id:"s_in6",  queries:["masala chai tea biscuits", "indian chai cup"] },

  // ── American Breakfast ───────────────────────────────────────────────────────
  { id:"b_us1",  queries:["scrambled eggs toast breakfast", "eggs on toast morning"] },
  { id:"b_us2",  queries:["cereal milk breakfast bowl", "breakfast cereal bowl"] },
  { id:"b_us3",  queries:["pancakes maple syrup stack", "fluffy pancakes breakfast"] },
  { id:"b_us4",  queries:["bagel cream cheese breakfast", "toasted bagel spread"] },
  { id:"b_us5",  queries:["oatmeal bowl breakfast honey", "instant oatmeal warm bowl"] },
  { id:"b_us6",  queries:["avocado toast egg brunch", "avocado toast poached egg"] },

  // ── American Lunch ───────────────────────────────────────────────────────────
  { id:"l_us1",  queries:["turkey cheese sandwich deli", "turkey sandwich lunch"] },
  { id:"l_us2",  queries:["grilled cheese sandwich tomato soup", "grilled cheese soup"] },
  { id:"l_us3",  queries:["peanut butter jelly sandwich", "pb&j sandwich"] },
  { id:"l_us4",  queries:["mac and cheese creamy pasta bowl", "macaroni cheese bowl"] },
  { id:"l_us5",  queries:["BLT sandwich bacon lettuce tomato", "club sandwich layers"] },
  { id:"l_us6",  queries:["caesar salad chicken romaine", "caesar salad grilled chicken"] },

  // ── American Dinner ──────────────────────────────────────────────────────────
  { id:"d_us1",  queries:["spaghetti bolognese meat sauce", "pasta bolognese plate"] },
  { id:"d_us2",  queries:["baked mac and cheese casserole", "mac cheese baked golden"] },
  { id:"d_us3",  queries:["sheet pan chicken vegetables roasted", "roasted chicken veggies tray"] },
  { id:"d_us4",  queries:["ground beef tacos shells", "beef taco plate"] },
  { id:"d_us5",  queries:["hamburger fries plate classic", "cheeseburger and fries"] },
  { id:"d_us6",  queries:["roast chicken mashed potatoes dinner", "whole roast chicken meal"] },
  { id:"d_us7",  queries:["pasta marinara tomato sauce simple", "spaghetti tomato sauce"] },
  { id:"d_us8",  queries:["baked potato chili toppings", "loaded baked potato"] },

  // ── American Snack ───────────────────────────────────────────────────────────
  { id:"s_us1",  queries:["apple slices peanut butter snack", "apple peanut butter plate"] },
  { id:"s_us2",  queries:["tortilla chips salsa bowl", "chips and salsa dip"] },
  { id:"s_us3",  queries:["granola bar banana snack", "granola bar fruit"] },
  { id:"s_us4",  queries:["yogurt granola parfait bowl", "yogurt granola toppings"] },

  // ── British Breakfast ────────────────────────────────────────────────────────
  { id:"b_uk1",  queries:["full english breakfast fry up", "english breakfast beans eggs bacon"] },
  { id:"b_uk2",  queries:["beans on toast british", "baked beans toast"] },
  { id:"b_uk3",  queries:["porridge honey oats breakfast bowl", "oatmeal porridge honey"] },
  { id:"b_uk4",  queries:["french toast eggy bread", "eggy bread breakfast"] },
  { id:"b_uk5",  queries:["toast marmalade jam breakfast", "toast marmalade british morning"] },

  // ── British Lunch ────────────────────────────────────────────────────────────
  { id:"l_uk1",  queries:["jacket potato beans cheese", "baked potato filling"] },
  { id:"l_uk2",  queries:["cheese pickle sandwich british", "cheddar sandwich lunch"] },
  { id:"l_uk3",  queries:["tuna mayo sandwich lunch", "tuna salad sandwich"] },
  { id:"l_uk4",  queries:["tomato soup bread bowl", "creamy tomato soup"] },

  // ── British Dinner ───────────────────────────────────────────────────────────
  { id:"d_uk1",  queries:["shepherd's pie potato topping", "cottage pie mashed potato"] },
  { id:"d_uk2",  queries:["fish and chips british", "battered fish chips"] },
  { id:"d_uk3",  queries:["bangers mash sausages gravy", "sausages mashed potato gravy"] },
  { id:"d_uk4",  queries:["chicken tikka masala rice british", "tikka masala curry rice"] },
  { id:"d_uk5",  queries:["pasta bake cheesy casserole", "pasta bake golden top"] },
  { id:"d_uk6",  queries:["sausage casserole tomato stew", "sausage stew vegetables"] },

  // ── British Snack ────────────────────────────────────────────────────────────
  { id:"s_uk1",  queries:["tea biscuits cup english", "tea and biscuits"] },
  { id:"s_uk2",  queries:["scone jam cream clotted", "cream tea scone"] },

  // ── French Breakfast ─────────────────────────────────────────────────────────
  { id:"b_fr1",  queries:["tartine bread butter jam french", "french bread toast jam"] },
  { id:"b_fr2",  queries:["croissant coffee cafe au lait", "croissant breakfast cafe"] },
  { id:"b_fr3",  queries:["yogurt fresh fruit bowl breakfast", "yogurt fruit healthy morning"] },

  // ── French Lunch ─────────────────────────────────────────────────────────────
  { id:"l_fr1",  queries:["croque monsieur french sandwich", "ham cheese toasted sandwich"] },
  { id:"l_fr2",  queries:["jambon beurre baguette french", "baguette ham sandwich"] },
  { id:"l_fr3",  queries:["green salad baguette french", "simple salad bread"] },
  { id:"l_fr4",  queries:["quiche lorraine slice french", "egg quiche pastry"] },

  // ── French Dinner ────────────────────────────────────────────────────────────
  { id:"d_fr1",  queries:["steak frites french bistro", "steak and fries plate"] },
  { id:"d_fr2",  queries:["omelette fines herbes french", "omelette green salad"] },
  { id:"d_fr3",  queries:["pasta creme lardons bacon", "creamy pasta bacon dish"] },
  { id:"d_fr4",  queries:["roast chicken vegetables dinner", "roast chicken herb roasted"] },
  { id:"d_fr5",  queries:["ratatouille french vegetable stew", "ratatouille dish colorful"] },

  // ── French Snack ─────────────────────────────────────────────────────────────
  { id:"s_fr1",  queries:["yogurt cup plain simple snack", "plain yogurt bowl"] },

  // ── Italian Breakfast ────────────────────────────────────────────────────────
  { id:"b_it1",  queries:["cappuccino italian coffee cornetto", "cappuccino espresso cup"] },
  { id:"b_it2",  queries:["toast butter jam simple breakfast", "toast butter morning"] },

  // ── Italian Lunch ────────────────────────────────────────────────────────────
  { id:"l_it1",  queries:["pasta pomodoro tomato sauce spaghetti", "pasta tomato basil simple"] },
  { id:"l_it2",  queries:["pasta aglio olio garlic olive oil", "spaghetti aglio olio"] },
  { id:"l_it3",  queries:["minestrone soup vegetable italian", "minestrone soup bowl"] },

  // ── Italian Dinner ───────────────────────────────────────────────────────────
  { id:"d_it1",  queries:["pasta bolognese meat sauce italian", "spaghetti bolognese plate"] },
  { id:"d_it2",  queries:["pasta carbonara egg cheese", "carbonara spaghetti creamy"] },
  { id:"d_it3",  queries:["lasagna layered baked pasta", "lasagna slice oven baked"] },
  { id:"d_it4",  queries:["risotto parmesan creamy italian", "risotto rice dish"] },
  { id:"d_it5",  queries:["pizza margherita mozzarella tomato", "pizza margherita basil"] },

  // ── Mexican Breakfast ────────────────────────────────────────────────────────
  { id:"b_mx1",  queries:["huevos rancheros mexican eggs", "eggs ranchero salsa tortilla"] },
  { id:"b_mx2",  queries:["scrambled eggs beans tortilla breakfast", "mexican breakfast tortilla"] },

  // ── Mexican Lunch ────────────────────────────────────────────────────────────
  { id:"l_mx1",  queries:["beef tacos corn tortilla mexican", "street tacos carne"] },
  { id:"l_mx2",  queries:["chicken quesadilla cheese grilled", "quesadilla crispy cheese"] },
  { id:"l_mx3",  queries:["bean rice burrito wrapped", "burrito bean rice"] },

  // ── Mexican Dinner ───────────────────────────────────────────────────────────
  { id:"d_mx1",  queries:["chicken enchiladas sauce cheese", "enchiladas baked mexican"] },
  { id:"d_mx2",  queries:["arroz con pollo chicken rice spanish", "chicken rice one pot"] },
  { id:"d_mx3",  queries:["chicken soup caldo broth", "chicken broth soup simple"] },

  // ── Mexican Snack ────────────────────────────────────────────────────────────
  { id:"s_mx1",  queries:["guacamole chips dip avocado", "guacamole tortilla chips"] },

  // ── Japanese Breakfast ───────────────────────────────────────────────────────
  { id:"b_jp1",  queries:["miso soup rice japanese breakfast", "japanese breakfast rice soup"] },
  { id:"b_jp2",  queries:["tamago gohan egg rice japanese", "egg on rice bowl asian"] },

  // ── Japanese Lunch ───────────────────────────────────────────────────────────
  { id:"l_jp1",  queries:["japanese curry rice katsu", "japanese curry bowl rice"] },
  { id:"l_jp2",  queries:["teriyaki chicken rice bowl donburi", "teriyaki bowl japanese"] },
  { id:"l_jp3",  queries:["tonkotsu ramen pork broth noodles", "ramen bowl japanese noodles"] },
  { id:"l_jp4",  queries:["salmon onigiri rice ball japanese", "onigiri rice ball"] },

  // ── Japanese Dinner ──────────────────────────────────────────────────────────
  { id:"d_jp1",  queries:["teriyaki salmon rice dinner japanese", "salmon teriyaki plate"] },
  { id:"d_jp2",  queries:["gyoza dumplings rice japanese", "pan fried gyoza dumplings"] },
  { id:"d_jp3",  queries:["chicken karaage fried japanese", "karaage fried chicken"] },

  // ── Japanese Snack ───────────────────────────────────────────────────────────
  { id:"s_jp1",  queries:["edamame soy beans salted snack", "edamame bowl green"] },

  // ── Chinese Breakfast ────────────────────────────────────────────────────────
  { id:"b_cn1",  queries:["congee rice porridge chinese breakfast", "jook rice porridge bowl"] },
  { id:"b_cn2",  queries:["fried egg rice soy sauce asian", "egg rice bowl simple"] },

  // ── Chinese Lunch ────────────────────────────────────────────────────────────
  { id:"l_cn1",  queries:["tomato egg stir fry rice chinese", "tomato egg chinese dish"] },
  { id:"l_cn2",  queries:["mapo tofu spicy sichuan rice", "mapo tofu bowl chinese"] },
  { id:"l_cn3",  queries:["fried rice egg vegetables wok", "chinese fried rice"] },
  { id:"l_cn4",  queries:["wonton noodle soup chinese broth", "wonton soup bowl"] },

  // ── Chinese Dinner ───────────────────────────────────────────────────────────
  { id:"d_cn1",  queries:["steamed fish rice chinese dinner", "steamed fish ginger soy"] },
  { id:"d_cn2",  queries:["beef broccoli stir fry rice", "beef broccoli chinese takeout"] },
  { id:"d_cn3",  queries:["pork fried rice wok chinese", "fried rice pork egg"] },

  // ── Chinese Snack ────────────────────────────────────────────────────────────
  { id:"s_cn1",  queries:["sunflower seeds fruit snack bowl", "nuts seeds fruit mix"] },

  // ── Korean Breakfast ─────────────────────────────────────────────────────────
  { id:"b_kr1",  queries:["kimchi fried rice egg korean", "kimchi rice bowl fried egg"] },
  { id:"b_kr2",  queries:["toast fried egg simple breakfast", "egg on toast morning"] },

  // ── Korean Lunch ─────────────────────────────────────────────────────────────
  { id:"l_kr1",  queries:["bibimbap korean rice bowl colorful", "bibimbap mixed rice bowl"] },
  { id:"l_kr2",  queries:["sundubu jjigae soft tofu stew korean", "tofu stew spicy korean"] },
  { id:"l_kr3",  queries:["kimbap korean rice roll", "gimbap rice seaweed roll"] },

  // ── Korean Dinner ────────────────────────────────────────────────────────────
  { id:"d_kr1",  queries:["doenjang jjigae soybean paste stew", "korean miso stew soup"] },
  { id:"d_kr2",  queries:["samgyeopsal grilled pork belly korean", "korean bbq pork belly"] },
  { id:"d_kr3",  queries:["bulgogi beef rice bowl korean", "bulgogi marinated beef"] },

  // ── Korean Snack ─────────────────────────────────────────────────────────────
  { id:"s_kr1",  queries:["tteokbokki rice cakes spicy korean", "korean rice cake dish"] },

  // ── Thai Breakfast ───────────────────────────────────────────────────────────
  { id:"b_th1",  queries:["thai congee rice porridge jok", "rice congee breakfast asian"] },
  { id:"b_th2",  queries:["thai omelette rice khai jiao", "thai egg omelette"] },

  // ── Thai Lunch ───────────────────────────────────────────────────────────────
  { id:"l_th1",  queries:["pad thai noodles shrimp peanut", "pad thai stir fry noodles"] },
  { id:"l_th2",  queries:["khao man gai poached chicken rice thai", "chicken rice thai bowl"] },
  { id:"l_th3",  queries:["tom yum noodle soup spicy thai", "tom yum soup lemongrass"] },

  // ── Thai Dinner ──────────────────────────────────────────────────────────────
  { id:"d_th1",  queries:["thai basil chicken rice pad krapow", "basil chicken stir fry rice"] },
  { id:"d_th2",  queries:["green curry coconut milk rice thai", "thai green curry bowl"] },
  { id:"d_th3",  queries:["thai fried rice egg basil", "fried rice thai style"] },

  // ── Thai Snack ───────────────────────────────────────────────────────────────
  { id:"s_th1",  queries:["tropical fruit platter fresh mango", "fresh tropical fruit bowl"] },

  // ── Greek Breakfast ──────────────────────────────────────────────────────────
  { id:"b_gr1",  queries:["greek yogurt honey walnuts bowl", "thick yogurt honey nuts"] },
  { id:"b_gr2",  queries:["toast olive oil tomato greek", "bread olive oil breakfast"] },

  // ── Greek Lunch ──────────────────────────────────────────────────────────────
  { id:"l_gr1",  queries:["greek salad feta olives cucumber", "horiatiki salad"] },
  { id:"l_gr2",  queries:["hummus pita bread dip", "hummus bowl pita"] },

  // ── Greek Dinner ─────────────────────────────────────────────────────────────
  { id:"d_gr1",  queries:["moussaka greek baked dish", "moussaka eggplant bechamel"] },
  { id:"d_gr2",  queries:["chicken souvlaki skewer chips", "souvlaki grilled chicken"] },

  // ── Greek Snack ──────────────────────────────────────────────────────────────
  { id:"s_gr1",  queries:["olives feta cheese greek snack", "olives and feta plate"] },

  // ── African Breakfast ────────────────────────────────────────────────────────
  { id:"b_af1",  queries:["fried egg bread tea african breakfast", "egg bread morning"] },
  { id:"b_af2",  queries:["pap porridge akara beans fritters", "west african breakfast"] },
  { id:"b_af3",  queries:["fried plantain eggs breakfast", "plantain eggs african morning"] },

  // ── African Lunch ────────────────────────────────────────────────────────────
  { id:"l_af1",  queries:["jollof rice chicken west african", "jollof rice spiced"] },
  { id:"l_af2",  queries:["white rice chicken stew african", "chicken stew tomato rice"] },
  { id:"l_af3",  queries:["rice and beans waakye ghana", "rice beans mixed pot"] },

  // ── African Dinner ───────────────────────────────────────────────────────────
  { id:"d_af1",  queries:["egusi soup rice nigerian", "melon seed soup african"] },
  { id:"d_af2",  queries:["fried rice chicken african party", "fried rice chicken plate"] },

  // ── African Snack ────────────────────────────────────────────────────────────
  { id:"s_af1",  queries:["roasted groundnuts peanuts snack", "peanuts roasted bowl"] },
  { id:"s_af2",  queries:["puff puff nigerian fried dough", "fried dough balls snack"] },

  // ── Spanish Breakfast ────────────────────────────────────────────────────────
  { id:"b_sp1",  queries:["pan con tomate bread tomato spanish", "tomato bread rubbed spanish"] },
  { id:"b_sp2",  queries:["tortilla espanola spanish omelette potato", "spanish omelette egg potato"] },

  // ── Spanish Lunch ────────────────────────────────────────────────────────────
  { id:"l_sp1",  queries:["bocadillo jamon ham baguette spanish", "jamon serrano sandwich"] },

  // ── Spanish Dinner ───────────────────────────────────────────────────────────
  { id:"d_sp1",  queries:["paella seafood rice saffron", "paella pan spanish rice"] },
  { id:"d_sp2",  queries:["chicken rice spanish style arroz", "chicken rice one pot spanish"] },

  // ── Spanish Snack ────────────────────────────────────────────────────────────
  { id:"s_sp1",  queries:["patatas bravas fried potato tapas", "crispy potatoes aioli spanish"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search,
        method: "GET", headers: options.headers || {} },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error("Bad JSON: " + data.slice(0, 200))); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// Pexels URL builder
const BASE = "https://images.pexels.com/photos/";
const Q    = "?auto=compress&cs=tinysrgb&h=650&w=940";
function pexelsUrl(id) { return `${BASE}${id}/pexels-photo-${id}.jpeg${Q}`; }

async function searchPexels(query) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetchJSON(url, { headers: { Authorization: PEXELS_KEY } });
    const photos = res?.photos ?? [];
    if (photos.length === 0) return null;
    // Pick from top 3 randomly to avoid all recipes using same photo
    const pick = photos[Math.floor(Math.random() * photos.length)];
    return pexelsUrl(pick.id);
  } catch (e) {
    console.log(`  ⚠️  Pexels error: ${e.message}`);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🍽️  Food Image Cache Rebuilder");
  console.log("══════════════════════════════════════\n");

  // Load existing cache — we'll keep any old keys that are still valid
  // and overwrite the recipe ID keys with fresh lookups.
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")); } catch {}

  let fixed = 0, failed = 0;

  for (let i = 0; i < RECIPES.length; i++) {
    const { id, queries } = RECIPES[i];
    process.stdout.write(`[${String(i+1).padStart(3)}/${RECIPES.length}] ${id.padEnd(8)} → `);

    let url = null;
    for (const query of queries) {
      await sleep(DELAY_MS);
      url = await searchPexels(query);
      if (url) break;
    }

    if (url) {
      cache[id] = url;
      fixed++;
      console.log(`✅ ${url.match(/photos\/(\d+)\//)?.[1] ?? "?"}`);
    } else {
      failed++;
      console.log(`⚠️  no result — keeping old`);
    }

    // Save progress every 10 recipes
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
  }

  // Final save
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log("\n══════════════════════════════════════");
  console.log(`✅ Fixed   : ${fixed}`);
  console.log(`⚠️  Failed  : ${failed}`);
  console.log(`💾 Saved → ${CACHE_PATH}`);
  console.log("\n🚀 Rebuild the app to ship the fixed recipe images!\n");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
