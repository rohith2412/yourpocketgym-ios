import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useProgressCardColor } from "../cardSurface";
import { DualLineChart } from "./DualLineChart";
import { WeightChart } from "./WeightChart";
import { BodyHeatmap } from "./BodyHeatmap";
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
  const cardBg = useProgressCardColor();
  const c = theme.colors;
  const { perDay, goals, macros } = useNutritionSeries();
  const [containerW, setContainerW] = useState(0);

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
    </View>
  );
}

export function ProgressPager() {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <DualLineChart />
      <NutritionLBlock />
      <BodyHeatmap />
    </View>
  );
}
