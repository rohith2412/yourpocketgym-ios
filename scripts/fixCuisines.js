/**
 * Reclassifies cuisine fields in mealPlanRecipes.ts to specific values.
 * Run:  node scripts/fixCuisines.js
 */

const fs   = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../src/data/mealPlanRecipes.ts");
let src = fs.readFileSync(FILE, "utf8");

// Rules checked in ORDER — first match wins.
// Name-based rules go FIRST (most specific), ingredient/generic rules go LAST.
const RULES = [
  // ── Nationality in name (highest priority) ────────────────────────────────
  { re: /\b(Indian|Masala Omelette|Indian Dal|Indian Butter|Indian Chole|Indian Dal Makhani|Indian Rogan|Indian Samosa|Indian Chana|Indian Dahi)\b/, cuisine: "indian" },
  { re: /\bThai\b/,        cuisine: "thai" },
  { re: /\bJapanese\b/,   cuisine: "japanese" },
  { re: /\bChinese\b/,    cuisine: "chinese" },
  { re: /\bKorean\b/,     cuisine: "korean" },
  { re: /\bVietnamese\b/, cuisine: "vietnamese" },
  { re: /\bFilipino\b/,   cuisine: "filipino" },
  { re: /\bIndonesian\b/, cuisine: "indonesian" },
  { re: /\bMalaysian\b/,  cuisine: "malaysian" },
  { re: /\bMexican\b/,    cuisine: "mexican" },
  { re: /\bGreek\b/,      cuisine: "greek" },
  { re: /\bItalian\b/,    cuisine: "italian" },
  { re: /\bFrench\b/,     cuisine: "french" },
  { re: /\bSpanish\b/,    cuisine: "spanish" },
  { re: /\bTurkish\b/,    cuisine: "middle-eastern" },
  { re: /\bLebanese\b/,   cuisine: "middle-eastern" },
  { re: /\bIraeli|Israeli\b/, cuisine: "middle-eastern" },
  { re: /\bIranian|Persian\b/, cuisine: "middle-eastern" },
  { re: /\bMoroccan\b/,   cuisine: "african" },
  { re: /\bNigerian\b/,   cuisine: "african" },
  { re: /\bEthiopian\b/,  cuisine: "african" },
  { re: /\bGhanaian\b/,   cuisine: "african" },
  { re: /\bSenegalese\b/, cuisine: "african" },
  { re: /\bKenyan\b/,     cuisine: "african" },
  { re: /\bSouth African\b/, cuisine: "african" },
  { re: /\bTanzanian\b/,  cuisine: "african" },
  { re: /\bUgandan\b/,    cuisine: "african" },
  { re: /\bRwandan\b/,    cuisine: "african" },
  { re: /\bZimbabwean\b/, cuisine: "african" },
  { re: /\bCongolese\b/,  cuisine: "african" },
  { re: /\bEgyptian\b/,   cuisine: "african" },
  { re: /\bAlgerian\b/,   cuisine: "african" },
  { re: /\bTunisian\b/,   cuisine: "african" },
  { re: /\bLibyan\b/,     cuisine: "african" },
  { re: /\bSomali\b/,     cuisine: "african" },
  { re: /\bEritrean\b/,   cuisine: "african" },
  { re: /\bPeruvian\b/,   cuisine: "latin" },
  { re: /\bBrazilian\b/,  cuisine: "latin" },
  { re: /\bArgentinian|Argentine\b/, cuisine: "latin" },
  { re: /\bColombian\b/,  cuisine: "latin" },
  { re: /\bVenezuelan\b/, cuisine: "latin" },
  { re: /\bChilean\b/,    cuisine: "latin" },
  { re: /\bBolivian\b/,   cuisine: "latin" },
  { re: /\bGuatemalan\b/, cuisine: "latin" },
  { re: /\bHonduran\b/,   cuisine: "latin" },
  { re: /\bParaguayan\b/, cuisine: "latin" },
  { re: /\bEcuadorian\b/, cuisine: "latin" },
  { re: /\bJamaican\b/,   cuisine: "caribbean" },
  { re: /\bTrinidadian\b/, cuisine: "caribbean" },
  { re: /\bBarbadian\b/,  cuisine: "caribbean" },
  { re: /\bHaitian\b/,    cuisine: "caribbean" },
  { re: /\bDominican\b/,  cuisine: "caribbean" },
  { re: /\bCuban\b/,      cuisine: "caribbean" },
  { re: /\bPuerto Rican\b/, cuisine: "caribbean" },
  { re: /\bHawaiian\b/,   cuisine: "american" },
  { re: /\bAustralian\b/, cuisine: "european" },
  { re: /\bGerman\b/,     cuisine: "european" },
  { re: /\bPolish\b/,     cuisine: "european" },
  { re: /\bCzech\b/,      cuisine: "european" },
  { re: /\bUkrainian\b/,  cuisine: "european" },
  { re: /\bHungarian\b/,  cuisine: "european" },
  { re: /\bRomanian\b/,   cuisine: "european" },
  { re: /\bSwedish|Swedish\b/, cuisine: "european" },
  { re: /\bNorwegian\b/,  cuisine: "european" },
  { re: /\bDanish\b/,     cuisine: "european" },
  { re: /\bDutch\b/,      cuisine: "european" },
  { re: /\bBelgian\b/,    cuisine: "european" },
  { re: /\bSwiss\b/,      cuisine: "european" },
  { re: /\bAustrian\b/,   cuisine: "european" },
  { re: /\bPortuguese\b/, cuisine: "european" },
  { re: /\bBosnian\b/,    cuisine: "european" },
  { re: /\bCroatian\b/,   cuisine: "european" },
  { re: /\bSerbian\b/,    cuisine: "european" },
  { re: /\bAlbanian\b/,   cuisine: "european" },
  { re: /\bLithuanian\b/, cuisine: "european" },
  { re: /\bLatvian\b/,    cuisine: "european" },
  { re: /\bMacedonian\b/, cuisine: "european" },
  { re: /\bRussian\b/,    cuisine: "european" },
  { re: /\bMoldovan\b/,   cuisine: "european" },
  { re: /\bIcelandic\b/,  cuisine: "european" },
  { re: /\bScottish|Irish|British|English\b/, cuisine: "european" },
  { re: /\bCambodian\b/,  cuisine: "asian" },
  { re: /\bBurmese\b/,    cuisine: "asian" },
  { re: /\bSri Lankan\b/, cuisine: "asian" },
  { re: /\bNepalese|Nepali\b/, cuisine: "asian" },
  { re: /\bPakistani\b/,  cuisine: "asian" },
  { re: /\bBangladeshi\b/, cuisine: "asian" },
  { re: /\bTaiwanese\b/,  cuisine: "asian" },
  { re: /\bSingaporean\b/, cuisine: "asian" },
  { re: /\bUzbek|Uzbek\b/, cuisine: "asian" },
  { re: /\bKazakh\b/,     cuisine: "asian" },
  { re: /\bMongolian\b/,  cuisine: "asian" },
  { re: /\bTibetan\b/,    cuisine: "asian" },
  { re: /\bGeorgian\b/,   cuisine: "asian" },
  { re: /\bAzerbaijani\b/, cuisine: "asian" },
  { re: /\bArmenian\b/,   cuisine: "asian" },
  { re: /\bAfghani|Afghan\b/, cuisine: "asian" },
  { re: /\bLaotian|Laos\b/, cuisine: "asian" },
  { re: /\bJordanian\b/,  cuisine: "middle-eastern" },
  { re: /\bYemeni\b/,     cuisine: "middle-eastern" },
  { re: /\bSaudi\b/,      cuisine: "middle-eastern" },
  { re: /\bCypriot\b/,    cuisine: "middle-eastern" },

  // ── Dish-name patterns (no nationality prefix) ────────────────────────────
  { re: /\b(Shakshuka|Hummus|Falafel|Shawarma|Kibbeh|Lahmacun|Kofta|Börek|Manakish|Fattoush|Tabbouleh|Mansaf|Pita)\b/, cuisine: "middle-eastern" },
  { re: /\b(Sushi|Ramen|Udon|Soba|Tempura|Miso|Teriyaki|Tonkatsu|Katsu|Onigiri|Bento|Donburi|Tamagoyaki|Gyoza|Edamame|Matcha|Natto|Shabu|Sukiyaki)\b/, cuisine: "japanese" },
  { re: /\b(Dim Sum|Wonton|Mapo Tofu|Kung Pao|Peking Duck|Chow Mein|Spring Roll|Sesame Ball|Scallion Pancake|Congee)\b/, cuisine: "chinese" },
  { re: /\b(Pad Thai|Tom Yum|Som Tam|Papaya Salad|Massaman|Larb|Khao|Laab|Jungle Curry)\b/, cuisine: "thai" },
  { re: /\b(Bibimbap|Kimchi|Bulgogi|Galbi|Tteok|Gimbap|Jajangmyeon|Hotteok|Jjigae)\b/, cuisine: "korean" },
  { re: /\b(Pho|Banh Mi|Bun Bo|Bun Rieu|Bun Thit|Chả Giò|Xôi|Lemongrass Chicken)\b/, cuisine: "vietnamese" },
  { re: /\b(Adobo|Sinigang|Kare-Kare|Lechon|Champorado|Pancit|Lumpia)\b/, cuisine: "filipino" },
  { re: /\b(Nasi Goreng|Gado-Gado|Bubur Ayam|Rendang|Pisang Goreng|Martabak)\b/, cuisine: "indonesian" },
  { re: /\b(Nasi Lemak|Laksa|Roti Canai|Kuih)\b/, cuisine: "malaysian" },
  { re: /\b(Dal|Biryani|Naan|Samosa|Chana|Paneer|Tikka|Korma|Vindaloo|Saag|Bhatura|Chole|Dosa|Idli|Uttapam|Paratha|Kheer|Lassi|Masala|Rogan Josh|Dal Makhani|Dal Bhat|Nihari|Karahi|Gosht|Pakora|Raita|Chutney|Mango Lassi|Chana Chaat|Dahi Puri|Sel Roti|String Hoppers)\b/, cuisine: "indian" },
  { re: /\b(Paella|Gazpacho|Patatas Bravas|Pisto|Churros|Pintxos?|Pinchos?)\b/, cuisine: "spanish" },
  { re: /\b(Moussaka|Spanakopita|Souvlaki|Kleftiko|Loukoumades|Tiropita|Gyros?)\b/, cuisine: "greek" },
  { re: /\b(Risotto|Carbonara|Osso Buco|Ribollita|Bruschetta|Caprese|Gnocchi|Pesto|Focaccia)\b/, cuisine: "italian" },
  { re: /\b(Coq au Vin|Niçoise|Croque|Bouillabaisse|Crêpes?|Gougères?)\b/, cuisine: "french" },
  { re: /\b(Jollof|Injera|Tagine|Bobotie|Sadza|Egusi|Akara|Suya|Mandazi|Vetkoek|Harira|Ful Medames|Kushary|Koshari|Thiébou|Biltong|Nyama Choma|Katogo|Ugali|Nshima|Groundnut Stew|Peanut Stew|Mafé)\b/, cuisine: "african" },
  { re: /\b(Ceviche|Lomo Saltado|Churrasco|Asado|Pabellón|Bandeja|Gallo Pinto|Baleada|Chipa|Salteña|Anticuchos|Brigadeiro|Pão de Queijo|Empanada|Arepa)\b/, cuisine: "latin" },
  { re: /\b(Jerk|Doubles|Cou-Cou|Griot|La Bandera|Pernil|Callaloo)\b/, cuisine: "caribbean" },
  { re: /\b(Tacos?|Burrito|Enchiladas?|Quesadilla|Guacamole|Chilaquiles|Huevos Rancheros|Mole|Elote|Birria|Tlayuda)\b/, cuisine: "mexican" },
  { re: /\b(Poutine|Jambalaya|Clam Chowder|Lobster Roll|Buffalo|BBQ|Brisket|Po'?Boy|Deep Dish|Grits|Shrimp .* Grits)\b/, cuisine: "american" },
  { re: /\b(Plov|Beshbarmak|Tsuivan|Qurutob)\b/, cuisine: "asian" },
];

let changed = 0, unchanged = 0;

// Match the recipe name + full block together
src = src.replace(
  /(\{\s*id:\s*"[^"]*",\s*name:\s*"([^"]*)")([\s\S]*?)(cuisine:\s*)"([^"]*)"([\s\S]*?\})/g,
  (match, idName, recipeName, middle, cuisineKey, oldCuisine, rest) => {
    // Test rules against the recipe NAME first, then full block
    for (const rule of RULES) {
      if (rule.re.test(recipeName) || rule.re.test(match)) {
        if (rule.cuisine !== oldCuisine) {
          changed++;
          return `${idName}${middle}${cuisineKey}"${rule.cuisine}"${rest}`;
        }
        unchanged++;
        return match;
      }
    }
    unchanged++;
    return match;
  }
);

fs.writeFileSync(FILE, src, "utf8");
console.log(`✅ Done! ${changed} changed, ${unchanged} unchanged.`);

const cuisines = [...src.matchAll(/\bcuisine:\s*"([^"]+)"/g)].map(m => m[1]);
const counts = {};
cuisines.forEach(c => counts[c] = (counts[c] ?? 0) + 1);
console.log("\nCuisine distribution:");
Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));
