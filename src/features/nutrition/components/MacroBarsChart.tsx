import { useMemo } from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useFoodEntries, useGoals } from "../hooks";
import type { FoodEntry } from "../storage";
import { DEFAULT_GOALS, toISODay, totalsForDay } from "../storage";

type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const N = 7;

type MacroKey = "calories" | "protein" | "carbs" | "fat";
type MacroDef = { key: MacroKey; label: string; color: string; icon: MCIName; unit: string };
const MACROS: MacroDef[] = [
  { key: "calories", label: "Calories", color: "#4ADE80", icon: "fire", unit: "cal" },
  { key: "protein", label: "Protein", color: "#EF4444", icon: "food-drumstick", unit: "g" },
  { key: "carbs", label: "Carbs", color: "#F59E0B", icon: "bread-slice", unit: "g" },
  { key: "fat", label: "Fat", color: "#8B5CF6", icon: "pizza", unit: "g" },
];

function MiniBars({
  values,
  goal,
  color,
}: {
  values: number[];
  goal: number;
  color: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const todayIdx = values.length - 1;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 30,
        gap: 2,
      }}
    >
      {values.map((v, i) => {
        const pct = Math.min(1, goal > 0 ? v / goal : 0);
        return (
          <View key={i} style={{ flex: 1 }}>
            <View
              style={{
                width: "100%",
                height: 30,
                justifyContent: "flex-end",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: c.surfaceAlt,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: `${Math.max(4, pct * 100)}%`,
                  backgroundColor: v === 0 ? c.border : color,
                  opacity: i === todayIdx ? 1 : 0.75,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Renders a single macro row (icon + label + %, mini bar chart). Exported for
 * L-shape layouts where the top-right and bottom cells render different rows. */
export function MacroRow({
  macro,
  values,
  goal,
}: {
  macro: MacroDef;
  values: number[];
  goal: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const today = values[values.length - 1] ?? 0;
  const pct = Math.round((today / goal) * 100);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <MaterialCommunityIcons name={macro.icon} size={11} color={c.textMuted} />
        <Text
          variant="caption"
          color="textMuted"
          weight="bold"
          style={{ letterSpacing: 0.3, flex: 1, fontSize: 9 }}
        >
          {macro.label.toUpperCase()}
        </Text>
        <Text variant="caption" weight="bold" style={{ color: c.text, fontSize: 10 }}>
          {pct}%
        </Text>
      </View>
      <MiniBars values={values} goal={goal} color={macro.color} />
    </View>
  );
}

/** Shared hook: 7-day totals + goals so pieces of the chart can be composed
 *  in unusual layouts (like the Progress page L-shape). */
export function useNutritionSeries(previewFoods?: FoodEntry[]) {
  const { data: foodsHook = [] } = useFoodEntries();
  const foods = previewFoods ?? foodsHook;
  const { data: g } = useGoals();
  const goals = g ?? DEFAULT_GOALS;

  const perDay = useMemo(() => {
    const out: Record<MacroKey, number[]> = { calories: [], protein: [], carbs: [], fat: [] };
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODay(d);
      const t = totalsForDay(foods, iso);
      out.calories.push(t.calories);
      out.protein.push(t.protein);
      out.carbs.push(t.carbs);
      out.fat.push(t.fat);
    }
    return out;
  }, [foods]);

  return { perDay, goals, macros: MACROS };
}

export function MacroBarsChart() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: foods = [] } = useFoodEntries();
  const { data: g } = useGoals();
  const goals = g ?? DEFAULT_GOALS;

  const perDay = useMemo(() => {
    const out: Record<MacroKey, number[]> = {
      calories: [],
      protein: [],
      carbs: [],
      fat: [],
    };
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODay(d);
      const t = totalsForDay(foods, iso);
      out.calories.push(t.calories);
      out.protein.push(t.protein);
      out.carbs.push(t.carbs);
      out.fat.push(t.fat);
    }
    return out;
  }, [foods]);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <View>
        <Text variant="body" weight="bold">Nutrition</Text>
        <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
          Last 7 days
        </Text>
      </View>

      {MACROS.map((m) => {
        const values = perDay[m.key];
        const today = values[values.length - 1] ?? 0;
        const goal = goals[m.key];
        const pct = Math.round((today / goal) * 100);
        return (
          <View key={m.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <MaterialCommunityIcons name={m.icon} size={11} color={c.textMuted} />
              <Text
                variant="caption"
                color="textMuted"
                weight="bold"
                style={{ letterSpacing: 0.3, flex: 1, fontSize: 9 }}
              >
                {m.label.toUpperCase()}
              </Text>
              <Text variant="caption" weight="bold" style={{ color: c.text, fontSize: 10 }}>
                {pct}%
              </Text>
            </View>
            <MiniBars values={values} goal={goal} color={m.color} />
          </View>
        );
      })}
    </View>
  );
}
