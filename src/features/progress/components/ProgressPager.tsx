import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useProgressCardColor } from "../cardSurface";
import { DualLineChart } from "./DualLineChart";
import { WeightChart } from "./WeightChart";
import { BodyHeatmap } from "./BodyHeatmap";
import { LogOverlay } from "./LogOverlay";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutLogs } from "../../train/api";
import { useFoodEntries } from "../../nutrition/hooks";
import { useWeightLog } from "../hooks";
import { useRouter } from "expo-router";
import { useTabNav } from "../../../nav/tabNav";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { generateWorkoutLogs, generateFoodEntries, generateWeightLog } from "../../demo/demoData";
import { trackingKeys } from "../../train/api";
import {
  MacroRow,
  useNutritionSeries,
} from "../../nutrition/components/MacroBarsChart";
import { CalorieRing } from "../../nutrition/components/CalorieRing";

/**
 * Nutrition L-block: one continuous L-shaped card with a rectangular notch in
 * the top-left where Weight sits. The L outline is drawn as a single SVG Path
 * so borders/corners are truly seamless — no hairline tricks, no border-mask
 * hacks. Content sits absolutely-positioned on top of the SVG background.
 *
 * Layout (viewBox is measured from the parent width):
 *
 *   ┌─────────┐  ┌───────────┐
 *   │  Weight │  │ TODAY ring│   ← weight = separate card in the notch
 *   │  (own   │  │           │
 *   │  card)  │  │           │
 *   └─────────┘  │           │
  *   ┌───────────────────────┐
  *   │ Protein / Carbs / Fat │   ← macros fill the L's bottom bar
  *   └───────────────────────┘
 */

// Geometry — Weight sits inside the L's notch. GAP_H = breathing room to the
// right of Weight (before the TODAY column). GAP_V = breathing room BELOW
// Weight (before the macros bar) — smaller so the macros top hugs Weight.
const WEIGHT_H = 200; // height of the Weight card
const BOTTOM_H = 200; // height of the macros bar
const RADIUS = 20; // corner radius
const GAP_H = 14; // horizontal gap between Weight and TODAY column
const GAP_V = -27; // vertical gap below Weight before the macros bar
const CUT_H = WEIGHT_H + GAP_V; // notch height inside the L
const TOTAL_H = CUT_H + BOTTOM_H;

