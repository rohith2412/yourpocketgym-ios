import React from "react";
import { Text, View } from "react-native";

// keyword → emoji. Most-specific first, broad catch-alls last.
const FOOD_MAP = [
  // ── Protein / supplements
  { keys: ["protein shake","whey shake","mass gainer","weight gainer","meal replacement","casein"], emoji: "🥤" },
  { keys: ["shake","milkshake","smoothie","blend"],                                                  emoji: "🥤" },
  { keys: ["protein bar","granola bar","energy bar","quest bar","rx bar","kind bar","cliff bar"],    emoji: "🍫" },

  // ── Pizza
  { keys: ["pizza","pepperoni","margherita","calzone"],                                              emoji: "🍕" },

  // ── Burgers
  { keys: ["burger","hamburger","cheeseburger","smash burger","veggie burger"],                      emoji: "🍔" },

  // ── Sushi
  { keys: ["sushi roll","california roll","maki","temaki","hand roll"],                              emoji: "🌯" },
  { keys: ["sushi","nigiri","sashimi","onigiri"],                                                    emoji: "🍣" },

  // ── Tacos / Mexican
  { keys: ["taco","burrito","quesadilla","fajita","enchilada","nachos","chimichanga"],               emoji: "🌮" },

  // ── Hot dog
  { keys: ["hotdog","hot dog","sausage","bratwurst","chorizo","frankfurter","corn dog"],             emoji: "🌭" },

  // ── Noodles
  { keys: ["noodle","noodles","udon","soba","pad thai","lo mein","chow mein","vermicelli","rice noodle","glass noodle","yakisoba","japchae","laksa","instant noodle","cup noodle","maggi","indomie","egg noodle"], emoji: "🍜" },
  { keys: ["ramen","pho","tonkotsu","miso ramen"],                                                   emoji: "🍜" },

  // ── Pasta
  { keys: ["spaghetti","bolognese","carbonara","lasagna","lasagne","marinara"],                      emoji: "🍝" },
  { keys: ["pasta","penne","fettuccine","linguine","rigatoni","gnocchi","macaroni","mac and cheese","mac & cheese","mac n cheese","orzo","tagliatelle","farfalle","tortellini","ravioli"], emoji: "🍝" },

  // ── Rice
  { keys: ["rice","fried rice","white rice","brown rice","basmati","jasmine rice","risotto","congee","rice bowl","pilaf","paella","biryani","donburi","bibimbap","rice cake"], emoji: "🍚" },

  // ── Oats / cereal
  { keys: ["oatmeal","overnight oats","oat","porridge","granola","muesli","cereal","grits","quinoa","couscous"], emoji: "🥣" },

  // ── Sandwich / wrap
  { keys: ["sandwich","sub","panini","hoagie","gyro","club sandwich","blt","grilled cheese","banh mi"], emoji: "🥪" },
  { keys: ["wrap","pita wrap","lettuce wrap","tortilla wrap"],                                        emoji: "🌯" },

  // ── Bread / bakery
  { keys: ["croissant","pain au chocolat"],                                                          emoji: "🥐" },
  { keys: ["pancake","crepe","crêpe","flapjack","blini"],                                            emoji: "🥞" },
  { keys: ["waffle","belgian waffle"],                                                               emoji: "🧇" },
  { keys: ["bread","toast","bagel","baguette","brioche","sourdough","pita","naan","roti","chapati","focaccia","english muffin","pretzel","tortilla","cornbread"], emoji: "🍞" },

  // ── Eggs
  { keys: ["fried egg","scrambled egg","poached egg","boiled egg","omelette","omelet","egg white","frittata","quiche","eggs benedict","shakshuka"], emoji: "🍳" },
  { keys: ["egg"],                                                                                    emoji: "🥚" },

  // ── Fried chicken / poultry
  { keys: ["fried chicken","chicken nugget","nugget","chicken wing","wing","chicken strip","chicken tender","popcorn chicken","kfc"], emoji: "🍗" },
  { keys: ["chicken","turkey","duck","grilled chicken","roast chicken","rotisserie","poultry"],      emoji: "🍗" },

  // ── Steak / red meat
  { keys: ["steak","ribeye","sirloin","t-bone","tenderloin","filet","wagyu","beef steak"],           emoji: "🥩" },
  { keys: ["beef","ground beef","mince","brisket","ribs","pork","pork chop","pork belly","pulled pork","bacon","ham","lamb","lamb chop","veal","venison","meatball","meatloaf","salami","pepperoni","meat"], emoji: "🥩" },

  // ── Seafood
  { keys: ["shrimp","prawn","lobster","crab","scallop","squid","calamari","oyster","clam","mussel"], emoji: "🦐" },
  { keys: ["salmon"],                                                                                 emoji: "🍣" },
  { keys: ["fish","tuna","cod","tilapia","halibut","sea bass","trout","sardine","anchovy","mackerel","snapper","fish fillet","fish cake","fish finger"], emoji: "🐟" },

  // ── Soup / stew / curry
  { keys: ["soup","stew","broth","chowder","bisque","minestrone","tom yum","miso soup","bone broth","chili","lentil soup","vegetable soup","chicken soup","gumbo"], emoji: "🍲" },
  { keys: ["curry","tikka masala","butter chicken","korma","vindaloo","saag","thai curry"],          emoji: "🍛" },

  // ── Salad / bowls
  { keys: ["salad","caesar","coleslaw","greek salad","tabbouleh","buddha bowl","grain bowl","poke bowl","acai bowl","açaí bowl"], emoji: "🥗" },

  // ── Fries / potato
  { keys: ["french fries","fries","chips","wedges","hash brown","tater tot","sweet potato fries"],   emoji: "🍟" },
  { keys: ["potato","baked potato","mashed potato","sweet potato","yam"],                            emoji: "🥔" },

  // ── Vegetables (specific)
  { keys: ["broccoli","cauliflower","brussels sprout"],                                              emoji: "🥦" },
  { keys: ["carrot"],                                                                                 emoji: "🥕" },
  { keys: ["corn","maize"],                                                                           emoji: "🌽" },
  { keys: ["tomato","cherry tomato"],                                                                 emoji: "🍅" },
  { keys: ["eggplant","aubergine"],                                                                   emoji: "🍆" },
  { keys: ["mushroom","shiitake","portobello"],                                                       emoji: "🍄" },
  { keys: ["avocado","guacamole"],                                                                    emoji: "🥑" },
  { keys: ["cucumber","zucchini","courgette"],                                                        emoji: "🥒" },
  { keys: ["pepper","bell pepper","capsicum"],                                                        emoji: "🫑" },
  { keys: ["leafy","spinach","kale","arugula","lettuce","mixed greens"],                              emoji: "🥬" },
  { keys: ["onion","garlic"],                                                                         emoji: "🧅" },
  { keys: ["vegetable","veggie","veg"],                                                               emoji: "🥦" },

  // ── Dairy / cheese
  { keys: ["cheese","cheddar","mozzarella","parmesan","brie","gouda","feta","ricotta","cream cheese","cottage cheese"], emoji: "🧀" },
  { keys: ["yogurt","yoghurt","greek yogurt","skyr","kefir"],                                        emoji: "🥛" },
  { keys: ["butter","cream","milk","almond milk","oat milk","soy milk","dairy"],                     emoji: "🥛" },

  // ── Coffee
  { keys: ["coffee","latte","espresso","cappuccino","americano","macchiato","cold brew","flat white","mocha","frappuccino","affogato"], emoji: "☕" },

  // ── Tea
  { keys: ["matcha","boba","bubble tea","chai","green tea","black tea","herbal tea","oolong","kombucha","tea"], emoji: "🍵" },

  // ── Drinks
  { keys: ["juice","lemonade","limeade","fruit punch","vitamin water"],                              emoji: "🧃" },
  { keys: ["soda","cola","pepsi","coke","sprite","fanta","energy drink","red bull","monster","sparkling water","gatorade","sports drink"], emoji: "🥤" },
  { keys: ["water","coconut water","mineral water","electrolyte"],                                    emoji: "💧" },
  { keys: ["beer","lager","ale","stout","craft beer"],                                               emoji: "🍺" },
  { keys: ["wine","champagne","prosecco","rosé","sake"],                                             emoji: "🍷" },
  { keys: ["cocktail","margarita","mojito","whiskey","vodka","gin","rum","spirit","alcohol","drink"], emoji: "🍹" },

  // ── Sweets / desserts
  { keys: ["donut","doughnut"],                                                                       emoji: "🍩" },
  { keys: ["ice cream","icecream","gelato","sorbet","soft serve","frozen yogurt","popsicle"],        emoji: "🍦" },
  { keys: ["cake","cupcake","cheesecake","brownie","tiramisu","lava cake","tres leches"],            emoji: "🎂" },
  { keys: ["cookie","biscuit","oreo","macaron","gingerbread","shortbread"],                          emoji: "🍪" },
  { keys: ["chocolate","nutella","cacao","cocoa","truffle","fudge","candy","m&m","snickers","twix","reese","caramel","toffee"], emoji: "🍫" },
  { keys: ["popcorn"],                                                                                emoji: "🍿" },
  { keys: ["mochi","daifuku","wagashi","dorayaki","taiyaki"],                                        emoji: "🍡" },
  { keys: ["honey","jam","jelly","syrup","spread"],                                                  emoji: "🍯" },

  // ── Nuts / seeds
  { keys: ["peanut butter","almond butter","nut butter","tahini"],                                   emoji: "🥜" },
  { keys: ["nut","nuts","almond","cashew","walnut","pistachio","pecan","hazelnut","peanut","trail mix"], emoji: "🥜" },

  // ── Beans / legumes / tofu
  { keys: ["bean","lentil","chickpea","hummus","black bean","kidney bean","tofu","tempeh","falafel","edamame"], emoji: "🫘" },

  // ── Fruits (specific)
  { keys: ["apple"],                                                                                  emoji: "🍎" },
  { keys: ["banana","plantain"],                                                                      emoji: "🍌" },
  { keys: ["orange","mandarin","clementine","tangerine"],                                            emoji: "🍊" },
  { keys: ["watermelon"],                                                                             emoji: "🍉" },
  { keys: ["melon","cantaloupe","honeydew"],                                                          emoji: "🍈" },
  { keys: ["strawberry"],                                                                             emoji: "🍓" },
  { keys: ["blueberry","blackberry","raspberry","berry","cranberry","acai","açaí"],                  emoji: "🫐" },
  { keys: ["grape","raisin"],                                                                         emoji: "🍇" },
  { keys: ["lemon","lime"],                                                                           emoji: "🍋" },
  { keys: ["pineapple"],                                                                              emoji: "🍍" },
  { keys: ["mango","papaya","guava","dragonfruit","lychee","passion fruit","kiwi","persimmon","pomegranate","fig"], emoji: "🥭" },
  { keys: ["cherry"],                                                                                 emoji: "🍒" },
  { keys: ["peach","nectarine","apricot","plum"],                                                    emoji: "🍑" },
  { keys: ["pear"],                                                                                   emoji: "🍐" },
  { keys: ["fruit","mixed fruit","dried fruit","fruit salad"],                                       emoji: "🍓" },

  // ── Snacks
  { keys: ["cracker","rice cracker","rice cake","pita chip","pretzel snack","veggie straw","cheese puff","cheeto","dorito"], emoji: "🍘" },
];

