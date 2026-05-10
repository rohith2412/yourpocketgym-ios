/**
 * MealPlanView — orange animated calendar, animated checkboxes, food images with
 * automatic cycling fallback (tries every pool ID until one loads, then caches it).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import foodImageCache from "../src/data/foodImageCache.json";
import { Recipe } from "../src/data/mealPlanRecipes";
import {
  DEFAULT_PREFERENCES,
  MealPlan,
  MealPreferences,
  generateMealPlan,
} from "../src/utils/mealPlanGenerator";
import MealPlanEditPrefs from "./MealPlanEditPrefs";
import MealPlanOnboarding from "./MealPlanOnboarding";
import WeeklyShoppingList from "./WeeklyShoppingList";

// ── Per-user storage keys ─────────────────────────────────────────────────────
function userScopedKeys(uid: string) {
  const p = `mp_${uid}`;
  return { prefs: `${p}_prefs`, plan: `${p}_plan`, completed: `${p}_completed` };
}
const ANON_KEYS = userScopedKeys("anon");

// ── Constants ─────────────────────────────────────────────────────────────────
const TODAY_STR = new Date().toISOString().split("T")[0];
const ORANGE    = "#e8380d";
const INK       = "#0e0e0e";
const MUTED     = "rgba(0,0,0,0.35)";

type DayStatus   = "past" | "today" | "future";
type CompletedMap = Record<string, string[]>;

function getDayStatus(d: string): DayStatus {
  if (d < TODAY_STR) return "past";
  if (d === TODAY_STR) return "today";
  return "future";
}

// ── Image system ──────────────────────────────────────────────────────────────
//
// Resolution order per recipe:
//   1. AsyncStorage / memory cache  (instant on repeat views)
//   2. TheMealDB name search        (dish-matched, e.g. "tacos" → taco photo)
//   3. TheMealDB ingredient search  (e.g. "chicken" → chicken photo)
//   4. Unsplash pool by meal type   (generic but real food photos)
//   5. Emoji tile                   (guaranteed, no network needed)
//
// We always show a pool image immediately as a placeholder, then replace it
// smoothly if a better (name-matched) result comes back from TheMealDB.

// Nationality/style prefixes to strip before searching (too specific for MealDB)
const NATIONALITY_RE =
  /^(Cambodian|Korean|Japanese|Thai|Vietnamese|Indian|Chinese|Mexican|Greek|Italian|Spanish|German|French|Moroccan|Lebanese|Turkish|Israeli|Iranian|Nigerian|Ethiopian|Peruvian|Brazilian|Argentinian|Bangladeshi|Burmese|Samoan|Hawaiian|Filipino|Malaysian|Indonesian|Portuguese|Ukrainian|Czech|Belgian|Dutch|South African|Tanzanian|Chilean|Puerto Rican|Barbadian|American|British|Scottish|Irish|Canadian|Australian)\s+/i;

// Build a ranked list of search queries from a recipe name.
// e.g. "Cambodian Fish Amok" → ["Fish Amok", "Fish", "Amok"]
function getSearchQueries(recipe: Recipe): string[] {
  const stripped = recipe.name.replace(NATIONALITY_RE, "").trim();
  const words    = stripped.split(/\s+/).filter(Boolean);
  // Also try the main ingredient (strip quantities/units)
  const ingRaw   = (recipe.ingredients?.[0] ?? "")
    .replace(/[\d¼½¾⅓⅔\-–]+/g, "")
    .replace(/\b(cup|tbsp|tsp|g|kg|ml|oz|lb|slices?|pieces?|medium|large|small|cans?|bunch|handful|pinch|dash|cloves?|sprigs?|tbsps?)\b/gi, "")
    .trim();
  const ingWord = ingRaw.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");

  return [
    stripped,                       // "Fish Amok"
    words.slice(0, 2).join(" "),    // "Fish Amok" (same if 2 words, shorter if more)
    words[0],                       // "Fish"
    ingWord,                        // "salmon fillet" → "salmon"
  ].filter((q, i, a) => q.length > 1 && a.indexOf(q) === i); // dedupe, skip empty
}

// TheMealDB search — tries queries in order, returns first thumbnail found.
async function searchMealDB(queries: string[]): Promise<string | null> {
  for (const q of queries) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res   = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
        { signal: ctrl.signal },
      );
      clearTimeout(timer);
      if (!res.ok) continue;
      const json  = await res.json();
      const thumb = json?.meals?.[0]?.strMealThumb as string | undefined;
      if (thumb) return thumb;
    } catch { /* try next query */ }
  }
  return null;
}