function LShapePath({
  width,
  color,
  border,
}: {
  width: number;
  color: string;
  border: string;
}) {
  if (width <= 0) return null;
  const W = width;
  // Round to whole pixels — a fractional split lands the SVG notch on a subpixel
  // and the overlaid Views on the next one, giving a hairline seam on real 2×
  // devices (invisible on simulator).
  const weightW = Math.round((W - GAP_H) / 2);
  const cutW = weightW + GAP_H; // notch right edge — GAP_H away from Weight
  const cutH = CUT_H; // notch bottom edge — GAP_V below Weight
  const R = RADIUS;

  // Clockwise path around the L fill, with rounded outer corners (sweep=1)
  // and a concave inner notch corner (sweep=0).
  const d = [
    `M${cutW + R},0`, // start after inner top-left rounded corner of top-right column
    `L${W - R},0`, // top edge of top-right column
    `A${R} ${R} 0 0 1 ${W},${R}`, // outer top-right corner (convex)
    `L${W},${TOTAL_H - R}`, // right edge
    `A${R} ${R} 0 0 1 ${W - R},${TOTAL_H}`, // outer bottom-right corner (convex)
    `L${R},${TOTAL_H}`, // bottom edge
    `A${R} ${R} 0 0 1 0,${TOTAL_H - R}`, // outer bottom-left corner (convex)
    `L0,${cutH + R}`, // left edge going up
    `A${R} ${R} 0 0 1 ${R},${cutH}`, // outer top-left of bottom bar (convex)
    `L${cutW - R},${cutH}`, // inner top edge under notch
    `A${R} ${R} 0 0 0 ${cutW},${cutH - R}`, // CONCAVE inner corner
    `L${cutW},${R}`, // inner right edge of notch going up
    `A${R} ${R} 0 0 1 ${cutW + R},0`, // outer top-left of top-right column (convex)
    `Z`,
  ].join(" ");

  // Bottom + right only, to match the CSS `borderRightWidth`/`borderBottomWidth`
  // on the other Progress cards. Traced as a separate open path since SVG has
  // no per-side border. Inset by half the stroke so it isn't clipped by the
  // viewport edge.
  const SW = 1;
  const half = SW / 2;
  const edge = [
    `M${W - R},${half}`,
    `A${R} ${R} 0 0 1 ${W - half},${R}`, // top-right corner
    `L${W - half},${TOTAL_H - R}`, // right edge
    `A${R} ${R} 0 0 1 ${W - R},${TOTAL_H - half}`, // bottom-right corner
    `L${R},${TOTAL_H - half}`, // bottom edge
    `A${R} ${R} 0 0 1 ${half},${TOTAL_H - R}`, // bottom-left corner
  ].join(" ");

  return (
    <Svg
      width={W}
      height={TOTAL_H}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <Defs>
        {/* Top-right → bottom-left. The bottom-right corner projects to the
            midpoint of that axis, so the bright stop at 0.5 lands there and
            the stroke fades out toward both ends. */}
        <LinearGradient id="lEdge" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={border} stopOpacity="0" />
          <Stop offset="0.5" stopColor={border} stopOpacity="1" />
          <Stop offset="1" stopColor={border} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={color} />
      <Path
        d={edge}
        fill="none"
        stroke="url(#lEdge)"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function NutritionLBlock() {
  const { theme } = useTheme();
  const tabNav = useTabNav();
  const cardBg = useProgressCardColor();
  const c = theme.colors;
  const { perDay, goals, macros } = useNutritionSeries();
  const [containerW, setContainerW] = useState(0);
  const router = useRouter();
  // Same shape as ProgressPager: snapshot once, only after both queries
  // have resolved, so we never flash a pill over real data.
  const foodsQ = useFoodEntries();
  const weightsQ = useWeightLog();
  const foods = foodsQ.data ?? [];
  const weights = weightsQ.data ?? [];
  const [foodsEmpty, setFoodsEmpty] = useState<boolean | null>(null);
  const [weightsEmpty, setWeightsEmpty] = useState<boolean | null>(null);
  useEffect(() => {
    if (foodsEmpty === null && foodsQ.isFetched) setFoodsEmpty(foods.length === 0);
    if (weightsEmpty === null && weightsQ.isFetched) setWeightsEmpty(weights.length === 0);
  }, [foodsEmpty, weightsEmpty, foodsQ.isFetched, weightsQ.isFetched, foods.length, weights.length]);

  const restMacros = macros.filter((m) => m.key !== "calories");
  const eatenToday = perDay.calories[perDay.calories.length - 1] ?? 0;
  const calGoal = goals.calories;

  // Must exactly match the L-shape SVG's weightW so the notch, Weight card,
  // and calorie column all land on the same pixel.
  const weightW = containerW > 0 ? Math.round((containerW - GAP_H) / 2) : 0;
  const ringLeft = weightW + GAP_H; // ring column starts right after the notch
  const ringW = containerW - ringLeft;

  return (
    <View
      style={{ height: TOTAL_H, position: "relative" }}
      onLayout={(e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width)}
    >
      {/* L-shape background */}
      <LShapePath width={containerW} color={cardBg} border={c.border} />

      {/* 7-day calorie bar chart — sits inside the L's top-right column */}
      {containerW > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: ringLeft,
            width: ringW,
            height: CUT_H,
            padding: theme.spacing.md,
            gap: 6,
          }}
          pointerEvents="box-none"
        >
          <Text
            variant="caption"
            color="textMuted"
            weight="bold"
            style={{ letterSpacing: 0.5, fontSize: 9 }}
          >
            CALORIES · 7d
          </Text>
          {/* Vertical bars — fill bottom to top, light green */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            {perDay.calories.map((v, i) => {
              const pct = Math.max(0.05, Math.min(1, calGoal > 0 ? v / calGoal : 0));
              const isToday = i === perDay.calories.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: `${pct * 100}%`,
                    minHeight: 2,
                    borderRadius: 3,
                    backgroundColor: v === 0 ? c.surfaceAlt : "#86EFAC", // light green
                    opacity: isToday ? 1 : 0.65,
                  }}
                />
              );
            })}
          </View>
          <Text variant="caption" weight="bold" style={{ fontSize: 10, color: c.text }}>
            {Math.round(eatenToday).toLocaleString()}
            <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
              {" / "}
              {calGoal.toLocaleString()} cal
            </Text>
          </Text>
          {/* <CalorieRing eaten={eatenToday} goal={calGoal} size={110} strokeWidth={9} /> */}
        </View>
      ) : null}

      {/* Macros — fill the L's bottom bar */}
      {containerW > 0 ? (
        <View
          style={{
            position: "absolute",
            top: CUT_H,
            left: 0,
            width: containerW,
            height: BOTTOM_H,
            padding: theme.spacing.md,
            gap: theme.spacing.md,
            justifyContent: "center",
          }}
          pointerEvents="box-none"
        >
          {restMacros.map((m) => (
            <MacroRow key={m.key} macro={m} values={perDay[m.key]} goal={goals[m.key]} />
          ))}
        </View>
      ) : null}

      {/* Blurred food-only prompt — covers the calorie column (top-right) and
          the macros bar (bottom-full-width), leaves the weight notch alone.
          Clears itself when the first meal is logged. */}
      {containerW > 0 && foodsEmpty === true ? (
        <>
          {/* Top-right column blur (calories) */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: 0,
              left: ringLeft,
              width: ringW,
              height: CUT_H,
              overflow: "hidden",
              borderTopLeftRadius: 0,
              borderTopRightRadius: RADIUS,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
          </View>

          {/* Bottom bar blur (macros) with the single CTA centred on it */}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: CUT_H,
              left: 0,
              width: containerW,
              height: BOTTOM_H,
              overflow: "hidden",
              borderTopLeftRadius: RADIUS,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: RADIUS,
              borderBottomRightRadius: RADIUS,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => tabNav.goTo("nutrition")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: c.inverseBg,
                opacity: pressed ? 0.85 : 1,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              })}
            >
              <Ionicons name="restaurant-outline" size={18} color={c.inverseText} />
              <Text variant="body" weight="bold" style={{ color: c.inverseText, fontSize: 15 }}>
                Log a meal
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {/* Weight card — floats in the L's top-left notch with GAP breathing room */}
      {containerW > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: weightW,
            height: WEIGHT_H,
          }}
        >
          <WeightChart />
        </View>
      ) : null}

      {/* Weight overlay — only when there is no weight log yet. Goes over the
          top-left notch area only. Rounded on all four corners because the
          weight card in the notch has all corners rounded (it's not part of
          the L outline, it's a floating card in the concave). */}
      {containerW > 0 && weightsEmpty === true ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: weightW,
            height: WEIGHT_H,
            overflow: "hidden",
            borderTopLeftRadius: theme.radius["2xl"],
            borderTopRightRadius: theme.radius["2xl"],
            borderBottomLeftRadius: theme.radius["2xl"],
            borderBottomRightRadius: theme.radius["2xl"],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => router.push("/body-weight" as never)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: c.inverseBg,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            })}
          >
            <Ionicons name="scale-outline" size={16} color={c.inverseText} />
            <Text variant="body" weight="bold" style={{ color: c.inverseText, fontSize: 13 }}>
              Log weight
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function ProgressPager() {
  const { theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const tabNav = useTabNav();

  // React Query returns the default [] on the very first render before any
  // data has loaded, so a naive length check flags every user as empty. We
  // gate off `isFetched` and only snapshot once all three queries have
  // actually resolved — otherwise an established user would briefly look
  // empty, we'd seed the demo generators over their real cache, and they'd
  // watch their own numbers get replaced.
  const workoutsQ = useWorkoutLogs();
  const foodsQ = useFoodEntries();
  const weightsQ = useWeightLog();
  const workouts = workoutsQ.data ?? [];
  const foods = foodsQ.data ?? [];
  const weights = weightsQ.data ?? [];
  const allFetched = workoutsQ.isFetched && foodsQ.isFetched && weightsQ.isFetched;

  const [initialEmpty, setInitialEmpty] = useState<boolean | null>(null);
  useEffect(() => {
    if (initialEmpty !== null) return; // one-shot per session
    if (!allFetched) return; // wait until all queries have resolved
    const empty = workouts.length + foods.length + weights.length === 0;
    setInitialEmpty(empty);
    if (!empty) return;

    // Cache-only preview: seed the demo generators so the charts render
    // populated. Nothing is written to AsyncStorage — a real log wins on
    // next refetch.
    qc.setQueryData(trackingKeys.list(400), {
      success: true as const,
      data: generateWorkoutLogs(45),
    });
    qc.setQueryData(["food-entries"], generateFoodEntries(30));
    qc.setQueryData(["weight-log"], generateWeightLog(60));
  }, [initialEmpty, allFetched, workouts.length, foods.length, weights.length, qc]);

  const activityEmpty = initialEmpty === true;
  const heatmapEmpty = initialEmpty === true;

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <LogOverlay
        visible={activityEmpty}
        label="Log a workout"
        icon="barbell-outline"
        onPress={() => tabNav.goTo("train")}
      >
        <DualLineChart />
      </LogOverlay>

      <NutritionLBlock />

      <LogOverlay
        visible={heatmapEmpty}
        label="Log a workout"
        icon="barbell-outline"
        onPress={() => tabNav.goTo("train")}
      >
        <BodyHeatmap />
      </LogOverlay>
    </View>
  );
}
