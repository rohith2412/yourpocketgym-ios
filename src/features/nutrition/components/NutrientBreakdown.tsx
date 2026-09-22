import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { Text } from "../../../ui";
import {
  formatValue,
  GROUP_ICONS,
  GROUP_LABELS,
  NUTRIENT_META,
  type NutrientMeta,
} from "../nutrientMeta";
import {
  DEFAULT_GOALS,
  type MacroGoals,
  type NutrientKey,
} from "../storage";

/**
 * Four nutrients that most calorie-counter users actually want to see at a
 * glance — fiber, sugar, sodium, saturated fat. Everything else lives behind
 * "Show all" so the screen stays scannable for the 90% of the audience.
 */
const HERO_KEYS: NutrientKey[] = ["fiber", "sugar", "sodium", "satFat"];

const REST_GROUPS = ["essential", "vitamin", "mineral"] as const;

/**
 * Inline nutrient panel — always shows the four hero nutrients as coloured
 * rings; tapping "Show all" reveals the full vitamin + mineral breakdown.
 *
 * Designed to live directly on the Nutrition screen (no wrapping card) so
 * it reads as part of the day summary rather than a nested collapsible.
 */
export function NutrientBreakdown({
  totals,
  goals,
}: {
  totals: Record<NutrientKey, number>;
  goals: MacroGoals;
}) {
  const { theme } = useTheme();
  const [showAll, setShowAll] = useState(false);

  const heroItems = useMemo(
    () =>
      HERO_KEYS.map((k) => NUTRIENT_META.find((m) => m.key === k)!).filter(
        Boolean,
      ),
    [],
  );

  // Rest = everything not already shown in the hero row and not a macro
  // (macros live in the CalorieSummary card above).
  const restGrouped = useMemo(() => {
    const out: Record<string, NutrientMeta[]> = {};
    for (const m of NUTRIENT_META) {
      if (m.group === "macro") continue;
      if (HERO_KEYS.includes(m.key)) continue;
      (out[m.group] ||= []).push(m);
    }
    return out;
  }, []);

  const c = theme.colors;

  return (
    <View style={{ gap: theme.spacing.md }}>
      {/* Single hero box — four nutrients in one row + chevron to expand */}
      <View
        style={{
          backgroundColor: c.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {heroItems.map((meta) => (
          <HeroSlot
            key={meta.key}
            meta={meta}
            value={totals[meta.key] ?? 0}
            goal={(goals[meta.key] as number | undefined) ?? DEFAULT_GOALS[meta.key]}
          />
        ))}
        <Pressable
          onPress={() => setShowAll((v) => !v)}
          hitSlop={10}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            paddingLeft: 4,
          })}
        >
          <Ionicons
            name={showAll ? "chevron-up" : "chevron-down"}
            size={18}
            color={c.textMuted}
          />
        </Pressable>
      </View>

      {/* Expanded groups — one section per vitamin/mineral cluster */}
      {showAll ? (
        <View style={{ gap: theme.spacing.lg }}>
          {REST_GROUPS.map((group) => {
            const items = restGrouped[group] ?? [];
            if (items.length === 0) return null;
            return (
              <GroupSection
                key={group}
                group={group}
                items={items}
                totals={totals}
                goals={goals}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/**
 * A single slot inside the shared hero box — no background of its own, just
 * ring + short label + value stacked vertically. `flex: 1` so four of them
 * share the row width evenly.
 */
function HeroSlot({
  meta,
  value,
  goal,
}: {
  meta: NutrientMeta;
  value: number;
  goal: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const pct = goal > 0 ? value / goal : 0;
  const isLimit = meta.kind === "limit";
  const over = isLimit && pct > 1;
  const met = !isLimit && pct >= 1;

  const ringColor = over ? c.danger : met ? c.success : meta.color;

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Ring pct={pct} color={ringColor} trackColor={withAlpha(meta.color, 0.15)} size={30} />
      <Text
        variant="caption"
        color="textMuted"
        numberOfLines={1}
        style={{ fontSize: 10 }}
      >
        {meta.short}
      </Text>
      <Text
        variant="caption"
        weight="semibold"
        numberOfLines={1}
        style={{
          fontSize: 11,
          fontVariant: ["tabular-nums"],
          color: over ? c.danger : c.text,
        }}
      >
        {formatValue(value, meta.unit)}
        <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
          {meta.unit}
        </Text>
      </Text>
    </View>
  );
}

function GroupSection({
  group,
  items,
  totals,
  goals,
}: {
  group: NutrientMeta["group"];
  items: NutrientMeta[];
  totals: Record<NutrientKey, number>;
  goals: MacroGoals;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const iconName = GROUP_ICONS[group] as React.ComponentProps<typeof Ionicons>["name"];
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={13} color={c.text} />
        </View>
        <Text variant="caption" weight="semibold" color="textMuted">
          {GROUP_LABELS[group].toUpperCase()}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        {items.map((meta) => (
          <NutrientTile
            key={meta.key}
            meta={meta}
            value={totals[meta.key] ?? 0}
            goal={(goals[meta.key] as number | undefined) ?? DEFAULT_GOALS[meta.key]}
          />
        ))}
      </View>
    </View>
  );
}

function NutrientTile({
  meta,
  value,
  goal,
}: {
  meta: NutrientMeta;
  value: number;
  goal: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const pct = goal > 0 ? value / goal : 0;
  const isLimit = meta.kind === "limit";
  const over = isLimit && pct > 1;
  const met = !isLimit && pct >= 1;

  const ringColor = over ? c.danger : met ? c.success : meta.color;

  return (
    <View
      style={{
        flexBasis: "48%",
        flexGrow: 1,
        backgroundColor: c.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Ring pct={pct} color={ringColor} trackColor={withAlpha(meta.color, 0.15)} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="caption" color="textMuted" numberOfLines={1} style={{ fontSize: 11 }}>
          {meta.short}
        </Text>
        <Text
          variant="body"
          weight="semibold"
          numberOfLines={1}
          style={{ fontSize: 13, fontVariant: ["tabular-nums"], color: over ? c.danger : c.text }}
        >
          {formatValue(value, meta.unit)}
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
            {" / "}
            {formatValue(goal, meta.unit)}
          </Text>
        </Text>
      </View>
    </View>
  );
}

function Ring({
  pct,
  color,
  trackColor,
  size = 34,
}: {
  pct: number;
  color: string;
  trackColor: string;
  size?: number;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const dashOffset = circ * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3 ? h.split("").map((x) => x + x).join("") : h,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
