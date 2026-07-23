import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen, Text, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useToday, useDeleteFood } from "./hooks";
import { FoodLogSheet } from "./FoodLogSheet";
import { CalorieRing } from "./components/CalorieRing";
import { MacroChips } from "./components/MacroChips";
import { DEFAULT_GOALS, type FoodEntry } from "./storage";

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";
const MEAL_META: Record<MealKey, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  breakfast: { label: "Breakfast", icon: "sunny-outline" },
  lunch: { label: "Lunch", icon: "restaurant-outline" },
  dinner: { label: "Dinner", icon: "moon-outline" },
  snacks: { label: "Snacks", icon: "cafe-outline" },
};

function mealForTime(iso: string): MealKey {
  const h = new Date(iso).getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snacks";
}

function initial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function FoodRow({
  entry,
  onDelete,
}: {
  entry: FoodEntry;
  onDelete: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const time = new Date(entry.loggedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {/* Letter avatar */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: theme.radius.md,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: theme.fontWeight.heavy,
            color: c.text,
          }}
        >
          {initial(entry.name)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {time} · {Math.round(entry.protein)}p · {Math.round(entry.carbs)}c ·{" "}
          {Math.round(entry.fat)}f
        </Text>
      </View>

      <Text variant="body" weight="bold">
        {Math.round(entry.calories)}
        <Text variant="caption" color="textFaint">
          {" "}
          kcal
        </Text>
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={18} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

function MealSection({
  meal,
  entries,
  onDelete,
  onAdd,
}: {
  meal: MealKey;
  entries: FoodEntry[];
  onDelete: (id: string, name: string) => void;
  onAdd: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const meta = MEAL_META[meal];
  const total = entries.reduce((s, e) => s + e.calories, 0);
  const isEmpty = entries.length === 0;

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={meta.icon} size={16} color={c.text} />
        </View>
        <Text variant="body" weight="bold" style={{ flex: 1 }}>
          {meta.label}
        </Text>
        {total > 0 ? (
          <Text variant="caption" color="textMuted" weight="bold">
            {Math.round(total)} kcal
          </Text>
        ) : null}
        <Pressable onPress={onAdd} hitSlop={8}>
          <Ionicons name="add" size={22} color={c.text} />
        </Pressable>
      </View>

      {/* Body */}
      {isEmpty ? (
        <Pressable
          onPress={onAdd}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            paddingTop: 4,
          }}
        >
          <Text variant="caption" color="textFaint">
            No food logged. Tap + to add.
          </Text>
        </Pressable>
      ) : (
        entries.map((e, i) => (
          <View key={e.id}>
            {i === 0 ? <Separator inset={theme.spacing.lg} /> : null}
            {i > 0 ? <Separator inset={theme.spacing["3xl"]} /> : null}
            <FoodRow entry={e} onDelete={() => onDelete(e.id, e.name)} />
          </View>
        ))
      )}
    </View>
  );
}

export function NutritionScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [showLog, setShowLog] = useState(false);

  const { items, totals, goals: g } = useToday();
  const goals = g ?? DEFAULT_GOALS;
  const del = useDeleteFood();

  const grouped = useMemo(() => {
    const buckets: Record<MealKey, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    items.forEach((e) => buckets[mealForTime(e.loggedAt)].push(e));
    // Sort each bucket by time ascending
    (Object.keys(buckets) as MealKey[]).forEach((k) =>
      buckets[k].sort((a, b) => (a.loggedAt < b.loggedAt ? -1 : 1)),
    );
    return buckets;
  }, [items]);

  const removeEntry = (id: string, name: string) => {
    Alert.alert(`Delete ${name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };

  const openLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowLog(true);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: 140,
            gap: theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: theme.spacing.lg }}>
            <Text variant="caption" color="textMuted">
              {today}
            </Text>
            <Text variant="title">Nutrition</Text>
          </View>

          {/* Ring hero */}
          <View style={{ alignItems: "center", paddingVertical: theme.spacing.md }}>
            <CalorieRing eaten={totals.calories} goal={goals.calories} size={230} strokeWidth={14} />
          </View>

          {/* Macro chips */}
          <MacroChips
            protein={{ value: totals.protein, goal: goals.protein }}
            carbs={{ value: totals.carbs, goal: goals.carbs }}
            fat={{ value: totals.fat, goal: goals.fat }}
          />

          {/* Meals — grouped by time of day */}
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="label" color="textMuted">
              MEALS
            </Text>
            {(["breakfast", "lunch", "dinner", "snacks"] as MealKey[]).map((m) => (
              <MealSection
                key={m}
                meal={m}
                entries={grouped[m]}
                onDelete={removeEntry}
                onAdd={openLog}
              />
            ))}
          </View>
        </ScrollView>
      </Screen>

      {/* FAB */}
      {!showLog ? (
        <View style={{ position: "absolute", bottom: theme.spacing.xl, right: theme.spacing.xl }}>
          <Pressable
            onPress={openLog}
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.radius.xl,
              backgroundColor: c.inverseBg,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: c.inverseBg,
              shadowOpacity: 0.28,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Ionicons name="add" size={30} color={c.inverseText} />
          </Pressable>
        </View>
      ) : null}

      <FoodLogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </View>
  );
}
