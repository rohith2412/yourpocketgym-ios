import AvatarButton from "@/components/AvatarButton";
import MealPlanView from "@/components/MealPlanView";
import PremiumGate from "@/components/PremiumGate";
import { useSubscription } from "@/src/hooks/useSubscription";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
///* Right: food image */} LibraryCard progress skip
const BASE_URL = "https://yourpocketgym.com";
//e.g.
const GOALS = [
  { key: "muscle gain", emoji: "", label: "Muscle Gain", color: "#e8380d", bg: "rgba(232,56,13,0.1)" },
  { key: "fat loss", emoji: "", label: "Fat Loss", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  { key: "maintenance", emoji: "", label: "Maintenance", color: "#888", bg: "#f4f2ed" },
  { key: "weight gain", emoji: "", label: "Weight Gain", color: "#e8380d", bg: "rgba(232,56,13,0.1)" },
];

const MEAL_TYPES = [
  { key: "breakfast", emoji: "", label: "Breakfast" },
  { key: "lunch", emoji: "", label: "Lunch" },
  { key: "dinner", emoji: "", label: "Dinner" },
  { key: "snack", emoji: "", label: "Snack" },
  { key: "smoothie", emoji: "", label: "Smoothie" },
];

const INGREDIENT_CATEGORIES = [
  {
    label: " Protein",
    items: ["Chicken breast","Chicken thighs","Ground beef","Ground turkey","Steak","Pork","Bacon","Salmon","Tuna","Shrimp","Eggs","Egg whites","Tofu","Tempeh","Sardines","Mackerel","Cod","Tilapia"],
  },
  {
    label: " Dairy & Alternatives",
    items: ["Greek yogurt","Cottage cheese","Milk","Cheddar","Feta","Mozzarella","Ricotta","Cream cheese","Butter","Parmesan","Almond milk","Coconut milk","Oat milk"],
  },
  {
    label: " Legumes & Grains",
    items: ["Black beans","Chickpeas","Lentils","Edamame","Oats","Brown rice","White rice","Whole wheat pasta","Penne","Bread","Tortilla","Quinoa"],
  },
  {
    label: " Vegetables",
    items: ["Spinach","Broccoli","Kale","Avocado","Sweet potato","Bell peppers","Zucchini","Cauliflower","Asparagus","Mushrooms","Cherry tomatoes","Cucumber","Onion","Garlic","Carrot","Celery","Cabbage","Bok choy"],
  },
  {
    label: " Fruit",
    items: ["Banana","Strawberries","Blueberries","Mango","Apple","Lemon","Lime","Orange","Raspberries","Pineapple"],
  },
  {
    label: " Nuts, Seeds & Oils",
    items: ["Peanut butter","Almond butter","Almonds","Walnuts","Chia seeds","Flaxseeds","Sesame seeds","Olive oil","Coconut oil","Hemp seeds"],
  },
  {
    label: " Pantry",
    items: ["Soy sauce","Hot sauce","Honey","Protein powder","Whey protein","Canned tomatoes","Chicken stock","Miso paste","Tahini","Salsa"],
  },
];

function useAuth() {
  const [token, setToken]     = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId]   = useState("");
  useEffect(() => {
    AsyncStorage.multiGet(["token", "user"]).then(([[, t], [, raw]]) => {
      if (t) setToken(t);
      if (raw) {
        try {
          const u = JSON.parse(raw);
          setUserName(u.name?.split(" ")[0] ?? "");
          setUserId(u.sub || u.uid || u.id || u._id || "");
        } catch {}
      }
    });
  }, []);
  return { token, userName, userId };
}

function fmt(n: number | undefined | null): number { return Math.round(n ?? 0); }
function totalTime(r: any): number { return (r.prepTime || 0) + (r.cookTime || 0); }
function goalMeta(key: string) { return GOALS.find((g) => g.key === key) || { color: "#aaa", bg: "#f4f2ed" }; }
function recipeKey(r: any): string { return r._id || r.name || ""; }

