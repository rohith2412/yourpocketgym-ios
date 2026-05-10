/**
 * WeeklyShoppingList — modal popup with all ingredients for the week,
 * grouped by category, with tap-to-check-off support.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MealPlan } from "../src/utils/mealPlanGenerator";

const ORANGE = "#e8380d";
const INK    = "#0e0e0e";
const MUTED  = "rgba(0,0,0,0.38)";
const SEP    = "rgba(0,0,0,0.07)";

// ── Ingredient parsing ────────────────────────────────────────────────────────

// Step 1 — strip leading numbers & fractions
const QTY_RE  = /^[\d¼½¾⅓⅔\s\/\-.]+/;
// Step 2 — strip units
const UNIT_RE = /^(cups?|tbsps?|tsps?|g|kg|ml|l|oz|lbs?|slices?|pieces?|strips?|sheets?|medium|large|small|cans?|bunch|bunches|handful|pinch|dash|cloves?|sprigs?|fillets?|heads?|stalks?|portions?|servings?|boxes?|packets?|jars?)\s+/i;
// Step 3 — strip descriptors/adjectives
const DESC_RE = /\b(whole|skim|low.fat|full.fat|reduced.fat|fresh|frozen|dried|ground|chopped|diced|sliced|minced|cooked|raw|plain|unsalted|salted|extra|virgin|optional|boneless|skinless|shredded|grated|crushed|roasted|toasted|boiled|steamed|ripe|sweet|baby|large|small|medium)\b/gi;

function normalise(raw: string): string {
  return raw
    .trim()
    .replace(/^optional[:\s]*/i, "")   // strip "optional:"
    .replace(/\bor\s+\w+(\s+\w+)*/gi, "") // strip "or water", "or homemade pasta" etc.
    .replace(QTY_RE, "")
    .replace(UNIT_RE, "")
    .replace(UNIT_RE, "")              // run twice — "1.5 cups whole milk"
    .replace(DESC_RE, "")
    .replace(/\(.*?\)/g, "")          // remove parentheticals
    .replace(/,.*$/, "")              // cut after comma
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();
}

