import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen, Text, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useToday, useDeleteFood, useWater } from "./hooks";
import { WATER_GOAL_ML, toISODay } from "./storage";
import { FoodLogSheet } from "./FoodLogSheet";
import { CalorieRing } from "./components/CalorieRing";
import { MacroBars } from "./components/MacroBars";
import { WaterTracker } from "./components/WaterTracker";
import { WeeklyChart } from "./components/WeeklyChart";
import { DEFAULT_GOALS, type FoodEntry } from "./storage";
// (WATER_GOAL_ML + toISODay imported above)
import { ACCENT_GREEN, ACCENT_GREEN_DARK, ACCENT_GREEN_SOFT } from "./theme";

// ─── Meal buckets ────────────────────────────────────────────────────────────
type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";
const MEAL_META: Record<MealKey, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  breakfast: { label: "Breakfast", icon: "sunny-outline" },
  lunch: { label: "Lunch", icon: "restaurant-outline" },
  dinner: { label: "Dinner", icon: "moon-outline" },
  snacks: { label: "Snacks", icon: "cafe-outline" },
};

const mealFor = (iso: string): MealKey => {
  const h = new Date(iso).getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snacks";
};

const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

// ─── Food row (Apple Wallet-style card row) ──────────────────────────────────
function FoodRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const time = new Date(entry.loggedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const Chip = ({ label, value }: { label: string; value: number }) => (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: c.surfaceAlt,
      }}
    >
      <Text variant="caption" color="textMuted" weight="semibold" style={{ fontSize: 10 }}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );

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
          width: 44,
          height: 44,
          borderRadius: theme.radius.lg,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ fontSize: 17, fontWeight: theme.fontWeight.heavy, color: c.text }}
        >
          {initial(entry.name)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
            {entry.name}
          </Text>
          <Text variant="caption" color="textFaint">
            {time}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip label="P" value={entry.protein} />
          <Chip label="C" value={entry.carbs} />
          <Chip label="F" value={entry.fat} />
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text variant="body" weight="bold">
          {Math.round(entry.calories)}
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
          kcal
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={16} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

// ─── Meal timeline section ───────────────────────────────────────────────────
function MealCard({
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
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: ACCENT_GREEN_SOFT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={meta.icon} size={16} color={ACCENT_GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="bold">
            {meta.label}
          </Text>
          {total > 0 ? (
            <Text variant="caption" color="textMuted">
              {Math.round(total)} kcal
            </Text>
          ) : (
            <Text variant="caption" color="textFaint">
              Nothing yet
            </Text>
          )}
        </View>
        <Pressable
          onPress={onAdd}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={18} color={c.text} />
        </Pressable>
      </View>

      {entries.length > 0
        ? entries.map((e, i) => (
            <View key={e.id}>
              {i === 0 ? <Separator inset={theme.spacing.lg} /> : null}
              {i > 0 ? <Separator inset={theme.spacing["3xl"]} /> : null}
              <FoodRow entry={e} onDelete={() => onDelete(e.id, e.name)} />
            </View>
          ))
        : null}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export function NutritionScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [showLog, setShowLog] = useState(false);

  const { items, totals, goals: g } = useToday();
  const goals = g ?? DEFAULT_GOALS;
  const del = useDeleteFood();
  const { data: water } = useWater();
  const waterMl = water?.[toISODay()] ?? 0;
  const waterLabel = waterMl >= 100 ? `${(waterMl / 1000).toFixed(1)}L` : "—";

  const grouped = useMemo(() => {
    const buckets: Record<MealKey, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    items.forEach((e) => buckets[mealFor(e.loggedAt)].push(e));
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

  const openScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      "AI Scan is Premium ✨",
      "Snap a photo and let AI log the meal for you — coming with Premium. For now, tap Add Manually.",
      [{ text: "OK" }],
    );
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const remaining = Math.max(0, goals.calories - totals.calories);

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
          {/* ── Header ────────────────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingTop: theme.spacing.lg,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                {today}
              </Text>
              <Text variant="title" style={{ marginTop: 2 }}>
                Nutrition
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                Track meals — AI photo coming with Premium.
              </Text>
            </View>
            <Pressable
              onPress={openScan}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: ACCENT_GREEN_SOFT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="sparkles" size={18} color={ACCENT_GREEN} />
            </Pressable>
          </View>

          {/* ── Daily summary hero ────────────────────────────────────────── */}
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: theme.radius["2xl"],
              borderWidth: 1,
              borderColor: c.border,
              padding: theme.spacing.xl,
              gap: theme.spacing.lg,
              alignItems: "center",
            }}
          >
            <CalorieRing eaten={totals.calories} goal={goals.calories} size={200} strokeWidth={14} />

            {/* 3 quick stats */}
            <View style={{ flexDirection: "row", width: "100%", marginTop: theme.spacing.sm }}>
              <QuickStat icon="flame" iconColor="#F97316" value={remaining.toLocaleString()} label="Left" />
              <StatDivider />
              <QuickStat
                icon="fitness"
                iconColor="#EF4444"
                value={`${Math.round(totals.protein)}g`}
                label="Protein"
              />
              <StatDivider />
              <QuickStat icon="water" iconColor="#3B82F6" value={waterLabel} label="Water" />
            </View>
          </View>

          {/* ── Quick Actions ─────────────────────────────────────────────── */}
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <Pressable
              onPress={openScan}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: ACCENT_GREEN,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.lg,
                gap: 6,
                opacity: pressed ? 0.9 : 1,
                shadowColor: ACCENT_GREEN,
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              })}
            >
              <Ionicons name="camera" size={22} color="#fff" />
              <Text weight="bold" style={{ color: "#fff", marginTop: 4 }}>
                Scan Meal
              </Text>
              <Text variant="caption" style={{ color: "rgba(255,255,255,0.75)" }}>
                Photo · AI-powered
              </Text>
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.22)",
                }}
              >
                <Text variant="caption" weight="bold" style={{ color: "#fff", fontSize: 9 }}>
                  PRO
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={openLog}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: theme.radius.xl,
                borderWidth: 1,
                borderColor: c.border,
                padding: theme.spacing.lg,
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add" size={22} color={c.text} />
              <Text weight="bold" style={{ marginTop: 4 }}>
                Add Manually
              </Text>
              <Text variant="caption" color="textMuted">
                Type it in
              </Text>
            </Pressable>
          </View>

          {/* ── Macros ───────────────────────────────────────────────────── */}
          <MacroBars
            protein={{ value: totals.protein, goal: goals.protein }}
            carbs={{ value: totals.carbs, goal: goals.carbs }}
            fat={{ value: totals.fat, goal: goals.fat }}
          />

          {/* ── Water tracker ────────────────────────────────────────────── */}
          <WaterTracker />

          {/* ── Weekly chart ─────────────────────────────────────────────── */}
          <WeeklyChart goal={goals.calories} />

          {/* ── Meals timeline ───────────────────────────────────────────── */}
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="label" color="textMuted">
              TODAY'S MEALS
            </Text>
            {(["breakfast", "lunch", "dinner", "snacks"] as MealKey[]).map((m) => (
              <MealCard
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

      {/* ── Floating Scan FAB ─────────────────────────────────────────────── */}
      {!showLog ? (
        <View style={{ position: "absolute", bottom: theme.spacing.xl, right: theme.spacing.xl }}>
          <Pressable
            onPress={openLog}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              height: 56,
              borderRadius: 28,
              backgroundColor: ACCENT_GREEN,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              shadowColor: ACCENT_GREEN,
              shadowOpacity: 0.45,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            })}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text weight="bold" style={{ color: "#fff" }}>
              Log food
            </Text>
          </Pressable>
        </View>
      ) : null}

      <FoodLogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </View>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────
function QuickStat({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text weight="bold" style={{ fontSize: 15, color: theme.colors.text }}>
        {value}
      </Text>
      <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  const { theme } = useTheme();
  return (
    <View style={{ width: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
  );
}