// Unsplash pool — IDs extracted directly from the recipe dataset (real photos)
const FOOD_IDS: Record<string, string[]> = {
  breakfast: [
    "1484723045596-0b47c9af9d8f","1525351484163-7529414f2098",
    "1567620905732-ae8dbe74a960","1491528323818-fdd9ffd53e4b",
    "1498557850523-fd3d118b962e","1464305795204-6f5bbf4f78f8",
    "1467003909585-2f8a72700288","1488477181823-2c2b0f78b5c2",
    "1505253304499-4fda57f522ef","1510693206981-05ea80f9b2d1",
    "1547592180-85f173990554",  "1603133872878-684f208fb054",
  ],
  lunch: [
    "1504674900247-0877df9cc836","1546069901-ba9599a7e63c",
    "1512621776655-2eb877f14b7c","1547592180-85f173990554",
    "1563805942-f2d5d7d28b43",  "1565299585323-38d6b0865b47",
    "1598511726623-d2e9996ca630","1603133872878-684f208fb054",
  ],
  dinner: [
    "1455619452474-d2be8f1f33ea","1467003909585-2f8a72700288",
    "1504674900247-0877df9cc836","1528207776546-365bb710ee93",
    "1547592180-85f173990554",  "1565299585323-38d6b0865b47",
    "1598511726623-d2e9996ca630","1603133872878-684f208fb054",
  ],
  snack: [
    "1567306226416-28f0efdc88ce","1498557850523-fd3d118b962e",
    "1505253304499-4fda57f522ef","1488477181823-2c2b0f78b5c2",
    "1484723045596-0b47c9af9d8f","1547592180-85f173990554",
    "1553530979-bbd9060f3c3d",  "1565299585323-38d6b0865b47",
  ],
};

