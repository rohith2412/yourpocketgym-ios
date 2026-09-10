import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import type { WorkoutLog } from "../api";
import { buildMuscleStats } from "./MuscleAccordion";

/**
 * Flat list of muscle groups — one Card wrapping all rows, hairline
 * separators between them. Mirrors the Nutrition "Today's food" list so
 * both tabs read as one system: dot on the left, identity in the middle,
 * numeric anchor on the right.
 */

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#EF4444",
  Back: "#3B82F6",
  Shoulders: "#F59E0B",
  Arms: "#8B5CF6",
  Legs: "#22C55E",
  Core: "#EC4899",
};

function fmtLb(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 44;
  const H = 16;
  if (values.length < 2) return <View style={{ width: W, height: H }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - 2 - ((v - min) / span) * (H - 4),
  }));
  const d = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const last = pts[pts.length - 1];
  return (
    <Svg width={W} height={H}>
      <Path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={last.x} cy={last.y} r={2} fill={color} />
    </Svg>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;
  const tint = up ? c.success : down ? c.danger : c.textMuted;
  const label =
    delta === null ? "1st" : delta === 0 ? "—" : fmtLb(Math.abs(delta));
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 7,
        height: 18,
        borderRadius: 999,
        backgroundColor: tint + "1F",
      }}
    >
      {up || down ? (
        <Ionicons
          name={up ? "caret-up" : "caret-down"}
          size={9}
          color={tint}
        />
      ) : null}
      <Text style={{ fontSize: 10, fontWeight: "700", color: tint }}>
        {label}
      </Text>
    </View>
  );
}

export function MuscleList({ logs }: { logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const stats = buildMuscleStats(logs);

  if (stats.length === 0) return null;

  return (
    <Card padding="sm">
      {stats.map((stat, i) => {
        return (
          <View
            key={stat.mg}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.sm,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: c.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" weight="semibold">
                {stat.mg}
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                style={{ fontSize: 11 }}
                numberOfLines={1}
              >
                {stat.sessionCount} session{stat.sessionCount !== 1 ? "s" : ""} ·{" "}
                {stat.exNames.length} exercise
                {stat.exNames.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <Sparkline values={stat.history} color={c.textMuted} />

            <View style={{ alignItems: "flex-end", gap: 3 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: c.text,
                  letterSpacing: -0.3,
                }}
              >
                {fmtLb(stat.lastBest)}
                <Text
                  variant="caption"
                  color="textFaint"
                  style={{ fontSize: 10 }}
                >
                  {" "}
                  lb
                </Text>
              </Text>
              <DeltaBadge delta={stat.delta} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}