function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, selected && s.chipActive]}>
      <Text style={[s.chipText, selected && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MacroBar({ label, value, max, color, unit = "g" }: { label: string; value: number | undefined; max: number; color: string; unit?: string }) {
  const pct = max > 0 ? Math.min(((value ?? 0) / max) * 100, 100) : 0;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={s.macroValue}>{fmt(value)}{unit}</Text>
      </View>
      <View style={s.macroTrack}>
        <View style={[s.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function BookmarkIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#e8380d" : "none"}
      stroke={filled ? "#e8380d" : "#aaa"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </Svg>
  );
}

function RecipeDetail({ recipe, onBack, onRegenerate, isGenerating, isSaved, onToggleSave }: {
  recipe: any; onBack: () => void; onRegenerate: () => void;
  isGenerating: boolean; isSaved: boolean; onToggleSave: () => void;
}) {
  const [tab, setTab] = useState("ingredients");
  const meta = goalMeta(recipe.goal);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 32 }}>
      {/* Top nav row */}
      <View style={s.actionRow}>
        <TouchableOpacity onPress={onBack} style={s.actionBtn}>
          <Text style={s.actionBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegenerate} disabled={isGenerating} style={[s.actionBtn, { opacity: isGenerating ? 0.5 : 1 }]}>
          <Text style={[s.actionBtnText, { color: "#111112" }]}>{isGenerating ? "Finding…" : "↺ Try another"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {recipe.goal && (
              <View style={[s.tagBadge, { backgroundColor: meta.bg }]}>
                <Text style={[s.tagBadgeText, { color: meta.color }]}>{recipe.goal}</Text>
              </View>
            )}
            {recipe.mealType && <View style={s.tagBadgeGray}><Text style={s.tagBadgeGrayText}>{recipe.mealType}</Text></View>}
            {recipe.difficulty && <View style={s.tagBadgeGray}><Text style={s.tagBadgeGrayText}>{recipe.difficulty}</Text></View>}
          </View>
          <Text style={s.recipeTitle}>{recipe.name}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Prep", val: `${recipe.prepTime}m` },
            { label: "Cook", val: `${recipe.cookTime}m` },
            { label: "Total", val: `${totalTime(recipe)}m` },
            { label: "Servings", val: recipe.servings },
          ].map((item) => (
            <View key={item.label} style={s.timeStat}>
              <Text style={s.timeStatVal}>{item.val}</Text>
              <Text style={s.timeStatLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.calorieHero}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text style={s.calorieEyebrow}>Calories</Text>
              <Text style={s.calorieNum}>{fmt(recipe.macros?.calories)}<Text style={s.calorieUnit}> cal</Text></Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {[
                { label: "Protein", val: recipe.macros?.protein, color: "#e8380d" },
                { label: "Carbs", val: recipe.macros?.carbs, color: "#fff" },
                { label: "Fat", val: recipe.macros?.fat, color: "rgba(255,255,255,0.5)" },
              ].map((m) => (
                <View key={m.label} style={{ alignItems: "center" }}>
                  <Text style={[s.macroHeroVal, { color: m.color }]}>{fmt(m.val)}<Text style={s.macroHeroUnit}>g</Text></Text>
                  <Text style={s.macroHeroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <MacroBar label="Fiber" value={recipe.macros?.fiber} max={40} color="#4ade80" />
          <MacroBar label="Sugar" value={recipe.macros?.sugar} max={50} color="#fb923c" />
          <MacroBar label="Sodium" value={recipe.macros?.sodium} max={2300} color="#60a5fa" unit="mg" />
          <MacroBar label="Cholesterol" value={recipe.macros?.cholesterol} max={300} color="#e879f9" unit="mg" />
        </View>

        {recipe.proteinSources?.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {recipe.proteinSources.map((src: string, i: number) => (
              <View key={i} style={s.proteinTag}><Text style={s.proteinTagText}>{src}</Text></View>
            ))}
          </View>
        )}
      </View>

      <View style={s.tabBar}>
        {["ingredients", "steps"].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "ingredients" && (
        <View style={s.card}>
          {recipe.ingredients?.map((ing: any, i: number) => (
            <View key={i} style={[s.ingRow, i < recipe.ingredients.length - 1 && s.ingRowBorder]}>
              <Text style={s.ingName}>{ing.item}</Text>
              <Text style={s.ingAmount}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {tab === "steps" && (
        <View style={{ gap: 8 }}>
          {recipe.steps?.map((step: string, i: number) => (
            <View key={i} style={[s.card, { flexDirection: "row", gap: 12, alignItems: "flex-start" }]}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {recipe.tip && (
        <View style={s.tipCard}>
          <Text style={s.tipTitle}>Pro tip</Text>
          <Text style={s.tipText}>{recipe.tip}</Text>
        </View>
      )}

      {/* ── Prominent save button ── */}
      <TouchableOpacity onPress={onToggleSave} activeOpacity={0.85}
        style={[s.detailSaveBtn, isSaved && s.detailSaveBtnSaved]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={s.detailSaveBtnIcon}>
            <BookmarkIcon filled={isSaved} size={18} />
          </View>
          <View>
            <Text style={[s.detailSaveBtnTitle, isSaved && { color: "#e8380d" }]}>
              {isSaved ? "Recipe saved" : "Save this recipe"}
            </Text>
            <Text style={s.detailSaveBtnSub}>
              {isSaved ? "Tap to remove from saved" : "Find it anytime under All Recipes → Saved"}
            </Text>
          </View>
        </View>
        {isSaved && (
          <Text style={{ fontSize: 18 }}>✓</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
//
function LibraryCard({ recipe, onPress }: { recipe: any; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.libCard} activeOpacity={0.8}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.libName} numberOfLines={1}>{recipe.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
          <Text style={s.libProtein}>{fmt(recipe.macros?.protein)}g protein</Text>
          <Text style={s.libDot}>·</Text>
          <Text style={s.libMeta}>{fmt(recipe.macros?.calories)} cal</Text>
          <Text style={s.libDot}>·</Text>
          <Text style={s.libMeta}>{totalTime(recipe)}m</Text>
        </View>
      </View>
      <View style={s.libGoalBadge}>
        <Text style={s.libGoalText}>{recipe.mealType || recipe.goal || ""}</Text>
      </View>
    </TouchableOpacity>
  );
}

const RECIPE_EMOJI_MAP: { keys: string[]; emoji: string }[] = [
  // ── Proteins ──
  { keys: ["chicken breast", "chicken thigh", "grilled chicken", "baked chicken", "chicken"], emoji: "🍗" },
  { keys: ["steak", "beef steak", "ribeye", "sirloin"], emoji: "🥩" },
  { keys: ["ground beef", "beef mince", "beef burger", "burger"], emoji: "🍔" },
  { keys: ["ground turkey", "turkey meatball", "turkey"], emoji: "🍗" },
  { keys: ["bacon", "pork belly", "pork chop", "pork"], emoji: "🥓" },
  { keys: ["salmon", "baked salmon", "grilled salmon"], emoji: "🍣" },
  { keys: ["tuna", "tuna salad", "tuna melt"], emoji: "🥘" },
  { keys: ["shrimp", "prawn", "shrimp stir"], emoji: "🥘" },
  { keys: ["egg white", "scrambled egg", "omelette", "omelet", "frittata", "egg"], emoji: "🍳" },
  { keys: ["tofu", "tempeh"], emoji: "🫘" },
  // ── Pasta & noodles ──
  { keys: ["spaghetti", "pasta", "penne", "fettuccine", "linguine", "rigatoni", "lasagna", "mac and cheese", "macaroni"], emoji: "🍝" },
  { keys: ["ramen", "noodle", "lo mein", "pad thai", "udon", "soba"], emoji: "🍜" },
  // ── Rice & grains ──
  { keys: ["fried rice", "rice bowl", "stir fry rice", "rice"], emoji: "🍚" },
  { keys: ["quinoa bowl", "quinoa"], emoji: "🌾" },
  { keys: ["oat", "porridge", "overnight oat", "granola"], emoji: "🥣" },
  // ── Soups & stews ──
  { keys: ["soup", "chowder", "bisque", "broth", "bone broth"], emoji: "🍲" },
  { keys: ["stew", "chili", "curry"], emoji: "🫕" },
  // ── Wraps, tacos, burritos ──
  { keys: ["taco", "fish taco", "chicken taco"], emoji: "🌮" },
  { keys: ["burrito", "wrap", "gyro", "fajita"], emoji: "🌯" },
  { keys: ["sandwich", "sub", "panini", "toast", "club"], emoji: "🥪" },
  // ── Pizza & flatbreads ──
  { keys: ["pizza", "flatbread", "calzone"], emoji: "🍕" },
  // ── Salads & bowls ──
  { keys: ["caesar salad", "greek salad", "salad", "bowl", "power bowl", "grain bowl"], emoji: "🥗" },
  // ── Pancakes & breakfast bakes ──
  { keys: ["pancake", "waffle", "crepe", "french toast"], emoji: "🥞" },
  { keys: ["muffin", "banana bread", "zucchini bread", "protein bread"], emoji: "🧁" },
  // ── Smoothies & drinks ──
  { keys: ["smoothie", "shake", "protein shake", "protein smoothie", "juice", "blend"], emoji: "🥤" },
  // ── Snacks & bars ──
  { keys: ["protein bar", "energy ball", "energy bite", "granola bar", "snack bar"], emoji: "🍫" },
  { keys: ["hummus", "dip"], emoji: "🫙" },
  { keys: ["trail mix", "nut mix", "almond", "nut"], emoji: "🥜" },
  // ── Vegetables & sides ──
  { keys: ["broccoli", "roasted broccoli", "steamed broccoli"], emoji: "🥦" },
  { keys: ["sweet potato", "roasted potato", "potato"], emoji: "🥔" },
  { keys: ["avocado", "guacamole"], emoji: "🥑" },
  { keys: ["mushroom"], emoji: "🍄" },
  { keys: ["roasted vegetable", "veggie", "stir fry vegetable"], emoji: "🥦" },
  // ── Desserts ──
  { keys: ["yogurt parfait", "parfait", "yogurt"], emoji: "🫙" },
  { keys: ["cheesecake", "cake", "brownie", "cookie", "pudding", "mousse"], emoji: "🍮" },
  { keys: ["ice cream", "frozen yogurt"], emoji: "🍨" },
  // ── Sushi & Asian ──
  { keys: ["sushi", "sashimi", "poke", "onigiri"], emoji: "🍱" },
  { keys: ["dumpling", "gyoza", "wonton"], emoji: "🥟" },
  // ── Fruit ──
  { keys: ["acai", "berry bowl"], emoji: "🫐" },
];

function pickRecipeEmoji(recipe: any): string {
  const haystack = [recipe.name ?? "", ...(recipe.proteinSources ?? [])].join(" ").toLowerCase();
  for (const { keys, emoji } of RECIPE_EMOJI_MAP) {
    if (keys.some((k) => haystack.includes(k))) return emoji;
  }
  // broad fallback on single wordswordsrecipes/saved-recipes /
  // broad fallback on single wordswords  recipes recipes/saved-recipes /
  if (haystack.includes("chicken")) return "🍗";
  if (haystack.includes("beef") || haystack.includes("meat")) return "🥩";
  if (haystack.includes("fish") || haystack.includes("seafood")) return "🍣";
  if (haystack.includes("rice")) return "🍚";
  if (haystack.includes("pasta") || haystack.includes("noodle")) return "🍝";
  if (haystack.includes("salad")) return "🥗";
  if (haystack.includes("soup")) return "🍲";
  if (haystack.includes("egg")) return "🍳";
  if (haystack.includes("smoothie") || haystack.includes("shake")) return "🥤";
  if (haystack.includes("oat")) return "🥣";
  return "🍽️";
}

const CARD_ACCENTS = ["#1a1a1a", "#111318", "#12100e", "#0f1117", "#111111"];

function RecipeCard({ recipe, onPress, onSave, isSaved = false, index = 0 }: {
  recipe: any; onPress: () => void; onSave?: () => void; isSaved?: boolean; index?: number;
}) {
  const meta = goalMeta(recipe.goal);
  const emoji = pickRecipeEmoji(recipe);
  const bg = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const protein = fmt(recipe.macros?.protein);
  const calories = fmt(recipe.macros?.calories);
  const time = totalTime(recipe);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={rc.card}>
      {/* ── Dark header ── */}
      <View style={[rc.header, { backgroundColor: bg }]}>
        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
              {recipe.mealType && (
                <View style={rc.badge}>
                  <Text style={rc.badgeText}>{recipe.mealType}</Text>
                </View>
              )}
              {recipe.difficulty && (
                <View style={[rc.badge, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                  <Text style={[rc.badgeText, { color: "rgba(255,255,255,0.4)" }]}>{recipe.difficulty}</Text>
                </View>
              )}
            </View>
            <Text style={rc.name} numberOfLines={2}>{recipe.name}</Text>
          </View>
            {/* Right column: emoji */}
          <View style={rc.emojiWrap}>
            <Text style={rc.emoji}>{emoji}</Text>
          </View>
        </View>

        {/* Goal pill + protein highlight */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          {recipe.goal ? (
            <View style={[rc.goalPill, { backgroundColor: meta.bg ?? "rgba(232,56,13,0.15)" }]}>
              <Text style={[rc.goalPillText, { color: meta.color ?? "#e8380d" }]}>{recipe.goal}</Text>
            </View>
          ) : <View />}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={rc.proteinBig}>{protein}<Text style={rc.proteinUnit}>g</Text></Text>
            <Text style={rc.proteinLabel}>PROTEIN</Text>
          </View>
        </View>
      </View>

      {/* ── White footer stats ── */}
      <View style={rc.footer}>
        {[
          { label: "Calories", val: `${calories} cal` },
          { label: "Total time", val: `${time} min` },
          { label: "Servings", val: `${recipe.servings ?? "—"}` },
          { label: "Carbs", val: `${fmt(recipe.macros?.carbs)}g` },
        ].map((stat, i) => (
          <View key={stat.label} style={[rc.stat, i < 3 && rc.statBorder]}>
            <Text style={rc.statVal}>{stat.val}</Text>
            <Text style={rc.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Save row ── */}
      <TouchableOpacity
        onPress={(e) => { onSave?.(); }}
        activeOpacity={0.75}
        style={[rc.saveRow, isSaved && rc.saveRowSaved]}
      >
        <BookmarkIcon filled={isSaved} size={14} />
        <Text style={[rc.saveRowText, isSaved && rc.saveRowTextSaved]}>
          {isSaved ? "Saved to your collection" : "Save recipe"}
        </Text>
        {isSaved && <Text style={{ fontSize: 12, color: "#e8380d", marginLeft: "auto" }}>✓</Text>}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function FilterModal({ visible, libGoal, libMeal, onGoalChange, onMealChange, onClose }: {
  visible: boolean; libGoal: string; libMeal: string;
  onGoalChange: (v: string) => void; onMealChange: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={s.sheetTitle}>Filter Recipes</Text>
          <Label>Goal</Label>
          <View style={s.filterGrid}>
            {[{ key: "", emoji: "🔀", label: "All" }, ...GOALS].map((g) => (
              <TouchableOpacity key={g.key} onPress={() => onGoalChange(g.key)} style={[s.filterBtn, libGoal === g.key && s.filterBtnActive]}>
                <Text style={{ fontSize: 15 }}>{g.emoji}</Text>
                <Text style={[s.filterBtnText, libGoal === g.key && { color: "#fff" }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Label style={{ marginTop: 16 }}>Meal Type</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {[{ key: "", emoji: "🔀", label: "All" }, ...MEAL_TYPES].map((m) => (
              <TouchableOpacity key={m.key} onPress={() => onMealChange(m.key)} style={[s.chip, libMeal === m.key && s.chipActive]}>
                <Text style={[s.chipText, libMeal === m.key && s.chipTextActive]}>{m.emoji} {m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onClose} style={s.saveBtn}>
            <Text style={s.saveBtnText}>Apply Filters</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function RecipesScreen() {
  const { token, userName, userId } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();

  const savedKey = userId ? `saved_recipes/${userId}` : "saved_recipes";

  const [mainTab, setMainTab]     = useState("mealplan");
  const [allSubTab, setAllSubTab] = useState<"all" | "saved">("all");
  const [selected, setSelected]   = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [openCat, setOpenCat]     = useState<number | null>(null);
  const [goal, setGoal]           = useState<string | null>(null);
  const [mealType, setMealType]   = useState<string | null>(null);

  const [recipe, setRecipe]       = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [libRecipes, setLibRecipes] = useState<any[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libGoal, setLibGoal]     = useState("");
  const [libMeal, setLibMeal]     = useState("");
  const [libPage, setLibPage]     = useState(1);
  const [libPages, setLibPages]   = useState(1);
  const [libTotal, setLibTotal]   = useState(0);
  const [selected2, setSelected2] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);

  // ── Load saved from local (per-user key) + backend ──
  useEffect(() => {
    if (!savedKey) return;
    AsyncStorage.getItem(savedKey).then((raw) => {
      if (raw) { try { setSavedRecipes(JSON.parse(raw)); } catch {} }
    });
  }, [savedKey]);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/recipes/saved-recipes`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((json) => {
      if (json.success && Array.isArray(json.data) && json.data.length) {
        setSavedRecipes(json.data);
        AsyncStorage.setItem(savedKey, JSON.stringify(json.data)).catch(() => {});
      }
    }).catch(() => {});
  }, [token, savedKey]);

  async function toggleSave(recipe: any) {
    const key = recipeKey(recipe);
    const alreadySaved = savedRecipes.some((r) => recipeKey(r) === key);
    const updated = alreadySaved
      ? savedRecipes.filter((r) => recipeKey(r) !== key)
      : [{ ...recipe, savedAt: Date.now() }, ...savedRecipes];
    setSavedRecipes(updated);
    await AsyncStorage.setItem(savedKey, JSON.stringify(updated));
    if (token) {
      try {
        if (alreadySaved) {
          await fetch(`${BASE_URL}/api/recipes/saved-recipes/${encodeURIComponent(key)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await fetch(`${BASE_URL}/api/recipes/saved-recipes`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ recipe }),
          });
        }
      } catch {} // local is source of truth
    }
  }

  function checkSaved(recipe: any): boolean {
    return savedRecipes.some((r) => recipeKey(r) === recipeKey(recipe));
  }

  // advanced filters
  const [libSearch, setLibSearch] = useState("");
  const [libSort, setLibSort] = useState("default");
  const [libMaxTime, setLibMaxTime] = useState(0);       // 0=any, else max total minutes
  const [libMinProtein, setLibMinProtein] = useState(0); // 0=any, else min grams
  const [libDifficulty, setLibDifficulty] = useState("");

  const isShowingDetail = recipe || selected2;

  function toggleIngredient(item: string) {
    setSelected((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val) return;
    if (!selected.includes(val)) setSelected((prev) => [...prev, val]);
    setCustomInput("");
  }

  async function findRecipe(forceNew = false) {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const res = await fetch(`${BASE_URL}/api/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ingredients: selected, goal, mealType, forceNew }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setRecipe(json.data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const fetchLibrary = useCallback(async (page = 1) => {
    setLibLoading(true);
    try {
      const res = await fetch("https://raw.githubusercontent.com/rohith2412/recipes_seed/main/recipes_seed.json");
      const all = await res.json();

      // ── Filter ──
      let filtered = all.filter((r: any) => {
        if (libGoal && r.goal !== libGoal) return false;
        if (libMeal && r.mealType !== libMeal) return false;
        if (libDifficulty && (r.difficulty || "").toLowerCase() !== libDifficulty) return false;
        if (libMaxTime > 0 && totalTime(r) > libMaxTime) return false;
        if (libMinProtein > 0 && (r.macros?.protein ?? 0) < libMinProtein) return false;
        if (libSearch.trim()) {
          const q = libSearch.trim().toLowerCase();
          const haystack = [r.name, r.goal, r.mealType, ...(r.proteinSources || [])].join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

      // ── Sort ──
      if (libSort === "protein")   filtered = [...filtered].sort((a, b) => (b.macros?.protein ?? 0) - (a.macros?.protein ?? 0));
      if (libSort === "calories")  filtered = [...filtered].sort((a, b) => (a.macros?.calories ?? 0) - (b.macros?.calories ?? 0));
      if (libSort === "time")      filtered = [...filtered].sort((a, b) => totalTime(a) - totalTime(b));
      if (libSort === "cals_high") filtered = [...filtered].sort((a, b) => (b.macros?.calories ?? 0) - (a.macros?.calories ?? 0));

      const limit = 20;
      const total = filtered.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      setLibRecipes(filtered.slice(start, start + limit));
      setLibTotal(total);
      setLibPages(Math.max(pages, 1));
      setLibPage(page);
    } finally {
      setLibLoading(false);
    }
  }, [libGoal, libMeal, libSearch, libSort, libMaxTime, libMinProtein, libDifficulty]);

  useEffect(() => {
    if (mainTab === "all") fetchLibrary(1);
  }, [mainTab, libGoal, libMeal, libSearch, libSort, libMaxTime, libMinProtein, libDifficulty, fetchLibrary]);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  return (
    <PremiumGate isUserPremium={isPremium} subChecking={subLoading} featureName="Recipes">
      <SafeAreaView style={s.screen} edges={["top"]}>
        {/* <PageBackground variant="recipes" /> */}

        {/* Header */}
        <View style={s.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <View>
            <Text style={s.greeting}>Good {getGreeting()}{userName ? `, ${userName}` : ""}</Text>
            <Text style={s.headerTitle}>Recipes</Text>
          </View>
          <AvatarButton />
        </View>

        {!isShowingDetail && (
          <View style={s.tabsRow}>
            {[["mealplan", "Meal Plan"], ["find", "Find"], ["all", "All Recipes"]].map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setMainTab(key)} style={s.mainTab}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={[s.mainTabText, mainTab === key && s.mainTabTextActive]}>{label}</Text>
                  {key === "all" && savedRecipes.length > 0 && (
                    <View style={s.savedTabBadge}>
                      <Text style={s.savedTabBadgeText}>{savedRecipes.length}</Text>
                    </View>
                  )}
                </View>
                <View style={[s.mainTabLine, mainTab === key && s.mainTabLineActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>

        {/* Detail View */}
        {(recipe || selected2) && (
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
            <RecipeDetail
              recipe={recipe || selected2}
              onBack={() => { setRecipe(null); setSelected2(null); }}
              onRegenerate={() => (recipe ? findRecipe(true) : null)}
              isGenerating={loading}
              isSaved={checkSaved(recipe || selected2)}
              onToggleSave={() => toggleSave(recipe || selected2)}
            />
          </View>
        )}

        {/* ─── Find Tab ─── */}
        {!isShowingDetail && mainTab === "find" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 18 }}
            keyboardShouldPersistTaps="handled"
          >

            {/* darkInputImageWrap ── DARK CUSTOM INGREDIENT CARD with food image ── */}
            <View style={s.darkInputCard}>
              {/* Left: text + input */}
              <View style={s.darkInputLeft}>
                <Text style={s.darkInputEyebrow}>TYPE AN INGREDIENT</Text>
                <Text style={s.darkInputHeading}>What's in{"\n"}your kitchen?</Text>

                <View style={s.darkInputRow}>
                  <TextInput
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="e.g. pasta…"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    style={s.darkTextInput}
                    onSubmitEditing={addCustom}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={addCustom}
                    disabled={!customInput.trim()}
                    style={[s.darkAddBtn, customInput.trim() && s.darkAddBtnActive]}
                  >
                    <Text style={[s.darkAddBtnText, customInput.trim() && { color: "#1a1a1a" }]}>+</Text>
                  </TouchableOpacity>
                </View>

              </View>

              {/* Right: food image. darkInputImage */}
              {/* Right: decorative panel */}

              {/* Right: food image */}
<View style={s.darkInputImageWrap}>
  <Image
    source={require("@/assets/images/recipiesImage.png")}
    style={s.darkInputImage}
    resizeMode="cover"
    onError={(e) => console.log("Image failed to load", e)}
    defaultSource={require("@/assets/images/recipiesImage.png")} // optional
  />
  <View style={s.darkInputImageOverlay} />
</View>
{/* <View style={s.darkInputImageWrap}>
  <View style={s.darkInputGradient}>
    <Text style={s.darkInputDeco1}>🥦</Text>
    <Text style={s.darkInputDeco2}>🍳</Text>
    <Text style={s.darkInputDeco3}>🥩</Text>
  </View>
</View> */}
            </View>

            {/* Selected ingredients — shown outside the dark card */}
            {selected.length > 0 && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {selected.map((item) => (
                    <TouchableOpacity key={item} onPress={() => toggleIngredient(item)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#1a1a1a", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{item}</Text>
                      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setSelected([])}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(244,63,94,0.8)" }}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Preset categories */}
            <View>
              <Label>Or pick from common ingredients</Label>
              <View style={{ gap: 8 }}>
                {INGREDIENT_CATEGORIES.map((cat, ci) => (
                  <View key={ci} style={s.catCard}>
                    <TouchableOpacity onPress={() => setOpenCat(openCat === ci ? null : ci)} style={s.catHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={s.catLabel}>{cat.label}</Text>
                        {cat.items.filter((i) => selected.includes(i)).length > 0 && (
                          <View style={s.catCount}>
                            <Text style={s.catCountText}>{cat.items.filter((i) => selected.includes(i)).length}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.chevron, openCat === ci && s.chevronOpen]}>›</Text>
                    </TouchableOpacity>

                    {openCat === ci && (
                      <View style={s.catItems}>
                        {cat.items.map((item) => (
                          <Chip key={item} label={item} selected={selected.includes(item)} onPress={() => toggleIngredient(item)} />
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Goal filter */}
            <View>
              <Label>Goal (optional)</Label>
              <View style={s.goalGrid}>
                {GOALS.map((g) => (
                  <TouchableOpacity key={g.key} onPress={() => setGoal(goal === g.key ? null : g.key)} style={[s.goalBtn, goal === g.key && s.goalBtnActive]}>
                    <Text style={[s.goalBtnText, goal === g.key && { color: "#fff" }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meal type filter */}
            <View>
              <Label>Meal type (optional)</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {MEAL_TYPES.map((m) => (
                  <TouchableOpacity key={m.key} onPress={() => setMealType(mealType === m.key ? null : m.key)} style={[s.mealBtn, mealType === m.key && s.mealBtnActive]}>
                    <Text style={[s.mealBtnText, mealType === m.key && { color: "#fff" }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {error && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity
              onPress={() => findRecipe(false)}
              disabled={selected.length === 0 || loading}
              style={[s.generateBtn, (selected.length === 0 || loading) && { opacity: 0.4 }]}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.generateBtnText}>Finding best recipe…</Text>
                </View>
              ) : (
                <Text style={s.generateBtnText}>
                  Find recipe with {selected.length || "my"} ingredient{selected.length !== 1 ? "s" : ""}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Meal Plan Tab ─── */}
        {!isShowingDetail && mainTab === "mealplan" && (
          <MealPlanView enabled={true} />
        )}

        {/* ─── All Recipes Tab (includes Saved sub-section) ─── */}
        {!isShowingDetail && mainTab === "all" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* ── All / Saved sub-toggle ── */}
            <View style={s.subToggleRow}>
              <TouchableOpacity
                onPress={() => setAllSubTab("all")}
                style={[s.subToggleBtn, allSubTab === "all" && s.subToggleBtnActive]}
              >
                <Text style={[s.subToggleText, allSubTab === "all" && s.subToggleTextActive]}>All Recipes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAllSubTab("saved")}
                style={[s.subToggleBtn, allSubTab === "saved" && s.subToggleBtnActive]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={[s.subToggleText, allSubTab === "saved" && s.subToggleTextActive]}>Saved</Text>
                  {savedRecipes.length > 0 && (
                    <View style={[s.savedTabBadge, allSubTab === "saved" && { backgroundColor: "#fff" }]}>
                      <Text style={[s.savedTabBadgeText, allSubTab === "saved" && { color: "#1a1a1a" }]}>{savedRecipes.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* ════ ALL sub-tab ════ */}
            {allSubTab === "all" && (
              <>
                {/* ── Search + Filter button bar ── */}
                <View style={s.allTopBar}>
                  <View style={s.searchBar}>
                    <Text style={s.searchIcon}>🔍</Text>
                    <TextInput
                      value={libSearch}
                      onChangeText={setLibSearch}
                      placeholder="Search recipes…"
                      placeholderTextColor="#bbb"
                      style={s.searchInput}
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                    />
                    {libSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setLibSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontSize: 13, color: "#bbb", fontWeight: "700" }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setShowFilter(true)} style={s.filterBtn2}>
                    <Text style={s.filterBtn2Text}>Filter</Text>
                    {(() => {
                      const count = [libGoal, libMeal, libSort !== "default", libMaxTime > 0, libMinProtein > 0, libDifficulty].filter(Boolean).length;
                      return count > 0 ? (
                        <View style={s.filterBadge}><Text style={s.filterBadgeText}>{count}</Text></View>
                      ) : null;
                    })()}
                  </TouchableOpacity>
                </View>

                {/* Active filter summary chips */}
                {(libGoal || libMeal || libSort !== "default" || libMaxTime > 0 || libMinProtein > 0 || libDifficulty) && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 6, paddingBottom: 10 }}>
                    {libGoal      && <TouchableOpacity onPress={() => setLibGoal("")}       style={s.activeChip}><Text style={s.activeChipText}>{libGoal} ✕</Text></TouchableOpacity>}
                    {libMeal      && <TouchableOpacity onPress={() => setLibMeal("")}       style={s.activeChip}><Text style={s.activeChipText}>{libMeal} ✕</Text></TouchableOpacity>}
                    {libSort !== "default" && <TouchableOpacity onPress={() => setLibSort("default")} style={s.activeChip}><Text style={s.activeChipText}>Sort: {libSort} ✕</Text></TouchableOpacity>}
                    {libMaxTime > 0   && <TouchableOpacity onPress={() => setLibMaxTime(0)}     style={s.activeChip}><Text style={s.activeChipText}>Under {libMaxTime}m ✕</Text></TouchableOpacity>}
                    {libMinProtein > 0 && <TouchableOpacity onPress={() => setLibMinProtein(0)}  style={s.activeChip}><Text style={s.activeChipText}>{libMinProtein}g+ protein ✕</Text></TouchableOpacity>}
                    {libDifficulty && <TouchableOpacity onPress={() => setLibDifficulty("")}  style={s.activeChip}><Text style={s.activeChipText}>{libDifficulty} ✕</Text></TouchableOpacity>}
                  </ScrollView>
                )}

                {/* Results count */}
                <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: "#bbb", fontWeight: "600" }}>
                    {libLoading ? "Loading…" : `${libTotal} recipe${libTotal !== 1 ? "s" : ""}`}
                  </Text>
                </View>

                <View style={{ paddingHorizontal: 20, gap: 10 }}>
                  {libLoading ? (
                    <View style={{ gap: 12 }}>
                      {[1,2,3,4].map((_, i) => (
                        <View key={i} style={rc.card}>
                          <View style={[rc.header, { backgroundColor: "#1a1a1a", gap: 10 }]}>
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <View style={[s.skeleton, { height: 20, width: 70, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.07)" }]} />
                              <View style={[s.skeleton, { height: 20, width: 50, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.05)" }]} />
                            </View>
                            <View style={[s.skeleton, { height: 18, width: "80%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)" }]} />
                            <View style={[s.skeleton, { height: 14, width: "55%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)" }]} />
                          </View>
                          <View style={[rc.footer, { backgroundColor: "#f4f2ed" }]}>
                            {[1,2,3,4].map((_, j) => (
                              <View key={j} style={[rc.stat, j < 3 && rc.statBorder, { gap: 4 }]}>
                                <View style={[s.skeleton, { height: 13, width: 40, borderRadius: 4 }]} />
                                <View style={[s.skeleton, { height: 9, width: 30, borderRadius: 3 }]} />
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : libRecipes.length === 0 ? (
                    <View style={[s.card, { alignItems: "center", padding: 40 }]}>
                      <Text style={s.emptyTitle}>No recipes found</Text>
                      <Text style={s.emptyDesc}>Try adjusting your filters.</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {libRecipes.map((r, i) => (
                        <RecipeCard key={r._id || i} recipe={r} index={i}
                          onPress={() => setSelected2(r)}
                          isSaved={checkSaved(r)}
                          onSave={() => toggleSave(r)}
                        />
                      ))}
                    </View>
                  )}

                  {/* Numbered page buttons */}
                  {libPages > 1 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 4 }}>
                      {Array.from({ length: libPages }, (_, i) => i + 1).map((pg) => (
                        <TouchableOpacity
                          key={pg}
                          onPress={() => fetchLibrary(pg)}
                          style={[s.pageNumBtn, libPage === pg && s.pageNumBtnActive]}
                        >
                          <Text style={[s.pageNumBtnText, libPage === pg && s.pageNumBtnTextActive]}>{pg}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ════ SAVED sub-tab ════ */}
            {allSubTab === "saved" && (
              <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
                {savedRecipes.length === 0 ? (
                  <View style={s.savedEmpty}>
                    <View style={s.savedEmptyIcon}>
                      <BookmarkIcon filled={false} size={32} />
                    </View>
                    <Text style={s.savedEmptyTitle}>No saved recipes yet</Text>
                    <Text style={s.savedEmptyDesc}>
                      Tap the bookmark on any recipe card to save it here for quick access.
                    </Text>
                    <TouchableOpacity onPress={() => setAllSubTab("all")} style={s.savedEmptyBtn}>
                      <Text style={s.savedEmptyBtnText}>Browse All Recipes</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: "#bbb", fontWeight: "600" }}>
                        {savedRecipes.length} saved recipe{savedRecipes.length !== 1 ? "s" : ""}
                      </Text>
                      <TouchableOpacity onPress={async () => {
                        setSavedRecipes([]);
                        await AsyncStorage.setItem(savedKey, "[]").catch(() => {});
                        if (token) {
                          fetch(`${BASE_URL}/api/recipes/saved-recipes`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => {});
                        }
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(244,63,94,0.8)" }}>Clear all</Text>
                      </TouchableOpacity>
                    </View>
                    {savedRecipes.map((r, i) => (
                      <RecipeCard key={recipeKey(r) || i} recipe={r} index={i}
                        onPress={() => setSelected2(r)}
                        isSaved={true}
                        onSave={() => toggleSave(r)}
                      />
                    ))}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <FilterModal
        visible={showFilter && mainTab !== "all"}
        libGoal={libGoal}
        libMeal={libMeal}
        onGoalChange={setLibGoal}
        onMealChange={setLibMeal}
        onClose={() => setShowFilter(false)}
      />

      {/* ── Advanced filter sheet (All Recipes tab) ── */}
      <Modal transparent animationType="slide" visible={showFilter && mainTab === "all"} onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowFilter(false)} />
        <View style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Text style={s.sheetTitle}>Filter & Sort</Text>
            {(libGoal || libMeal || libSort !== "default" || libMaxTime || libMinProtein || libDifficulty) && (
              <TouchableOpacity onPress={() => { setLibGoal(""); setLibMeal(""); setLibSort("default"); setLibMaxTime(0); setLibMinProtein(0); setLibDifficulty(""); }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(244,63,94,0.85)" }}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 32 }}>

            {/* Sort by */}
            <View>
              <Text style={s.sheetSectionLabel}>Sort by</Text>
              <View style={s.sheetChipRow}>
                {[
                  { key: "default",   label: "Default" },
                  { key: "protein",   label: "Most protein" },
                  { key: "calories",  label: "Lowest cal" },
                  { key: "cals_high", label: "Highest cal" },
                  { key: "time",      label: "Quickest" },
                ].map((opt) => (
                  <TouchableOpacity key={opt.key} onPress={() => setLibSort(opt.key)}
                    style={[s.sheetChip, libSort === opt.key && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libSort === opt.key && s.sheetChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goal */}
            <View>
              <Text style={s.sheetSectionLabel}>Goal</Text>
              <View style={s.sheetChipRow}>
                {[{ key: "", label: "All goals" }, ...GOALS].map((g) => (
                  <TouchableOpacity key={g.key} onPress={() => setLibGoal(g.key === libGoal ? "" : g.key)}
                    style={[s.sheetChip, libGoal === g.key && g.key !== "" && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libGoal === g.key && g.key !== "" && s.sheetChipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meal type */}
            <View>
              <Text style={s.sheetSectionLabel}>Meal type</Text>
              <View style={s.sheetChipRow}>
                {[{ key: "", label: "Any type" }, ...MEAL_TYPES].map((m) => (
                  <TouchableOpacity key={m.key} onPress={() => setLibMeal(m.key === libMeal ? "" : m.key)}
                    style={[s.sheetChip, libMeal === m.key && m.key !== "" && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libMeal === m.key && m.key !== "" && s.sheetChipTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cook time */}
            <View>
              <Text style={s.sheetSectionLabel}>Cook time</Text>
              <View style={s.sheetChipRow}>
                {[
                  { val: 0,  label: "Any time" },
                  { val: 15, label: "Under 15m" },
                  { val: 25, label: "Under 25m" },
                  { val: 40, label: "Under 40m" },
                  { val: 60, label: "Under 1hr" },
                ].map((opt) => (
                  <TouchableOpacity key={opt.val} onPress={() => setLibMaxTime(opt.val === libMaxTime ? 0 : opt.val)}
                    style={[s.sheetChip, libMaxTime === opt.val && opt.val !== 0 && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libMaxTime === opt.val && opt.val !== 0 && s.sheetChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Min protein */}
            <View>
              <Text style={s.sheetSectionLabel}>Minimum protein</Text>
              <View style={s.sheetChipRow}>
                {[
                  { val: 0,  label: "Any" },
                  { val: 15, label: "15g+" },
                  { val: 25, label: "25g+" },
                  { val: 35, label: "35g+" },
                  { val: 50, label: "50g+" },
                ].map((opt) => (
                  <TouchableOpacity key={opt.val} onPress={() => setLibMinProtein(opt.val === libMinProtein ? 0 : opt.val)}
                    style={[s.sheetChip, libMinProtein === opt.val && opt.val !== 0 && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libMinProtein === opt.val && opt.val !== 0 && s.sheetChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty meal  */}
            <View>
              <Text style={s.sheetSectionLabel}>Difficulty</Text>
              <View style={s.sheetChipRow}>
                {[
                  { val: "",       label: "Any" },
                  { val: "easy",   label: "Easy" },
                  { val: "medium", label: "Medium" },
                  { val: "hard",   label: "Hard" },
                ].map((opt) => (
                  <TouchableOpacity key={opt.val} onPress={() => setLibDifficulty(opt.val === libDifficulty ? "" : opt.val)}
                    style={[s.sheetChip, libDifficulty === opt.val && opt.val !== "" && s.sheetChipActive]}>
                    <Text style={[s.sheetChipText, libDifficulty === opt.val && opt.val !== "" && s.sheetChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={() => setShowFilter(false)} style={s.saveBtn}>
              <Text style={s.saveBtnText}>
                {libLoading ? "Applying…" : `Show ${libTotal} recipe${libTotal !== 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      </SafeAreaView>
    </PremiumGate>
  );
}
//libCard
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
  },
  greeting: { fontSize: 12, color: "#323131", fontWeight: "400", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1, lineHeight: 30 },
  tabsRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  mainTab: { flex: 1, paddingVertical: 10, alignItems: "center", position: "relative" },
  mainTabText: { fontSize: 13, fontWeight: "700", color: "#aaa" },
  mainTabTextActive: { color: "#1a1a1a" },
  mainTabLine: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2, borderRadius: 2, backgroundColor: "transparent" },
  mainTabLineActive: { backgroundColor: "#000000" },

  darkInputCard: {
    backgroundColor: "#111111",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    overflow: "hidden",
    height: 200,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  darkInputLeft: {
    width: 200,
    padding: 18,
    justifyContent: "center",
  },
  darkInputEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 6,
  },
  darkInputHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.8,
    lineHeight: 25,
    marginBottom: 16,
  },
  darkInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 6,
  },
  darkTextInput: {
    flex: 1,
    fontSize: 13,
    color: "#ffffff",
    paddingVertical: 8,
  },
  darkAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  darkAddBtnActive: {
    backgroundColor: "#ffffff",
  },
  darkAddBtnText: {
    fontSize: 20,
    fontWeight: "300",
    color: "rgba(255,255,255,0.4)",
    lineHeight: 22,
  },
  darkChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  darkChipText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  darkClearBtn: { alignSelf: "flex-start", marginTop: 2 },
  darkClearBtnText: { fontSize: 10, fontWeight: "700", color: "rgba(244,63,94,0.7)" },
darkInputImageWrap: {
  flex: 1,
  overflow: "hidden",
  borderTopRightRadius: 22,
  borderBottomRightRadius: 22,
},
darkInputImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},
  darkInputImageOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    pointerEvents: "none",
  },

  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: "#e8e5de", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#1a1a1a", borderWidth: 0 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#fff" },
  skeleton: { backgroundColor: "#e8e5de", borderRadius: 20 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, padding: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 12, alignItems: "center" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  recipeTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5, lineHeight: 22 },
  tagBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  tagBadgeGray: { backgroundColor: "#f4f2ed", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagBadgeGrayText: { fontSize: 9, fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8 },
  timeStat: { flex: 1, backgroundColor: "#f4f2ed", borderRadius: 12, padding: 8, alignItems: "center" },
  timeStatVal: { fontSize: 13, fontWeight: "800", color: "#1a1a1a" },
  timeStatLabel: { fontSize: 9, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.6 },
  calorieHero: { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 14, marginBottom: 12 },
  calorieEyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 },
  calorieNum: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -1, lineHeight: 32 },
  calorieUnit: { fontSize: 12, fontWeight: "400", color: "rgba(255,255,255,0.4)" },
  macroHeroVal: { fontSize: 16, fontWeight: "800", letterSpacing: -0.5 },
  macroHeroUnit: { fontSize: 9, color: "rgba(255,255,255,0.3)" },
  macroHeroLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.6 },
  macroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.8 },
  macroValue: { fontSize: 11, fontWeight: "800", color: "#fff" },
  macroTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" },
  macroFill: { height: "100%", borderRadius: 99 },
  proteinTag: { backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  proteinTagText: { fontSize: 11, fontWeight: "700", color: "#e8380d" },
  tabBar: { flexDirection: "row", backgroundColor: "#f4f2ed", borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabBtnText: { fontSize: 12, fontWeight: "700", color: "#aaa", textTransform: "capitalize" },
  tabBtnTextActive: { color: "#1a1a1a" },
  ingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  ingRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  ingName: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  ingAmount: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  stepNum: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  stepText: { fontSize: 13, fontWeight: "500", color: "#1a1a1a", lineHeight: 21, flex: 1, paddingTop: 3 },
  tipCard: { backgroundColor: "rgba(124,58,237,0.05)", borderWidth: 1, borderColor: "rgba(124,58,237,0.15)", borderRadius: 16, padding: 14 },
  tipTitle: { fontSize: 12, fontWeight: "700", color: "#e8380d", marginBottom: 4 },
  tipText: { fontSize: 13, color: "#888", lineHeight: 20 },

libCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
libGoalBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#f4f2ed", flexShrink: 0 },
libGoalText: { fontSize: 10, fontWeight: "700", color: "#aaa", textTransform: "capitalize" },
libName: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
libProtein: { fontSize: 10, fontWeight: "700", color: "#1a1a1a" },
libMeta: { fontSize: 10, color: "#aaa" },
libDot: { fontSize: 10, color: "#ccc" },
  catCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 16, overflow: "hidden" },
  catHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  catLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  catCount: { backgroundColor: "rgba(232,56,13,0.1)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 },
  catCountText: { fontSize: 10, fontWeight: "800", color: "#e8380d" },
  catItems: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 12, borderTopWidth: 1, borderTopColor: "#f0ede8" },
  chevron: { fontSize: 18, color: "#ccc" },
  chevronOpen: { transform: [{ rotate: "90deg" }] },
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalBtn: { width: "47%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff" },
  goalBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  goalBtnText: { fontSize: 12, fontWeight: "700", color: "#1a1a1a" },
  mealBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff" },
  mealBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mealBtnText: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  errorText: { fontSize: 12, color: "#e53e3e", fontWeight: "600" },
  generateBtn: { padding: 16, backgroundColor: "#1a1a1a", borderRadius: 14, alignItems: "center" },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#fafaf8" },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 10 },
  pageBtnText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  pageIndicator: { alignItems: "center", justifyContent: "center" },
  pageIndicatorText: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  pageNumBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  pageNumBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  pageNumBtnText: { fontSize: 13, fontWeight: "700", color: "#aaa" },
  pageNumBtnTextActive: { color: "#fff" },
  recipeList: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 18, overflow: "hidden" },
  recipeListRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  recipeListRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  recipeListName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  recipeListProtein: { fontSize: 11, fontWeight: "700", color: "#1a1a1a" },
  recipeListMeta: { fontSize: 11, color: "#aaa" },
  recipeListDot: { fontSize: 11, color: "#ccc" },
  recipeListBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recipeListBadgeText: { fontSize: 9, fontWeight: "700", textTransform: "capitalize", letterSpacing: 0.4 },
  filterIconBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e8e5de", borderRadius: 10 },
  filterIconBtnText: { fontSize: 12, fontWeight: "700", color: "#1a1a1a" },
  allTopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1a1a", paddingVertical: 0 },
  filterBtn2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
  },
  filterBtn2Text: { fontSize: 13, fontWeight: "700", color: "#fff" },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 99,
    backgroundColor: "#e8380d",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  activeChip: {
    paddingHorizontal: 11, paddingVertical: 6,
    backgroundColor: "#1a1a1a",
    borderRadius: 99,
  },
  activeChipText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  sheetSectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.1,
    textTransform: "uppercase", color: "#aaa", marginBottom: 10,
  },
  sheetChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 99, borderWidth: 1.5,
    borderColor: "#e8e5de", backgroundColor: "#fff",
  },
  sheetChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  sheetChipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  sheetChipTextActive: { color: "#fff" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  bottomSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fafaf8", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, maxHeight: "80%", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0ddd6", alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 16 },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff" },
  filterBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  filterBtnText: { fontSize: 12, fontWeight: "700", color: "#1a1a1a" },
  saveBtn: { width: "100%", paddingVertical: 16, backgroundColor: "#1a1a1a", borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fafaf8" },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 10 },
  savedTabBadge: { minWidth: 16, height: 16, borderRadius: 99, backgroundColor: "#e8380d", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  savedTabBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  subToggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#f0ede8",
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  subToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  subToggleBtnActive: {
    backgroundColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  subToggleText: { fontSize: 13, fontWeight: "700", color: "#aaa" },
  subToggleTextActive: { color: "#fff" },
  actionBtnSaved: { borderColor: "rgba(232,56,13,0.3)", backgroundColor: "rgba(232,56,13,0.05)" },
  detailSaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e8e5de",
    borderRadius: 16, padding: 16, marginTop: 4,
  },
  detailSaveBtnSaved: { borderColor: "rgba(232,56,13,0.3)", backgroundColor: "rgba(232,56,13,0.04)" },
  detailSaveBtnIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  detailSaveBtnTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a1a", marginBottom: 2 },
  detailSaveBtnSub: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  savedEmpty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20, gap: 12 },
  savedEmptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  savedEmptyTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.4 },
  savedEmptyDesc: { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center" },
  savedEmptyBtn: { marginTop: 8, paddingHorizontal: 22, paddingVertical: 12, backgroundColor: "#1a1a1a", borderRadius: 12 },
  savedEmptyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

// ── Recipe card styles ──
const rc = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  header: {
    padding: 18,
    paddingBottom: 16,
    gap: 0,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 19,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.6,
    lineHeight: 25,
    marginTop: 10,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
    backgroundColor: "#fafaf8",
  },
  saveRowSaved: { backgroundColor: "rgba(232,56,13,0.04)" },
  saveRowText: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  saveRowTextSaved: { color: "#e8380d" },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emoji: { fontSize: 26 },
  goalPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.4,
  },
  proteinBig: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e8380d",
    letterSpacing: -0.5,
  },
  proteinUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(232,56,13,0.6)",
  },
  proteinLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.2,
    textAlign: "right",
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 3,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: "#f0ede8",
  },
  statVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});