function poolUrl(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=75`;
}
function poolFallback(recipe: Recipe): string {
  const pool = FOOD_IDS[recipe.mealType] ?? FOOD_IDS.lunch;
  const seed = recipe.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return poolUrl(pool[seed % pool.length]);
}

// Pre-fetched image cache (generated by scripts/fetchFoodImages.js)
const STATIC_CACHE = foodImageCache as Record<string, string>;

// Memory cache: recipeId → best URL found this session
const IMG_CACHE: Record<string, string> = {};

async function resolveImage(recipe: Recipe): Promise<string> {
  // 1. Memory cache — fastest
  if (IMG_CACHE[recipe.id]) return IMG_CACHE[recipe.id];

  // 2. Static JSON cache baked into the bundle — instant, no network needed
  const staticUrl = STATIC_CACHE[recipe.id];
  if (staticUrl) {
    IMG_CACHE[recipe.id] = staticUrl;
    return staticUrl;
  }

  // 3. AsyncStorage — persisted from a previous session's network lookup
  const storageKey = `foodImg4_${recipe.id}`;
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) { IMG_CACHE[recipe.id] = stored; return stored; }
  } catch {}

  // 4. Use the recipe's baked-in image URL if it looks like a valid remote URL
  if (recipe.image && recipe.image.startsWith("http")) {
    IMG_CACHE[recipe.id] = recipe.image;
    AsyncStorage.setItem(storageKey, recipe.image).catch(() => {});
    return recipe.image;
  }

  // 5. TheMealDB live search (last resort for any recipe without an image)
  const queries = getSearchQueries(recipe);
  const mealdb  = await searchMealDB(queries);
  const url     = mealdb ?? poolFallback(recipe);

  IMG_CACHE[recipe.id] = url;
  AsyncStorage.setItem(storageKey, url).catch(() => {});
  return url;
}

// ── FoodImage component ───────────────────────────────────────────────────────
// Shows the pool image instantly, replaces with TheMealDB match once resolved.
// On load error → try pool cycling → emoji tile.
function FoodImage({
  recipe, style, dim = false,
}: { recipe: Recipe; style: any; dim?: boolean }) {
  // Start with the best available image immediately (memory → static cache → recipe.image → pool fallback)
  const initialUrl = IMG_CACHE[recipe.id] ?? STATIC_CACHE[recipe.id] ?? recipe.image ?? poolFallback(recipe);
  const [src, setSrc]         = useState<string>(initialUrl);
  const [errCount, setErrCount] = useState(0);
  const pool = FOOD_IDS[recipe.mealType] ?? FOOD_IDS.lunch;

  // Async: resolve best image (TheMealDB match) and update if different
  useEffect(() => {
    let alive = true;
    resolveImage(recipe).then((url) => {
      if (alive && url !== src) setSrc(url);
    });
    return () => { alive = false; };
  }, [recipe.id]);

  // On error: cycle through pool until something loads
  const handleError = () => {
    setErrCount((n) => n + 1);
    const nextIdx = errCount % pool.length;
    setSrc(poolUrl(pool[nextIdx]));
  };

  const exhausted = errCount > pool.length;

  if (exhausted) {
    return (
      <View style={[style, { backgroundColor: "rgba(0,0,0,0.06)" }, dim && { opacity: 0.5 }]} />
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={[style, dim && { opacity: 0.5 }]}
      contentFit="cover"
      transition={300}
      cachePolicy="memory-disk"
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      onError={handleError}
    />
  );
}

// ── SVG progress ring ─────────────────────────────────────────────────────────
function ProgressRing({
  progress, size = 36, color = ORANGE,
}: { progress: number; size?: number; color?: string }) {
  const sw   = 3;
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;
  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle cx={cx} cy={cx} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={sw} fill="none" />
      <Circle
        cx={cx} cy={cx} r={r}
        stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(Math.max(progress, 0), 1))}
        strokeLinecap="round"
        rotation={-90} origin={`${cx},${cx}`}
      />
    </Svg>
  );
}

// ── Animated square checkbox ──────────────────────────────────────────────────
function AnimatedCheckbox({ done, onToggle, color = ORANGE }: {
  done: boolean; onToggle: () => void; color?: string;
}) {
  const anim = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: done ? 1 : 0,
      useNativeDriver: false,
      damping: 12, mass: 0.6, stiffness: 220,
    }).start();
  }, [done]);

  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.25, 1] });
  const bg    = anim.interpolate({ inputRange: [0, 1], outputRange: ["#ffffff", color] });
  const border= anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(0,0,0,0.2)", color] });

  return (
    <Pressable onPress={onToggle} hitSlop={10}>
      <Animated.View style={[cb.box, { backgroundColor: bg, borderColor: border }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path
              d="M2.5 7 L5.5 10 L11.5 4"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const cb = StyleSheet.create({
  box: {
    width: 28, height: 28,
    borderRadius: 8, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
});

// ── Week strip ────────────────────────────────────────────────────────────────
function WeekStrip({
  days, selectedIndex, completedMap, onSelect,
}: {
  days: MealPlan["days"];
  selectedIndex: number;
  completedMap: CompletedMap;
  onSelect: (i: number) => void;
}) {
  const [colWidth, setColWidth] = useState(0);
  const pillX    = useRef(new Animated.Value(0)).current;
  const pillOpac = useRef(new Animated.Value(0)).current;

  // Slide the orange pill when selection changes
  useEffect(() => {
    if (colWidth === 0) return;
    Animated.parallel([
      Animated.spring(pillX, {
        toValue: selectedIndex * colWidth,
        useNativeDriver: true,
        damping: 18, stiffness: 260, mass: 0.75,
      }),
      Animated.timing(pillOpac, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [selectedIndex, colWidth]);

  return (
    <View
      style={w.container}
      onLayout={(e) => {
        const cw = e.nativeEvent.layout.width / 7;
        setColWidth(cw);
        pillX.setValue(selectedIndex * cw);
        pillOpac.setValue(1);
      }}
    >
      {/* Sliding orange pill */}
      {colWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            w.pill,
            { width: colWidth - 6, opacity: pillOpac,
              transform: [{ translateX: Animated.add(pillX, 3) }] },
          ]}
        />
      )}

      {days.map((day, i) => {
        const isSelected = i === selectedIndex;
        const status     = getDayStatus(day.date);
        const abbr       = day.label.split(",")[0].slice(0, 3);
        const dateNum    = parseInt(day.date.split("-")[2], 10);
        const doneMeals  = completedMap[day.date] ?? [];
        const total      = day.meals.snack ? 4 : 3;
        const done       = doneMeals.length;
        const allDone    = done >= total && total > 0;
        const progress   = total > 0 ? done / total : 0;

        return (
          <Pressable key={day.date} onPress={() => onSelect(i)} style={w.col}>
            {/* Day abbrev */}
            <Text style={[w.abbr, isSelected && w.abbrSel]}>{abbr}</Text>

            {/* Date circle */}
            <View style={w.circleWrap}>
              {/* Progress ring (only shown when partial) */}
              {done > 0 && !allDone && (
                <ProgressRing progress={progress} size={36} color={isSelected ? "rgba(255,255,255,0.9)" : ORANGE} />
              )}
              {allDone && (
                <ProgressRing progress={1} size={36} color={isSelected ? "rgba(255,255,255,0.9)" : ORANGE} />
              )}

              <View style={[
                w.circle,
                isSelected && w.circleSel,
                allDone && w.circleDone,
              ]}>
                <Text style={[
                  w.dateNum,
                  isSelected && w.dateNumSel,
                  allDone && w.dateNumDone,
                ]}>
                  {dateNum}
                </Text>
              </View>

              {/* Today dot */}
              {status === "today" && !isSelected && (
                <View style={w.todayDot} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────
function MealCard({
  label, recipe, done, onToggle, onPress,
}: {
  label: string; recipe: Recipe; done: boolean;
  onToggle: () => void; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[c.card, done && c.cardDone]}>
      {/* Food image */}
      <View style={c.thumbWrap}>
        <FoodImage recipe={recipe} style={c.thumb} dim={done} />
      </View>

      <View style={c.inner}>
        {/* Top row: meal type badge + checkbox */}
        <View style={c.topRow}>
          <View style={c.badge}>
            <Text style={c.badgeText}>{label.toUpperCase()}</Text>
          </View>
          <AnimatedCheckbox done={done} onToggle={onToggle} color={ORANGE} />
        </View>

        {/* Recipe name */}
        <Text style={[c.name, done && c.nameDone]} numberOfLines={2}>
          {recipe.name}
        </Text>

        {/* Macro row */}
        <View style={c.macroRow}>
          <View style={c.macroPillAccent}>
            <Text style={c.macroValAccent}>{recipe.calories}</Text>
            <Text style={c.macroLbl}>cal</Text>
          </View>
          <View style={c.macroPill}>
            <Text style={c.macroVal}>{recipe.protein}g</Text>
            <Text style={c.macroLbl}>prot</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={c.prepTime}>{recipe.prepTime} min</Text>
          <Text style={c.arrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Recipe detail modal ───────────────────────────────────────────────────────
function RecipeModal({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  if (!recipe) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={mo.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero image */}
        <View style={mo.heroWrap}>
          <FoodImage recipe={recipe} style={mo.hero} />
          <Pressable onPress={onClose} style={mo.closeBtn}>
            <Text style={mo.closeText}>×</Text>
          </Pressable>
        </View>

        <View style={mo.body}>
          <Text style={mo.tag}>{recipe.prepTime} min · {recipe.cuisine}</Text>
          <Text style={mo.title}>{recipe.name}</Text>

          {/* Macro pills — single neutral style, accent only on calories */}
          <View style={mo.macroRow}>
            {[
              { label: "Calories", val: `${recipe.calories}`, accent: true },
              { label: "Protein",  val: `${recipe.protein}g`, accent: false },
              { label: "Carbs",    val: `${recipe.carbs}g`,   accent: false },
              { label: "Fat",      val: `${recipe.fat}g`,     accent: false },
            ].map((m) => (
              <View key={m.label} style={[mo.macroPill, m.accent && mo.macroPillAccent]}>
                <Text style={[mo.macroVal, m.accent && mo.macroValAccent]}>{m.val}</Text>
                <Text style={mo.macroLbl}>{m.label}</Text>
              </View>
            ))}
          </View>

          <Text style={mo.sectionHead}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <Text key={i} style={mo.ingItem}>· {ing}</Text>
          ))}

          <Text style={mo.sectionHead}>Instructions</Text>
          {recipe.instructions.map((step, i) => (
            <View key={i} style={mo.stepRow}>
              <View style={mo.stepNum}>
                <Text style={mo.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={mo.stepText}>{step}</Text>
            </View>
          ))}

          <View style={mo.tagRow}>
            {recipe.tags.map((t) => (
              <View key={t} style={mo.tagChip}>
                <Text style={mo.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MealPlanView({ enabled = true }: { enabled?: boolean }) {
  const [plan,           setPlan]           = useState<MealPlan | null>(null);
  const [preferences,    setPreferences]    = useState<MealPreferences | null>(null);
  const [showOnboard,    setShowOnboard]    = useState(false);
  const [showEditPrefs,    setShowEditPrefs]    = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [selectedIndex,  setSelectedIndex]  = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [completed,      setCompleted]      = useState<CompletedMap>({});
  const [keys, setKeys] = useState<ReturnType<typeof userScopedKeys> | null>(null);

  const defaultIndex = useMemo(() => {
    if (!plan) return 0;
    const idx = plan.days.findIndex((d) => d.date === TODAY_STR);
    return idx >= 0 ? idx : 0;
  }, [plan]);

  useEffect(() => { setSelectedIndex(defaultIndex); }, [defaultIndex]);

  // Step 1 — resolve user-scoped keys
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const uid = raw ? (JSON.parse(raw)?._id ?? JSON.parse(raw)?.id ?? "anon") : "anon";
        setKeys(userScopedKeys(uid));
      } catch { setKeys(ANON_KEYS); }
    })();
  }, []);

  // Step 2 — load data once keys ready
  useEffect(() => {
    if (!keys) return;
    (async () => {
      try {
        const [rawPrefs, rawPlan, rawDone] = await Promise.all([
          AsyncStorage.getItem(keys.prefs),
          AsyncStorage.getItem(keys.plan),
          AsyncStorage.getItem(keys.completed),
        ]);
        setPreferences(rawPrefs ? JSON.parse(rawPrefs) : null);
        setPlan(rawPlan ? JSON.parse(rawPlan) : null);
        setCompleted(rawDone ? JSON.parse(rawDone) : {});
        setShowOnboard(enabled && !rawPrefs);
      } finally { setLoading(false); }
    })();
  }, [keys]);

  const saveAndSetPlan = useCallback(async (p: MealPlan) => {
    if (!keys) return;
    await AsyncStorage.setItem(keys.plan, JSON.stringify(p));
    setPlan(p);
  }, [keys]);

  const toggleMeal = useCallback(async (date: string, mealKey: string) => {
    if (!keys) return;
    setCompleted((prev) => {
      const dayDone   = prev[date] ?? [];
      const alreadyDone = dayDone.includes(mealKey);
      const updated: CompletedMap = {
        ...prev,
        [date]: alreadyDone ? dayDone.filter((k) => k !== mealKey) : [...dayDone, mealKey],
      };
      AsyncStorage.setItem(keys.completed, JSON.stringify(updated));
      return updated;
    });
  }, [keys]);

  const handleComplete = useCallback(async (prefs: MealPreferences) => {
    if (!keys) return;
    setShowOnboard(false); setLoading(true);
    await AsyncStorage.setItem(keys.prefs, JSON.stringify(prefs));
    setPreferences(prefs);
    await saveAndSetPlan(generateMealPlan(prefs, "week"));
    setLoading(false);
  }, [keys, saveAndSetPlan]);

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    await saveAndSetPlan(generateMealPlan(preferences ?? DEFAULT_PREFERENCES, "week"));
    setLoading(false);
  }, [preferences, saveAndSetPlan]);

  const handleReset = useCallback(async () => {
    if (!keys) return;
    await AsyncStorage.multiRemove([keys.prefs, keys.plan, keys.completed]);
    setPlan(null); setPreferences(null); setCompleted({}); setShowOnboard(true);
  }, [keys]);

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (showOnboard) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <MealPlanOnboarding
          onComplete={handleComplete}
          onSkip={async () => {
            setShowOnboard(false);
            if (!plan) {
              setLoading(true);
              await saveAndSetPlan(generateMealPlan(DEFAULT_PREFERENCES, "week"));
              setLoading(false);
            }
          }}
        />
      </Modal>
    );
  }

  if (loading) {
    return (
      <View style={m.center}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={m.loadingText}>Building your plan…</Text>
      </View>
    );
  }

  const today     = plan?.days[selectedIndex];
  const todayDate = today?.date ?? "";
  const doneMeals = completed[todayDate] ?? [];
  const totalMeals = today?.meals.snack ? 4 : 3;

  return (
    <View style={m.root}>

      {/* ── Week strip ── */}
      {plan && (
        <WeekStrip
          days={plan.days}
          selectedIndex={selectedIndex}
          completedMap={completed}
          onSelect={setSelectedIndex}
        />
      )}

      <ScrollView contentContainerStyle={m.listContent} showsVerticalScrollIndicator={false}>

        {today && (
          <>
            {/* ── Day header ── */}
            <View style={m.dayHeader}>
              <View>
                <Text style={m.dayTitle}>{today.label}</Text>
                <Text style={m.daySub}>
                  {today.meals.totalCalories} cal · {today.meals.totalProtein}g protein
                </Text>
              </View>
              {/* Progress badge */}
              <View style={[
                m.progressBadge,
                doneMeals.length === totalMeals && m.progressBadgeDone,
              ]}>
                <Text style={[
                  m.progressNum,
                  doneMeals.length === totalMeals && m.progressNumDone,
                ]}>
                  {doneMeals.length}/{totalMeals}
                </Text>
                <Text style={[
                  m.progressLbl,
                  doneMeals.length === totalMeals && m.progressLblDone,
                ]}>done</Text>
              </View>
            </View>

            {/* ── Meal cards ── */}
            {(
              [
                { key: "breakfast", label: "Breakfast", recipe: today.meals.breakfast },
                { key: "lunch",     label: "Lunch",     recipe: today.meals.lunch },
                { key: "dinner",    label: "Dinner",    recipe: today.meals.dinner },
                ...(today.meals.snack
                  ? [{ key: "snack", label: "Snack", recipe: today.meals.snack as Recipe }]
                  : []),
              ] as { key: string; label: string; recipe: Recipe }[]
            ).map(({ key, label, recipe }) => (
              <MealCard
                key={key}
                label={label}
                recipe={recipe}
                done={doneMeals.includes(key)}
                onToggle={() => toggleMeal(todayDate, key)}
                onPress={() => setSelectedRecipe(recipe)}
              />
            ))}
          </>
        )}

        {/* ── Controls ── */}
        <View style={m.controlRow}>
          <Pressable onPress={handleRegenerate} style={m.regenBtn}>
            <Text style={m.regenText}>↻  Regenerate</Text>
          </Pressable>
          <Pressable onPress={() => setShowEditPrefs(true)} style={m.editBtn}>
            <Text style={m.editText}>Edit prefs</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleReset} style={m.resetBtn}>
          <Text style={m.resetText}>Reset preferences</Text>
        </Pressable>
      </ScrollView>

      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />

      {/* Floating cart button */}
      {plan && keys && (
        <Pressable
          onPress={() => setShowShoppingList(true)}
          style={m.cartFab}
        >
          <Text style={m.cartFabIcon}>🛒</Text>
        </Pressable>
      )}

      {/* Shopping list modal */}
      {plan && keys && (
        <WeeklyShoppingList
          visible={showShoppingList}
          onClose={() => setShowShoppingList(false)}
          plan={plan}
          storageKey={`${keys.prefs}_shop`}
        />
      )}

      {/* Edit preferences — simple form, not the multi-step intro */}
      <MealPlanEditPrefs
        visible={showEditPrefs}
        initial={preferences ?? DEFAULT_PREFERENCES}
        onSave={async (newPrefs) => {
          setShowEditPrefs(false);
          setLoading(true);
          if (keys) await AsyncStorage.setItem(keys.prefs, JSON.stringify(newPrefs));
          setPreferences(newPrefs);
          await saveAndSetPlan(generateMealPlan(newPrefs, "week"));
          setLoading(false);
        }}
        onClose={() => setShowEditPrefs(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

// Week strip
const w = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
    overflow: "hidden",
  },
  // Animated sliding orange pill
  pill: {
    position: "absolute",
    top: 7, bottom: 7,
    borderRadius: 20,
    backgroundColor: ORANGE,
  },
  col: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  abbr: {
    fontSize: 11, fontWeight: "600",
    color: "rgba(0,0,0,0.3)", letterSpacing: 0.2,
  },
  abbrSel: { color: "#fff", fontWeight: "800" },

  circleWrap: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  circle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  circleSel:  { /* no extra bg — pill behind it */ },
  circleDone: { /* progress ring handles it */ },
  dateNum: {
    fontSize: 13, fontWeight: "700", color: INK,
  },
  dateNumSel:  { color: "#fff" },
  dateNumDone: { fontSize: 11, fontWeight: "900", color: ORANGE },

  todayDot: {
    position: "absolute",
    bottom: -1,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: ORANGE,
  },
});

// Meal card
const c = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingRight: 16,
    paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
    overflow: "hidden",
  },
  cardDone: {
    backgroundColor: "#fafaf8",
    borderColor: "rgba(0,0,0,0.03)",
  },
  thumbWrap: {
    width: 88,
    height: 96,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 14,
  },
  thumb: {
    width: 88,
    height: 96,
  },
  inner: {
    flex: 1,
    paddingLeft: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  badgeText: {
    fontSize: 10, fontWeight: "800",
    color: "rgba(0,0,0,0.4)",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 16, fontWeight: "700",
    color: INK, lineHeight: 21,
    letterSpacing: -0.3,
  },
  nameDone: {
    color: "rgba(0,0,0,0.28)",
    textDecorationLine: "line-through",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  macroPillAccent: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: `${ORANGE}14`,
    borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  macroValAccent: {
    fontSize: 11, fontWeight: "800", color: ORANGE,
  },
  macroPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  macroVal: {
    fontSize: 11, fontWeight: "700", color: INK,
  },
  macroLbl: {
    fontSize: 9, fontWeight: "500",
    color: "rgba(0,0,0,0.32)",
  },
  prepTime: {
    fontSize: 11, color: "rgba(0,0,0,0.28)",
    fontWeight: "500",
  },
  arrow: {
    fontSize: 20, color: "rgba(0,0,0,0.13)",
    marginLeft: 2,
  },
});

// Recipe modal
const mo = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  heroWrap: { width: "100%", height: 260 },
  hero:     { width: "100%", height: 260 },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18, fontWeight: "300", lineHeight: 20 },
  body: { padding: 24, gap: 4 },
  tag: {
    fontSize: 11, fontWeight: "600",
    color: MUTED, letterSpacing: 0.5,
    textTransform: "uppercase", marginBottom: 4,
  },
  title: {
    fontSize: 26, fontWeight: "800",
    color: INK, letterSpacing: -0.5, marginBottom: 16,
  },
  macroRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  macroPill: {
    flex: 1, borderRadius: 18,
    paddingVertical: 12, alignItems: "center", gap: 2,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  macroPillAccent: {
    backgroundColor: `${ORANGE}12`,
  },
  macroVal:  { fontSize: 14, fontWeight: "800", color: INK },
  macroValAccent: { color: ORANGE },
  macroLbl:  { fontSize: 10, fontWeight: "600", color: MUTED },
  sectionHead: {
    fontSize: 11, fontWeight: "700", color: MUTED,
    letterSpacing: 0.5, textTransform: "uppercase",
    marginTop: 20, marginBottom: 10,
  },
  ingItem: { fontSize: 14, color: INK, lineHeight: 26 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    backgroundColor: ORANGE,
  },
  stepNumText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  stepText: { flex: 1, fontSize: 14, color: INK, lineHeight: 22 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  tagChip: {
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tagText: { fontSize: 11, fontWeight: "600", color: "rgba(0,0,0,0.5)" },
});

// Main
const m = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f7f7f5" },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: MUTED, fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120, gap: 12 },

  dayHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cartFab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: INK,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  cartFabIcon: { fontSize: 22 },
  dayTitle: {
    fontSize: 20, fontWeight: "800",
    color: INK, letterSpacing: -0.5,
  },
  daySub: {
    fontSize: 12, color: MUTED,
    fontWeight: "500", marginTop: 3,
  },
  progressBadge: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  progressBadgeDone: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  progressNum: {
    fontSize: 15, fontWeight: "800", color: INK, lineHeight: 18,
  },
  progressNumDone: { color: "#fff" },
  progressLbl: {
    fontSize: 9, fontWeight: "600",
    color: MUTED,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  progressLblDone: { color: "rgba(255,255,255,0.85)" },

  controlRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  regenBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 22,
    backgroundColor: ORANGE, alignItems: "center",
    shadowColor: ORANGE, shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  regenText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  editBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 22,
    backgroundColor: "#fff", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.07)",
  },
  editText: { fontSize: 13, fontWeight: "700", color: INK },
  resetBtn: { alignItems: "center", paddingVertical: 12 },
  resetText: { fontSize: 12, color: "rgba(0,0,0,0.2)", fontWeight: "500" },
});