function pickEmoji(foodNames = []) {
  const combined = foodNames.join(" ").toLowerCase().trim();
  if (!combined) return "🍽️";

  for (const { keys, emoji } of FOOD_MAP) {
    if (keys.some((k) => combined.includes(k))) return emoji;
  }

  // broad fallbacks
  if (/(meat|grill|roast|bbq|bake|smoked)/.test(combined))       return "🥩";
  if (/(fish|sea|ocean|prawn|seafood)/.test(combined))            return "🐟";
  if (/(veg|green|leaf|plant|salad|herb)/.test(combined))         return "🥗";
  if (/(sweet|dessert|sugar|candy|treat)/.test(combined))         return "🍬";
  if (/(drink|beverage|liquid|cup|glass|bottle)/.test(combined))  return "🥤";
  if (/(grain|wheat|flour|dough|bread|carb)/.test(combined))      return "🍞";
  if (/(soup|stew|broth|bowl|warm)/.test(combined))               return "🍲";
  if (/(rice|grain|base)/.test(combined))                          return "🍚";

  return "🍽️"; // truly unknown
}

/**
 * FoodImage — renders a system emoji based on food name(s).
 * @param {string[]} foodNames
 * @param {number}   size   font size (also controls container)
 */
export default function FoodImage({ foodNames = [], size = 44 }) {
  const emoji = pickEmoji(foodNames);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.72, lineHeight: size }}>{emoji}</Text>
    </View>
  );
}