// Capitalize first letter of each word for display
function toTitle(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function categorise(item: string): string {
  const s = item.toLowerCase();
  if (/chicken|beef|pork|lamb|turkey|salmon|tuna|shrimp|fish|bacon|sausage|egg|tofu|tempeh|mince|steak/.test(s)) return "🥩  Meat & Protein";
  if (/milk|yogurt|cheese|butter|cream|ghee|curd/.test(s))                                                       return "🧀  Dairy";
  if (/rice|pasta|bread|flour|oat|noodle|tortilla|roti|naan|couscous|quinoa|semolina|lentil|dal|bean|chickpea/.test(s)) return "🌾  Grains & Legumes";
  if (/onion|garlic|tomato|potato|carrot|pepper|spinach|broccoli|lettuce|cabbage|mushroom|zucchini|cucumber|celery|kale|pea|corn|ginger|chilli|chili|capsicum|eggplant|leek/.test(s)) return "🥦  Vegetables";
  if (/apple|banana|lemon|lime|orange|mango|berry|grape|pineapple|avocado|coconut/.test(s))                       return "🍋  Fruit";
  if (/almond|walnut|peanut|cashew|pistachio|seed|tahini|nut/.test(s))                                            return "🥜  Nuts & Seeds";
  if (/oil|vinegar|soy sauce|fish sauce|oyster|hoisin|sriracha|hot sauce|ketchup|mayo|mustard|honey|maple|paste|stock|broth|sauce|seasoning|spice|cumin|turmeric|paprika|coriander|curry|masala|salt|pepper|herb|basil|oregano|thyme|rosemary|bay|parsley|mint|dill/.test(s)) return "🫙  Pantry & Spices";
  return "📦  Other";
}

const CATEGORY_ORDER = [
  "🥩  Meat & Protein",
  "🧀  Dairy",
  "🌾  Grains & Legumes",
  "🥦  Vegetables",
  "🍋  Fruit",
  "🥜  Nuts & Seeds",
  "🫙  Pantry & Spices",
  "📦  Other",
];

interface ShopItem { id: string; label: string; category: string; }

function buildList(plan: MealPlan): ShopItem[] {
  const ids = new Set<string>();

  for (const day of plan.days) {
    const meals = [day.meals.breakfast, day.meals.lunch, day.meals.dinner, ...(day.meals.snack ? [day.meals.snack] : [])];
    for (const meal of meals) {
      for (const raw of meal.ingredients) {
        const id = normalise(raw);
        if (id.length < 2) continue;
        ids.add(id);
      }
    }
  }

  // Deduplicate substrings: if "chicken thighs" and "chicken" both exist, keep "chicken" only
  const deduped = [...ids].filter((id) => {
    // Keep this id only if no shorter id is a substring of it
    return ![...ids].some((other) => other !== id && id.includes(other) && other.length >= 3);
  });

  return deduped
    .map((id) => ({ id, label: toTitle(id), category: categorise(id) }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.label.localeCompare(b.label));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  plan: MealPlan;
  storageKey: string;
}

export default function WeeklyShoppingList({ visible, onClose, plan, storageKey }: Props) {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items = useMemo(() => buildList(plan), [plan]);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(storageKey).then((raw) => {
        if (raw) setChecked(new Set(JSON.parse(raw)));
      });
    }
  }, [visible, storageKey]);

  const persist = (next: Set<string>) =>
    AsyncStorage.setItem(storageKey, JSON.stringify([...next])).catch(() => {});

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persist(next);
      return next;
    });
  };

  const clearChecked = () => { setChecked(new Set()); persist(new Set()); };

  const sections = useMemo(() => {
    const cats: Record<string, ShopItem[]> = {};
    for (const item of items) (cats[item.category] ??= []).push(item);
    return CATEGORY_ORDER.filter((c) => cats[c]?.length).map((c) => ({ title: c, data: cats[c] }));
  }, [items]);

  const doneCount   = items.filter((i) => checked.has(i.id)).length;
  const pendingCount = items.length - doneCount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.root, { paddingTop: insets.top || 16 }]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Shopping List</Text>
            <Text style={s.sub}>
              {pendingCount > 0 ? `${pendingCount} remaining` : "All done ✓"}
              {"  ·  "}{items.length} items total
            </Text>
          </View>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* ── Progress bar ── */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${items.length ? (doneCount / items.length) * 100 : 0}%` as any }]} />
        </View>

        {/* ── List ── */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 24 }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const done = checked.has(item.id);
            const isLast = index === section.data.length - 1;
            return (
              <Pressable
                onPress={() => toggleItem(item.id)}
                style={({ pressed }) => [s.row, pressed && s.rowPressed, !isLast && s.rowBorder]}
              >
                <View style={[s.circle, done && s.circleDone]}>
                  {done && <Text style={s.tick}>✓</Text>}
                </View>
                <Text style={[s.itemText, done && s.itemDone]} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
          renderSectionFooter={() => <View style={{ height: 8 }} />}
          ListFooterComponent={
            doneCount > 0 ? (
              <Pressable onPress={clearChecked} style={s.clearBtn}>
                <Text style={s.clearText}>Clear {doneCount} checked item{doneCount !== 1 ? "s" : ""}</Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f7f5" },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
  },
  title: { fontSize: 26, fontWeight: "800", color: INK, letterSpacing: -0.5 },
  sub:   { fontSize: 13, color: MUTED, marginTop: 3, fontWeight: "500" },
  closeBtn: {
    backgroundColor: INK, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8, marginTop: 4,
  },
  closeText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  progressTrack: {
    height: 3, backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 20, borderRadius: 2, marginBottom: 16,
  },
  progressFill: {
    height: 3, backgroundColor: ORANGE, borderRadius: 2,
  },

  listContent: { paddingHorizontal: 16 },

  sectionHeader: {
    fontSize: 11, fontWeight: "700",
    color: MUTED, letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 20, marginBottom: 6,
    marginLeft: 2,
  },

  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 15,
    gap: 14,
  },
  rowPressed: { backgroundColor: "#f5f3ef" },
  rowBorder:  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEP },

  circle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.15)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  circleDone: { backgroundColor: ORANGE, borderColor: ORANGE },
  tick:       { fontSize: 10, color: "#fff", fontWeight: "800" },

  itemText: { flex: 1, fontSize: 16, color: INK, fontWeight: "500" },
  itemDone: { color: "rgba(0,0,0,0.22)", textDecorationLine: "line-through" },

  clearBtn: {
    alignSelf: "center", marginTop: 20,
    paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 22, backgroundColor: "rgba(0,0,0,0.06)",
  },
  clearText: { fontSize: 13, fontWeight: "600", color: MUTED },
});
