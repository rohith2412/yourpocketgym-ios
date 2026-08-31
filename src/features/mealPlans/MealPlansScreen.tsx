import { useEffect, useState } from "react";
import { View, Pressable, ScrollView, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import {
  ALL_DIET_TAGS,
  buildGroceryList,
  generatePlan,
  swapSlot,
  type DietaryTag,
  type GroceryItem,
} from "./generator";
import type { Goal, MealType, Plan, PlanDay, Recipe } from "./types";
import { useGoals, useAddFood } from "../nutrition/hooks";
import { DEFAULT_GOALS, toISODay, type FoodEntry } from "../nutrition/storage";
import { loadPlan, savePlan } from "./storage";

const GOALS: { key: Goal; label: string; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  { key: "fat loss", label: "Fat loss", icon: "flame-outline", tint: "#EF4444" },
  { key: "muscle gain", label: "Muscle gain", icon: "barbell-outline", tint: "#22C55E" },
  { key: "maintenance", label: "Maintain", icon: "scale-outline", tint: "#38BDF8" },
];

const DAY_OPTIONS = [3, 5, 7];

const ACCENT = "#22C55E";

export default function MealPlansScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [goal, setGoal] = useState<Goal>("muscle gain");
  const [days, setDays] = useState(3);
  const [snack, setSnack] = useState(true);
  const [diet, setDiet] = useState<DietaryTag[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [expanded, setExpanded] = useState<Recipe | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);

  const { data: g } = useGoals();
  const nutritionGoal = g ?? DEFAULT_GOALS;
  const targetCal = nutritionGoal.calories;

  // Hydrate saved plan on mount
  useEffect(() => {
    loadPlan().then((p) => {
      if (p) {
        setPlan(p);
        setGoal(p.goal);
        setDays(p.days.length);
        setSnack(!!p.days[0]?.snack);
      }
    });
  }, []);

  // Persist any plan change
  useEffect(() => {
    if (plan) savePlan(plan).catch(() => {});
  }, [plan]);

  const build = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlan(generatePlan(goal, days, snack, diet));
  };

  const swap = (dayIdx: number, slot: MealType) => {
    if (!plan) return;
    Haptics.selectionAsync().catch(() => {});
    setPlan(swapSlot(plan, dayIdx, slot, diet));
  };

  const toggleDiet = (tag: DietaryTag) => {
    setDiet((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.lg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            Pro
          </Text>
          <Text variant="title">Meal plans</Text>
        </View>
        {plan ? (
          <Pressable
            onPress={() => setShowGrocery(true)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.surfaceAlt : c.surface,
              borderWidth: 1,
              borderColor: c.border,
            })}
          >
            <Ionicons name="basket-outline" size={18} color={c.text} />
          </Pressable>
        ) : null}
      </View>

      {/* Goal picker */}
      <Section label="GOAL">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {GOALS.map((g) => {
            const active = g.key === goal;
            return (
              <Pressable
                key={g.key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setGoal(g.key);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: theme.radius.lg,
                  backgroundColor: active ? c.surfaceAlt : "transparent",
                  borderWidth: 1,
                  borderColor: active ? g.tint : c.border,
                  alignItems: "center",
                  gap: 6,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name={g.icon} size={20} color={g.tint} />
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: active ? c.text : c.textMuted, fontSize: 12 }}
                >
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Days */}
      <Section label="DAYS">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DAY_OPTIONS.map((d) => {
            const active = d === days;
            return (
              <Pressable
                key={d}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setDays(d);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: theme.radius.lg,
                  backgroundColor: active ? c.surfaceAlt : "transparent",
                  borderWidth: 1,
                  borderColor: active ? c.text : c.border,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  variant="body"
                  weight="bold"
                  style={{ color: active ? c.text : c.textMuted }}
                >
                  {d} days
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Dietary filters */}
      <Section label="DIETARY">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ALL_DIET_TAGS.map((tag) => {
            const active = diet.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  toggleDiet(tag);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: active ? c.surfaceAlt : "transparent",
                  borderWidth: 1,
                  borderColor: active ? c.text : c.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  style={{ color: active ? c.text : c.textMuted, fontSize: 11 }}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Snack toggle */}
      <Pressable
        onPress={() => setSnack((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: snack ? ACCENT : c.border,
            backgroundColor: snack ? ACCENT : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {snack ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
        <Text variant="body" weight="semibold" style={{ flex: 1 }}>
          Include a snack
        </Text>
      </Pressable>

      {/* Generate button — dark-friendly (surface + green border) */}
      <Pressable
        onPress={build}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 54,
          borderRadius: theme.radius.lg,
          backgroundColor: c.surfaceAlt,
          borderWidth: 1.5,
          borderColor: ACCENT,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="sparkles" size={18} color={ACCENT} />
        <Text variant="body" weight="bold" style={{ color: ACCENT }}>
          {plan ? "Regenerate plan" : "Generate plan"}
        </Text>
      </Pressable>

      {/* Plan output */}
      {plan ? (
        <>
          <AvgDayCard plan={plan} target={targetCal} />
          {plan.days.map((day, i) => (
            <DayCard
              key={day.day}
              day={day}
              target={targetCal}
              onExpand={setExpanded}
              onSwap={(slot) => swap(i, slot)}
            />
          ))}
        </>
      ) : (
        <View style={{ padding: theme.spacing.xl, alignItems: "center", gap: 8 }}>
          <Ionicons name="restaurant-outline" size={40} color={c.textFaint} />
          <Text variant="body" color="textMuted" center>
            Pick a goal and hit Generate.
          </Text>
        </View>
      )}

      {/* Recipe detail modal */}
      <Modal
        visible={!!expanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpanded(null)}
      >
        {expanded ? <RecipeDetail recipe={expanded} onClose={() => setExpanded(null)} /> : null}
      </Modal>

      {/* Grocery list modal */}
      <Modal
        visible={showGrocery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGrocery(false)}
      >
        {plan ? <GroceryList plan={plan} onClose={() => setShowGrocery(false)} /> : null}
      </Modal>
    </Screen>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      {children}
    </View>
  );
}

function AvgDayCard({ plan, target }: { plan: Plan; target: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const delta = plan.totals.calories - target;
  const off = Math.abs(delta) > 200;
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.md,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
          AVG / DAY
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
          Your goal · {target} cal
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: c.text }}>
          {plan.totals.calories}
        </Text>
        <Text variant="caption" color="textMuted">
          cal
        </Text>
        <Text
          variant="caption"
          weight="bold"
          style={{
            marginLeft: "auto",
            color: !off ? c.success : delta > 0 ? c.danger : c.textMuted,
          }}
        >
          {delta > 0 ? "+" : ""}
          {delta} vs goal
        </Text>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
          marginTop: 2,
        }}
      >
        <View
          style={{
            width: `${Math.min(100, (plan.totals.calories / target) * 100)}%`,
            height: "100%",
            backgroundColor: !off ? c.success : delta > 0 ? c.danger : c.text,
            borderRadius: 3,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
        <MacroChip label="P" value={plan.totals.protein} color="#EF4444" />
        <MacroChip label="C" value={plan.totals.carbs} color="#F59E0B" />
        <MacroChip label="F" value={plan.totals.fat} color="#8B5CF6" />
      </View>
    </View>
  );
}

function DayCard({
  day,
  target,
  onExpand,
  onSwap,
}: {
  day: PlanDay;
  target: number;
  onExpand: (r: Recipe) => void;
  onSwap: (slot: MealType) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const slots: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const meals = slots.map((k) => ({ slot: k, recipe: day[k] })).filter((m) => m.recipe);
  const totalCal = meals.reduce((s, m) => s + (m.recipe?.macros.calories ?? 0), 0);
  const delta = totalCal - target;
  const off = Math.abs(delta) > 200;

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: theme.spacing.md,
          paddingBottom: 4,
        }}
      >
        <Text variant="body" weight="bold">
          Day {day.day}
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
          {totalCal} / {target} cal ·{" "}
          <Text
            variant="caption"
            weight="bold"
            style={{
              fontSize: 11,
              color: !off ? c.success : delta > 0 ? c.danger : c.textMuted,
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </Text>
        </Text>
      </View>
      {meals.map((m) => (
        <MealRow
          key={m.slot}
          slot={m.slot}
          recipe={m.recipe!}
          onPress={() => onExpand(m.recipe!)}
          onSwap={() => onSwap(m.slot)}
        />
      ))}
    </View>
  );
}

function MealRow({
  slot,
  recipe,
  onPress,
  onSwap,
}: {
  slot: string;
  recipe: Recipe;
  onPress: () => void;
  onSwap: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: 10,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: theme.radius.lg,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>{recipe.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            variant="caption"
            color="textMuted"
            weight="bold"
            style={{ letterSpacing: 0.5, fontSize: 9, textTransform: "uppercase" }}
          >
            {slot}
          </Text>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {recipe.name}
          </Text>
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
            {recipe.macros.calories} cal · {recipe.macros.protein}g P
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onSwap}
        hitSlop={8}
        style={({ pressed }) => ({
          padding: 12,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Ionicons name="shuffle" size={16} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: c.surfaceAlt,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption" weight="bold" style={{ color: c.text, fontSize: 11 }}>
        {label} {value}g
      </Text>
    </View>
  );
}

// ─── Recipe detail (with "Log this meal") ────────────────────────────────────
function RecipeDetail({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const add = useAddFood();

  const logMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const entry: FoodEntry = {
      id: `${Date.now()}`,
      date: toISODay(),
      loggedAt: new Date().toISOString(),
      name: recipe.name,
      calories: recipe.macros.calories,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fat: recipe.macros.fat,
    };
    add.mutate(entry, {
      onSuccess: () => {
        Alert.alert("Logged", `${recipe.name} added to today's food.`);
        onClose();
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted" style={{ textTransform: "capitalize" }}>
            {recipe.mealType} · {recipe.difficulty}
          </Text>
          <Text variant="title" numberOfLines={2}>
            {recipe.emoji} {recipe.name}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? c.surfaceAlt : c.surface,
            borderWidth: 1,
            borderColor: c.border,
          })}
        >
          <Ionicons name="close" size={18} color={c.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing["3xl"],
          gap: theme.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: theme.radius["2xl"],
            borderWidth: 1,
            borderColor: c.border,
            padding: theme.spacing.md,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: c.text }}>
              {recipe.macros.calories}
            </Text>
            <Text variant="caption" color="textMuted">
              cal · {recipe.prepTime + recipe.cookTime}m · serves {recipe.servings}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MacroChip label="P" value={recipe.macros.protein} color="#EF4444" />
            <MacroChip label="C" value={recipe.macros.carbs} color="#F59E0B" />
            <MacroChip label="F" value={recipe.macros.fat} color="#8B5CF6" />
          </View>
        </View>

        {/* Log this meal — dark-friendly filled with green accent */}
        <Pressable
          onPress={logMeal}
          disabled={add.isPending}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 54,
            borderRadius: theme.radius.lg,
            backgroundColor: c.surfaceAlt,
            borderWidth: 1.5,
            borderColor: ACCENT,
            opacity: pressed || add.isPending ? 0.7 : 1,
          })}
        >
          <Ionicons name="add-circle" size={20} color={ACCENT} />
          <Text variant="body" weight="bold" style={{ color: ACCENT }}>
            {add.isPending ? "Logging…" : "Log this meal"}
          </Text>
        </Pressable>

        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            INGREDIENTS
          </Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: c.border,
              padding: theme.spacing.md,
              gap: 6,
            }}
          >
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="body" style={{ flex: 1 }}>
                  {ing.item}
                </Text>
                <Text variant="body" color="textMuted">
                  {ing.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            STEPS
          </Text>
          <View style={{ gap: 10 }}>
            {recipe.steps.map((step, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: c.surfaceAlt,
                    borderWidth: 1,
                    borderColor: c.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="caption" weight="bold" style={{ color: c.text, fontSize: 11 }}>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" style={{ flex: 1 }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {recipe.tip ? (
          <View
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Ionicons name="bulb-outline" size={18} color={c.textMuted} />
            <Text variant="body" color="textMuted" style={{ flex: 1 }}>
              {recipe.tip}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── Grocery list ────────────────────────────────────────────────────────────
function GroceryList({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const items = buildGroceryList(plan);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecked((s) => ({ ...s, [key]: !s[key] }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text variant="caption" color="textMuted">
            Grocery list
          </Text>
          <Text variant="title">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? c.surfaceAlt : c.surface,
            borderWidth: 1,
            borderColor: c.border,
          })}
        >
          <Ionicons name="close" size={18} color={c.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing["3xl"],
          gap: 6,
        }}
      >
        {items.map((it) => (
          <GroceryRow
            key={it.item}
            item={it}
            checked={!!checked[it.item]}
            onToggle={() => toggle(it.item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function GroceryRow({
  item,
  checked,
  onToggle,
}: {
  item: GroceryItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? ACCENT : c.border,
          backgroundColor: checked ? ACCENT : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          variant="body"
          weight="semibold"
          style={{
            textDecorationLine: checked ? "line-through" : "none",
            color: checked ? c.textMuted : c.text,
          }}
        >
          {item.item}
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
          {item.amount}
          {item.count > 1 ? ` · used ${item.count}×` : ""}
        </Text>
      </View>
    </Pressable>
  );
}
