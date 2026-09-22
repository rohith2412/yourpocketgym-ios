/**
 * Bundled restaurant menu database.
 *
 * Compact array-of-tuples so we ship the smallest bundle possible — a naive
 * `{name, calories, protein, ...}` shape doubles the JSON size once minified.
 * Each item is `[name, kcal, protein_g, carbs_g, fat_g]`; `expandItem()`
 * inflates it into a real object for the UI.
 *
 * Data is drawn from publicly published nutrition menus. Values are the
 * regular (single, not combo) size unless the item name says otherwise.
 * This is a starter set — top items across the top US chains — and grows
 * by dropping new tuples into the appropriate chain block below.
 */

export type Category =
  | "burger"
  | "chicken"
  | "mexican"
  | "pizza"
  | "sub"
  | "coffee"
  | "asian"
  | "bowl"
  | "breakfast"
  | "other";

export type Restaurant = {
  slug: string;
  name: string;
  category: Category;
};

export type MenuItemRaw = [name: string, kcal: number, p: number, c: number, f: number];

export type MenuItem = {
  restaurantSlug: string;
  restaurantName: string;
  restaurantCategory: Category;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Ionicons name for a restaurant category — used everywhere the UI would
 * otherwise reach for a per-brand logo. Keeps trademark-free and lets the
 * icon inherit the current theme's stroke color naturally.
 */
export function iconForCategory(cat: Category): string {
  switch (cat) {
    case "burger": return "fast-food-outline";
    case "pizza": return "pizza-outline";
    case "coffee": return "cafe-outline";
    case "bowl": return "nutrition-outline";
    case "breakfast": return "sunny-outline";
    case "chicken":
    case "mexican":
    case "sub":
    case "asian":
    case "other":
    default:
      return "restaurant-outline";
  }
}

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------
export const RESTAURANTS: Restaurant[] = [
  { slug: "mcdonalds", name: "McDonald's", category: "burger" },
  { slug: "burger-king", name: "Burger King", category: "burger" },
  { slug: "wendys", name: "Wendy's", category: "burger" },
  { slug: "five-guys", name: "Five Guys", category: "burger" },
  { slug: "in-n-out", name: "In-N-Out", category: "burger" },
  { slug: "shake-shack", name: "Shake Shack", category: "burger" },
  { slug: "chick-fil-a", name: "Chick-fil-A", category: "chicken" },
  { slug: "popeyes", name: "Popeyes", category: "chicken" },
  { slug: "kfc", name: "KFC", category: "chicken" },
  { slug: "raising-canes", name: "Raising Cane's", category: "chicken" },
  { slug: "chipotle", name: "Chipotle", category: "mexican" },
  { slug: "taco-bell", name: "Taco Bell", category: "mexican" },
  { slug: "qdoba", name: "Qdoba", category: "mexican" },
  { slug: "moes", name: "Moe's Southwest Grill", category: "mexican" },
  { slug: "dominos", name: "Domino's", category: "pizza" },
  { slug: "pizza-hut", name: "Pizza Hut", category: "pizza" },
  { slug: "papa-johns", name: "Papa John's", category: "pizza" },
  { slug: "subway", name: "Subway", category: "sub" },
  { slug: "jimmy-johns", name: "Jimmy John's", category: "sub" },
  { slug: "jersey-mikes", name: "Jersey Mike's", category: "sub" },
  { slug: "panera", name: "Panera Bread", category: "bowl" },
  { slug: "starbucks", name: "Starbucks", category: "coffee" },
  { slug: "dunkin", name: "Dunkin'", category: "coffee" },
  { slug: "panda-express", name: "Panda Express", category: "asian" },
  { slug: "sweetgreen", name: "Sweetgreen", category: "bowl" },
  { slug: "cava", name: "Cava", category: "bowl" },
  { slug: "chopt", name: "Chopt", category: "bowl" },
  { slug: "ihop", name: "IHOP", category: "breakfast" },
  { slug: "dennys", name: "Denny's", category: "breakfast" },
  { slug: "waffle-house", name: "Waffle House", category: "breakfast" },
];

// ---------------------------------------------------------------------------
// Menu items, grouped by restaurant slug
// ---------------------------------------------------------------------------
export const MENUS: Record<string, MenuItemRaw[]> = {
  mcdonalds: [
    ["Hamburger", 250, 12, 32, 9],
    ["Cheeseburger", 300, 15, 33, 13],
    ["McDouble", 400, 22, 33, 20],
    ["Quarter Pounder w/ Cheese", 520, 30, 42, 26],
    ["Big Mac", 590, 25, 46, 34],
    ["Double Quarter Pounder", 740, 48, 43, 42],
    ["10-pc Chicken McNuggets", 410, 23, 26, 24],
    ["McChicken", 400, 14, 39, 21],
    ["Filet-O-Fish", 390, 16, 39, 19],
    ["Egg McMuffin", 310, 17, 30, 13],
    ["Sausage McMuffin w/ Egg", 480, 21, 30, 31],
    ["Small Fries", 230, 3, 29, 11],
    ["Medium Fries", 320, 4, 41, 15],
    ["Large Fries", 480, 6, 62, 23],
    ["Apple Slices", 15, 0, 4, 0],
    ["Side Salad", 15, 1, 3, 0],
  ],
  "burger-king": [
    ["Hamburger", 240, 12, 27, 10],
    ["Cheeseburger", 280, 15, 28, 13],
    ["Whopper Jr.", 310, 13, 27, 17],
    ["Whopper", 660, 28, 49, 40],
    ["Double Whopper", 900, 48, 50, 58],
    ["8-pc Chicken Nuggets", 250, 13, 15, 16],
    ["Original Chicken Sandwich", 660, 24, 52, 40],
    ["Impossible Whopper", 630, 25, 58, 34],
    ["Small Fries", 320, 3, 42, 15],
    ["Onion Rings (small)", 320, 4, 39, 17],
  ],
  wendys: [
    ["Jr. Hamburger", 240, 13, 26, 10],
    ["Jr. Cheeseburger", 290, 15, 27, 14],
    ["Dave's Single", 570, 30, 39, 34],
    ["Dave's Double", 810, 48, 40, 51],
    ["Baconator", 960, 62, 40, 62],
    ["4-pc Chicken Nuggets", 170, 9, 10, 11],
    ["Grilled Chicken Sandwich", 370, 34, 41, 8],
    ["Spicy Chicken Sandwich", 500, 27, 51, 21],
    ["Small Chili", 240, 17, 24, 8],
    ["Apple Pecan Salad", 340, 25, 28, 15],
    ["Small Fries", 320, 4, 40, 15],
    ["Baked Potato (plain)", 270, 7, 61, 0],
  ],
  "five-guys": [
    ["Little Hamburger", 480, 21, 39, 26],
    ["Little Cheeseburger", 550, 26, 40, 32],
    ["Hamburger", 700, 39, 40, 43],
    ["Cheeseburger", 840, 47, 40, 55],
    ["Bacon Cheeseburger", 920, 51, 40, 62],
    ["Little Fries", 530, 8, 72, 25],
    ["Regular Fries", 950, 15, 131, 45],
    ["Grilled Cheese", 470, 17, 41, 26],
    ["Hot Dog", 545, 18, 40, 33],
  ],
  "in-n-out": [
    ["Hamburger (Protein Style)", 240, 13, 11, 17],
    ["Hamburger", 390, 16, 39, 19],
    ["Cheeseburger", 480, 22, 39, 27],
    ["Double-Double (Protein Style)", 520, 33, 11, 39],
    ["Double-Double", 670, 37, 39, 41],
    ["French Fries", 395, 7, 54, 18],
    ["Chocolate Shake", 590, 9, 83, 25],
  ],
  "shake-shack": [
    ["Single ShackBurger", 530, 27, 38, 30],
    ["Double ShackBurger", 770, 47, 39, 47],
    ["Hamburger", 470, 25, 37, 24],
    ["'Shroom Burger", 570, 21, 51, 32],
    ["Chick'n Shack", 550, 30, 45, 27],
    ["Hot Dog", 320, 12, 30, 16],
    ["Fries", 470, 6, 55, 26],
    ["Cheese Fries", 610, 12, 57, 37],
  ],
  "chick-fil-a": [
    ["Chick-fil-A Chicken Sandwich", 420, 28, 41, 18],
    ["Spicy Chicken Sandwich", 450, 28, 43, 20],
    ["Grilled Chicken Sandwich", 390, 28, 44, 12],
    ["Deluxe Chicken Sandwich", 500, 30, 43, 24],
    ["8-ct Nuggets", 250, 27, 11, 11],
    ["8-ct Grilled Nuggets", 130, 25, 1, 3],
    ["Cool Wrap", 660, 41, 46, 32],
    ["Market Salad w/ Grilled Chicken", 340, 30, 26, 14],
    ["Cobb Salad w/ Grilled Chicken", 440, 40, 21, 22],
    ["Small Waffle Fries", 320, 3, 40, 17],
    ["Fruit Cup", 45, 1, 11, 0],
    ["Chicken Noodle Soup", 260, 24, 26, 6],
  ],
  popeyes: [
    ["Spicy Chicken Sandwich", 690, 28, 50, 42],
    ["Classic Chicken Sandwich", 700, 28, 50, 42],
    ["3-pc Handcrafted Tenders", 380, 34, 24, 17],
    ["Blackened Tenders (3-pc)", 170, 32, 4, 3],
    ["Red Beans and Rice (regular)", 230, 8, 30, 9],
    ["Cajun Fries (regular)", 310, 4, 41, 14],
    ["Coleslaw", 190, 1, 22, 11],
    ["Mashed Potatoes w/ Gravy", 120, 3, 18, 4],
  ],
  kfc: [
    ["Original Recipe Chicken Breast", 390, 39, 11, 21],
    ["Original Recipe Drumstick", 130, 12, 4, 8],
    ["Extra Crispy Breast", 530, 38, 20, 32],
    ["3-pc Extra Crispy Tenders", 280, 29, 12, 13],
    ["Kentucky Grilled Chicken Breast", 210, 38, 0, 7],
    ["Chicken Sandwich", 630, 27, 46, 38],
    ["Mashed Potatoes w/ Gravy", 130, 2, 18, 5],
    ["Coleslaw", 170, 1, 22, 9],
    ["Corn on the Cob", 70, 3, 15, 1],
    ["Green Beans", 25, 1, 5, 0],
  ],
  "raising-canes": [
    ["Chicken Fingers (3-pc)", 350, 34, 15, 17],
    ["The Box Combo", 1140, 55, 106, 55],
    ["Sandwich Combo", 1090, 47, 106, 54],
    ["Kids Combo", 800, 32, 71, 43],
    ["Cane's Sauce", 190, 1, 3, 20],
  ],
  chipotle: [
    ["Chicken Burrito Bowl (rice, beans)", 590, 40, 55, 22],
    ["Steak Burrito Bowl", 570, 38, 54, 21],
    ["Barbacoa Burrito Bowl", 590, 40, 57, 22],
    ["Carnitas Burrito Bowl", 620, 40, 54, 27],
    ["Sofritas Burrito Bowl", 500, 22, 62, 17],
    ["Chicken Salad (lettuce, no rice)", 400, 40, 15, 20],
    ["Chicken Burrito (loaded)", 1050, 55, 116, 40],
    ["3 Chicken Tacos (soft)", 610, 43, 55, 26],
    ["Guacamole (side)", 230, 2, 8, 22],
    ["Chips", 540, 7, 73, 25],
  ],
  "taco-bell": [
    ["Crunchy Taco", 170, 8, 13, 9],
    ["Soft Taco (beef)", 180, 9, 16, 9],
    ["Doritos Locos Taco", 170, 8, 13, 10],
    ["Chicken Chalupa Supreme", 340, 17, 30, 17],
    ["Beefy 5-Layer Burrito", 490, 18, 60, 18],
    ["Bean Burrito", 350, 13, 55, 9],
    ["Crunchwrap Supreme", 530, 16, 71, 21],
    ["Quesadilla (chicken)", 510, 26, 40, 28],
    ["Power Menu Bowl (chicken)", 470, 26, 50, 19],
    ["Cheesy Bean & Rice Burrito", 420, 11, 55, 17],
    ["Nachos BellGrande", 730, 18, 82, 39],
  ],
  qdoba: [
    ["Chicken Burrito Bowl", 580, 45, 60, 18],
    ["Steak Burrito Bowl", 620, 42, 61, 24],
    ["Chicken Salad (no shell)", 380, 40, 18, 16],
    ["Chicken Loaded Tortilla Soup", 480, 32, 40, 22],
    ["Chicken Quesadilla", 900, 55, 70, 45],
  ],
  moes: [
    ["Chicken Burrito Bowl", 610, 42, 55, 22],
    ["Steak Homewrecker Burrito", 1050, 52, 105, 40],
    ["Chicken Stack (2-pc)", 470, 34, 40, 18],
    ["Tofu Burrito Bowl", 560, 26, 65, 20],
  ],
  dominos: [
    ["Cheese Pizza (1 slice, medium hand-tossed)", 200, 8, 26, 7],
    ["Pepperoni Pizza (1 slice, medium)", 220, 9, 26, 9],
    ["Sausage Pizza (1 slice, medium)", 240, 10, 26, 10],
    ["Buffalo Chicken Pizza (1 slice)", 210, 10, 26, 8],
    ["Thin Crust Cheese (1 slice)", 140, 6, 14, 7],
    ["8-pc Boneless Chicken (plain)", 490, 33, 34, 25],
    ["Chicken Caesar Salad", 220, 15, 12, 12],
  ],
  "pizza-hut": [
    ["Hand-Tossed Cheese (1 slice, medium)", 220, 10, 28, 8],
    ["Hand-Tossed Pepperoni (1 slice)", 230, 11, 27, 9],
    ["Pan Pizza Cheese (1 slice)", 260, 11, 28, 11],
    ["Thin 'N Crispy Cheese (1 slice)", 180, 8, 22, 7],
    ["Personal Pan Cheese Pizza (whole)", 590, 25, 71, 24],
    ["6 Traditional Wings (naked)", 400, 44, 4, 24],
  ],
  "papa-johns": [
    ["Original Crust Cheese (1 slice, large)", 290, 12, 36, 11],
    ["Original Pepperoni (1 slice, large)", 320, 14, 36, 13],
    ["Thin Crust Cheese (1 slice, large)", 210, 10, 21, 10],
    ["Garden Fresh Pizza (1 slice, large)", 280, 12, 39, 9],
    ["Chicken Poppers (10-pc)", 340, 34, 16, 14],
  ],
  subway: [
    ["6\" Turkey Breast Sub", 280, 18, 45, 3],
    ["6\" Oven Roasted Chicken", 320, 24, 47, 5],
    ["6\" Rotisserie Chicken", 340, 29, 43, 7],
    ["6\" Veggie Delite", 210, 8, 41, 2],
    ["6\" Roast Beef", 320, 24, 45, 5],
    ["6\" Meatball Marinara", 480, 20, 60, 18],
    ["6\" Tuna", 470, 20, 44, 25],
    ["6\" Italian B.M.T.", 410, 20, 46, 16],
    ["6\" Steak & Cheese", 380, 24, 45, 10],
    ["Chopped Turkey Breast Salad", 110, 15, 12, 2],
    ["Chopped Rotisserie Chicken Salad", 170, 26, 10, 4],
  ],
  "jimmy-johns": [
    ["Turkey Tom (8\")", 510, 22, 51, 22],
    ["Vito (8\")", 590, 25, 51, 28],
    ["Beach Club (8\")", 720, 27, 52, 42],
    ["Vegetarian (8\")", 610, 19, 55, 34],
    ["Slim 1 Ham & Cheese", 490, 22, 51, 20],
    ["Unwich Turkey Tom (no bread)", 200, 13, 8, 12],
  ],
  "jersey-mikes": [
    ["Turkey Sub (regular)", 490, 28, 65, 12],
    ["The Original Italian (regular)", 810, 34, 65, 46],
    ["Roast Beef & Provolone (regular)", 540, 34, 65, 15],
    ["Club Supreme (regular)", 900, 41, 66, 52],
    ["Portabella Cheese Steak (regular)", 570, 25, 68, 20],
  ],
  panera: [
    ["Green Goddess Cobb Salad w/ Chicken", 530, 40, 22, 32],
    ["Fuji Apple Salad w/ Chicken", 550, 30, 45, 30],
    ["Broccoli Cheddar Soup (cup)", 240, 8, 22, 14],
    ["Ten Vegetable Soup (cup)", 100, 4, 18, 2],
    ["Bacon Turkey Bravo (whole)", 780, 46, 82, 30],
    ["Mediterranean Veggie Sandwich", 540, 20, 88, 12],
    ["Chipotle Chicken Avocado Melt", 780, 48, 76, 34],
    ["Kitchen Sink Cookie", 830, 10, 105, 42],
    ["Cinnamon Crunch Bagel", 420, 10, 78, 8],
  ],
  starbucks: [
    ["Grande Caffè Latte (2% milk)", 190, 12, 19, 7],
    ["Grande Cappuccino (2% milk)", 140, 8, 12, 5],
    ["Grande Caffè Americano", 15, 1, 3, 0],
    ["Grande Iced Coffee (unsweetened)", 5, 0, 0, 0],
    ["Grande Cold Brew (unsweetened)", 5, 0, 0, 0],
    ["Grande Vanilla Latte", 250, 12, 35, 6],
    ["Grande Caramel Macchiato", 250, 10, 35, 7],
    ["Grande Mocha Frappuccino", 370, 6, 55, 15],
    ["Grande Pumpkin Spice Latte", 390, 14, 52, 14],
    ["Grande Matcha Latte", 240, 12, 32, 7],
    ["Egg Bites: Bacon & Gruyère", 300, 19, 9, 20],
    ["Egg Bites: Egg White & Red Pepper", 170, 13, 11, 7],
    ["Spinach, Feta & Egg White Wrap", 290, 20, 34, 8],
    ["Bacon, Gouda & Egg Sandwich", 360, 18, 33, 18],
    ["Impossible Breakfast Sandwich", 420, 22, 33, 22],
    ["Blueberry Scone", 460, 7, 68, 18],
  ],
  dunkin: [
    ["Medium Original Blend Coffee", 5, 0, 0, 0],
    ["Medium Latte", 120, 8, 13, 5],
    ["Medium Cappuccino", 80, 6, 8, 3],
    ["Medium Caramel Iced Coffee", 200, 3, 41, 3],
    ["Glazed Donut", 240, 3, 33, 11],
    ["Chocolate Frosted Donut", 260, 3, 32, 14],
    ["Boston Kreme Donut", 300, 3, 40, 15],
    ["Bacon, Egg & Cheese on English Muffin", 470, 18, 34, 27],
    ["Sourdough Breakfast Sandwich", 620, 24, 55, 33],
    ["Wake-Up Wrap (bacon)", 220, 8, 16, 13],
  ],
  "panda-express": [
    ["Orange Chicken (1 serving)", 490, 25, 51, 23],
    ["Kung Pao Chicken", 290, 16, 14, 19],
    ["Broccoli Beef", 150, 9, 13, 7],
    ["Beijing Beef", 470, 14, 46, 26],
    ["String Bean Chicken Breast", 190, 14, 13, 9],
    ["Honey Walnut Shrimp", 360, 13, 27, 23],
    ["Grilled Teriyaki Chicken", 300, 36, 8, 13],
    ["Steamed White Rice", 380, 7, 87, 0],
    ["Fried Rice", 520, 11, 85, 16],
    ["Chow Mein", 510, 13, 80, 20],
    ["Super Greens", 90, 6, 11, 3],
  ],
  sweetgreen: [
    ["Harvest Bowl", 705, 27, 87, 30],
    ["Kale Caesar w/ Chicken", 550, 40, 33, 32],
    ["Chicken Pesto Parm", 645, 40, 55, 30],
    ["Guacamole Greens w/ Chicken", 570, 33, 45, 30],
    ["Fish Taco Bowl", 545, 25, 52, 27],
    ["Shroomami", 490, 15, 72, 18],
    ["Sesame Miso Bowl", 500, 20, 62, 21],
  ],
  cava: [
    ["Chicken Bowl (greens, rice, hummus)", 620, 42, 55, 28],
    ["Falafel Bowl (greens, rice, hummus)", 640, 21, 78, 30],
    ["Grilled Steak Bowl", 700, 45, 55, 32],
    ["Braised Lamb Bowl", 720, 42, 55, 36],
    ["Harissa Chicken Pita", 580, 32, 55, 25],
    ["Greens & Grains (no protein)", 380, 12, 55, 12],
  ],
  chopt: [
    ["Kale Caesar w/ Chicken", 610, 36, 30, 40],
    ["Mexican Caesar w/ Chicken", 690, 32, 45, 42],
    ["Santa Fe w/ Chicken", 720, 38, 55, 40],
    ["Palm Beach w/ Chicken", 590, 34, 40, 34],
    ["Steakhouse w/ Steak", 810, 40, 45, 55],
  ],
  ihop: [
    ["Original Buttermilk Pancakes (2-stack)", 340, 8, 62, 10],
    ["Original Buttermilk Pancakes (5-stack)", 750, 17, 132, 18],
    ["Belgian Waffle", 590, 12, 66, 30],
    ["2 Egg Breakfast (bacon, hash browns, toast)", 690, 24, 46, 43],
    ["Country Fried Steak & Eggs", 1160, 39, 74, 78],
    ["Chicken & Waffles", 1220, 43, 138, 55],
    ["Simple & Fit Veggie Omelette", 350, 26, 25, 16],
    ["Simple & Fit Two-Egg Breakfast", 340, 22, 40, 10],
  ],
  dennys: [
    ["Original Grand Slam", 800, 27, 78, 42],
    ["All-American Slam", 900, 42, 42, 63],
    ["Moons Over My Hammy", 800, 38, 66, 42],
    ["Fit Slam (egg whites, turkey bacon)", 460, 30, 55, 12],
    ["Country-Fried Steak & Eggs", 1080, 40, 66, 71],
    ["Buttermilk Pancakes (3)", 480, 10, 82, 12],
  ],
  "waffle-house": [
    ["Original Waffle", 410, 8, 55, 18],
    ["Pecan Waffle", 600, 12, 60, 35],
    ["All-Star Special", 830, 30, 80, 42],
    ["2 Eggs & Grits", 340, 15, 22, 22],
    ["Hashbrowns (regular)", 350, 4, 40, 20],
    ["Bacon (3 strips)", 130, 10, 0, 10],
    ["Sausage Patty", 260, 10, 1, 24],
  ],
};

// ---------------------------------------------------------------------------
// Expand + search helpers
// ---------------------------------------------------------------------------

let cachedAll: MenuItem[] | null = null;

/**
 * Flatten every tuple in `MENUS` into a searchable list of `MenuItem` objects.
 * The result is cached — the JSON never changes at runtime, so we only pay the
 * expansion cost once and every subsequent search hits an in-memory array.
 */
export function allItems(): MenuItem[] {
  if (cachedAll) return cachedAll;
  const out: MenuItem[] = [];
  for (const r of RESTAURANTS) {
    const menu = MENUS[r.slug];
    if (!menu) continue;
    for (const t of menu) {
      out.push({
        restaurantSlug: r.slug,
        restaurantName: r.name,
        restaurantCategory: r.category,
        name: t[0],
        calories: t[1],
        protein: t[2],
        carbs: t[3],
        fat: t[4],
      });
    }
  }
  cachedAll = out;
  return out;
}

export function itemsForRestaurant(slug: string): MenuItem[] {
  return allItems().filter((i) => i.restaurantSlug === slug);
}

/**
 * Case-insensitive substring search across restaurant name + item name.
 * Returns items only (grouping in the UI is easier when the results are flat).
 */
export function searchItems(query: string): MenuItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allItems().filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.restaurantName.toLowerCase().includes(q),
  );
}

/** Substring match on restaurant name only. */
export function searchRestaurants(query: string): Restaurant[] {
  const q = query.trim().toLowerCase();
  if (!q) return RESTAURANTS;
  return RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q));
}
