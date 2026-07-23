import { useState } from "react";
import { View, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen, Text, Card, Progress, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useToday, useDeleteFood } from "./hooks";
import { FoodLogSheet } from "./FoodLogSheet";
import { DEFAULT_GOALS, type FoodEntry } from "./storage";

function MacroRow({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="caption" color="textMuted" weight="bold">
          {label.toUpperCase()}
        </Text>
        <Text variant="caption" color="textMuted">
          {Math.round(value)} / {goal} {unit}
        </Text>
      </View>
      <Progress value={value / goal} height={6} />
    </View>
  );
}

function FoodRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
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
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {time} · {Math.round(entry.protein)}p · {Math.round(entry.carbs)}c · {Math.round(entry.fat)}f
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

export function NutritionScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [showLog, setShowLog] = useState(false);

  const { items, totals, goals: g } = useToday();
  const goals = g ?? DEFAULT_GOALS;
  const del = useDeleteFood();

  const remaining = Math.max(0, goals.calories - totals.calories);

  const removeEntry = (id: string, name: string) => {
    Alert.alert(`Delete ${name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => del.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: 140,
            gap: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: theme.spacing.lg }}>
            <Text variant="caption" color="textMuted">
              Fuel your training
            </Text>
            <Text variant="title">Nutrition</Text>
          </View>

          {/* HERO — today's macro summary (Cal-AI style: subtle dark card, bright numbers) */}
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: theme.radius["2xl"],
              borderWidth: 1,
              borderColor: c.border,
              padding: theme.spacing.xl,
              gap: theme.spacing.xl,
            }}
          >
            {/* Big kcal number */}
            <View style={{ gap: 4 }}>
              <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 1 }}>
                TODAY
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm }}>
                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: theme.fontWeight.heavy,
                    color: c.text,
                    letterSpacing: -1.5,
                  }}
                >
                  {Math.round(totals.calories).toLocaleString()}
                </Text>
                <Text variant="body" color="textMuted">
                  / {goals.calories.toLocaleString()} kcal
                </Text>
              </View>
              <Text variant="caption" color="textFaint">
                {remaining > 0 ? `${remaining.toLocaleString()} kcal left` : "Over daily goal"}
              </Text>
            </View>

            {/* Overall progress bar */}
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: c.surfaceAlt,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%`,
                  height: "100%",
                  backgroundColor: c.text,
                }}
              />
            </View>

            {/* Macros: 3-col */}
            <View style={{ flexDirection: "row", gap: theme.spacing.lg }}>
              {(["protein", "carbs", "fat"] as const).map((k) => {
                const label = k.charAt(0).toUpperCase() + k.slice(1);
                return (
                  <View key={k} style={{ flex: 1, gap: 6 }}>
                    <Text
                      variant="caption"
                      color="textMuted"
                      weight="bold"
                      style={{ letterSpacing: 0.5 }}
                    >
                      {label.toUpperCase()}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: theme.fontWeight.heavy,
                          color: c.text,
                          letterSpacing: -0.5,
                        }}
                      >
                        {Math.round(totals[k])}
                      </Text>
                      <Text variant="caption" color="textFaint">
                        /{goals[k]}g
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: c.surfaceAlt,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(100, (totals[k] / goals[k]) * 100)}%`,
                          height: "100%",
                          backgroundColor: c.text,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Today's food list */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="label" color="textMuted">
              TODAY'S FOOD
            </Text>

            {items.length === 0 ? (
              <Card padding="xl">
                <View style={{ alignItems: "center", gap: theme.spacing.md }}>
                  <Ionicons name="restaurant-outline" size={28} color={c.textMuted} />
                  <Text variant="body" color="textMuted" center>
                    Nothing logged yet. Tap + to add a food.
                  </Text>
                </View>
              </Card>
            ) : (
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius.xl,
                  borderWidth: 1,
                  borderColor: c.border,
                  overflow: "hidden",
                }}
              >
                {items.map((entry, i) => (
                  <View key={entry.id}>
                    {i > 0 ? <Separator inset={theme.spacing.lg} /> : null}
                    <FoodRow entry={entry} onDelete={() => removeEntry(entry.id, entry.name)} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Screen>

      {/* FAB */}
      {!showLog ? (
        <View style={{ position: "absolute", bottom: theme.spacing.xl, right: theme.spacing.xl }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setShowLog(true);
            }}
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
