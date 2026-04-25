import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageBackground from "@/components/PageBackground";
import PremiumGate from "@/components/PremiumGate";
import { useSubscription } from "@/src/hooks/useSubscription";
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
///* Right: food image */} LibraryCard
const BASE_URL = "https://yourpocketgym.com";
//e.g.
const GOALS = [
  { key: "muscle gain", emoji: "", label: "Muscle Gain", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  { key: "fat loss", emoji: "", label: "Fat Loss", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  { key: "maintenance", emoji: "", label: "Maintenance", color: "#888", bg: "#f4f2ed" },
  { key: "weight gain", emoji: "", label: "Weight Gain", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
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
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("");
  useEffect(() => {
    AsyncStorage.multiGet(["token", "user"]).then(([[, t], [, raw]]) => {
      if (t) setToken(t);
      if (raw) {
        try { setUserName(JSON.parse(raw).name?.split(" ")[0] ?? ""); } catch {}
      }
    });
  }, []);
  return { token, userName };
}

function fmt(n) { return Math.round(n ?? 0); }
function totalTime(r) { return (r.prepTime || 0) + (r.cookTime || 0); }
function goalMeta(key) { return GOALS.find((g) => g.key === key) || { color: "#aaa", bg: "#f4f2ed" }; }

function Label({ children, style }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, selected && s.chipActive]}>
      <Text style={[s.chipText, selected && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MacroBar({ label, value, max, color, unit = "g" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
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

function RecipeDetail({ recipe, onBack, onRegenerate, isGenerating }) {
  const [tab, setTab] = useState("ingredients");
  const meta = goalMeta(recipe.goal);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 32 }}>
      <View style={s.actionRow}>
        <TouchableOpacity onPress={onBack} style={s.actionBtn}>
          <Text style={s.actionBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegenerate} disabled={isGenerating} style={[s.actionBtn, { opacity: isGenerating ? 0.5 : 1 }]}>
          <Text style={[s.actionBtnText, { color: "#111112" }]}>{isGenerating ? "Finding…" : "Try another"}</Text>
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
              <Text style={s.calorieNum}>{fmt(recipe.macros?.calories)}<Text style={s.calorieUnit}> kcal</Text></Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {[
                { label: "Protein", val: recipe.macros?.protein, color: "#7c3aed" },
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
            {recipe.proteinSources.map((src, i) => (
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
          {recipe.ingredients?.map((ing, i) => (
            <View key={i} style={[s.ingRow, i < recipe.ingredients.length - 1 && s.ingRowBorder]}>
              <Text style={s.ingName}>{ing.item}</Text>
              <Text style={s.ingAmount}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {tab === "steps" && (
        <View style={{ gap: 8 }}>
          {recipe.steps?.map((step, i) => (
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
    </ScrollView>
  );
}
//
function LibraryCard({ recipe, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.libCard} activeOpacity={0.8}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.libName} numberOfLines={1}>{recipe.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
          <Text style={s.libProtein}>{fmt(recipe.macros?.protein)}g protein</Text>
          <Text style={s.libDot}>·</Text>
          <Text style={s.libMeta}>{fmt(recipe.macros?.calories)} kcal</Text>
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

function FilterModal({ visible, libGoal, libMeal, onGoalChange, onMealChange, onClose }) {
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

export default function useA() {
  const { token, userName } = useAuth();
  const { isPremium } = useSubscription();

  const [mainTab, setMainTab] = useState("find");
  const [selected, setSelected] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [openCat, setOpenCat] = useState(null);
  const [goal, setGoal] = useState(null);
  const [mealType, setMealType] = useState(null);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [libRecipes, setLibRecipes] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libGoal, setLibGoal] = useState("");
  const [libMeal, setLibMeal] = useState("");
  const [libPage, setLibPage] = useState(1);
  const [libPages, setLibPages] = useState(1);
  const [libTotal, setLibTotal] = useState(0);
  const [selected2, setSelected2] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const isShowingDetail = recipe || selected2;

  function toggleIngredient(item) {
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fetchLibrary = useCallback(async (page = 1) => {
    setLibLoading(true);
    try {
      // Fetch seed data from GitHub
      const res = await fetch("https://raw.githubusercontent.com/rohith2412/recipes_seed/main/recipes_seed.json");
      const all = await res.json();
      const filtered = all.filter((r) => {
        if (libGoal && r.goal !== libGoal) return false;
        if (libMeal && r.mealType !== libMeal) return false;
        return true;
      });
      const limit = 12;
      const total = filtered.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      setLibRecipes(filtered.slice(start, start + limit));
      setLibTotal(total);
      setLibPages(pages);
      setLibPage(page);
    } finally {
      setLibLoading(false);
    }
  }, [libGoal, libMeal]);

  useEffect(() => {
    if (mainTab === "library") fetchLibrary(1);
  }, [mainTab, libGoal, libMeal, fetchLibrary]);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  return (
    <PremiumGate isUserPremium={isPremium} featureName="Recipes">
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
            {[["find", "Find"], ["library", "Library"]].map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setMainTab(key)} style={s.mainTab}>
                <Text style={[s.mainTabText, mainTab === key && s.mainTabTextActive]}>{label}</Text>
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

                {/* Selected chips inside dark card */}
                {selected.length > 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                      {selected.map((item) => (
                        <TouchableOpacity key={item} onPress={() => toggleIngredient(item)} style={s.darkChip}>
                          <Text style={s.darkChipText}>{item} <Text style={{ opacity: 0.4, fontSize: 9 }}>✕</Text></Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => setSelected([])} style={s.darkClearBtn}>
                      <Text style={s.darkClearBtnText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                )}
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

        {/* ─── Library Tab ─── */}
        {!isShowingDetail && mainTab === "library" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 10 }}
          >
            {libLoading ? (
              <View style={{ gap: 8 }}>
                {[72, 72, 72, 72, 72].map((h, i) => <View key={i} style={[s.skeleton, { height: h }]} />)}
              </View>
            ) : libRecipes.length === 0 ? (
              <View style={[s.card, { alignItems: "center", padding: 40 }]}>
                <Text style={s.emptyTitle}>No recipes yet</Text>
                <Text style={s.emptyDesc}>Generate recipes from the Find tab to build your library.</Text>
              </View>
            ) : (
              libRecipes.map((r) => <LibraryCard key={r._id} recipe={r} onPress={() => setSelected2(r)} />)
            )}

            {libPages > 1 && (
              <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 4 }}>
                <TouchableOpacity onPress={() => fetchLibrary(libPage - 1)} disabled={libPage <= 1} style={[s.pageBtn, libPage <= 1 && { opacity: 0.4 }]}>
                  <Text style={s.pageBtnText}>← Prev</Text>
                </TouchableOpacity>
                <View style={s.pageIndicator}>
                  <Text style={s.pageIndicatorText}>{libPage} / {libPages}</Text>
                </View>
                <TouchableOpacity onPress={() => fetchLibrary(libPage + 1)} disabled={libPage >= libPages} style={[s.pageBtn, libPage >= libPages && { opacity: 0.4 }]}>
                  <Text style={s.pageBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <FilterModal
        visible={showFilter}
        libGoal={libGoal}
        libMeal={libMeal}
        onGoalChange={setLibGoal}
        onMealChange={setLibMeal}
        onClose={() => setShowFilter(false)}
      />
      </SafeAreaView>
    </PremiumGate>
  );
}
//libCard
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafaf8" },
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
  proteinTagText: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },
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
  tipTitle: { fontSize: 12, fontWeight: "700", color: "#7c3aed", marginBottom: 4 },
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
  catCount: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 },
  catCountText: { fontSize: 10, fontWeight: "800", color: "#7c3aed" },
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
});