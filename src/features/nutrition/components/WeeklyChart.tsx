import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useWeeklyCalories } from "../hooks";
import { ACCENT_GREEN } from "../theme";

function smooth(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cx = (p.x + c.x) / 2;
    d += ` C${cx},${p.y} ${cx},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

export function WeeklyChart({ goal }: { goal: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const days = useWeeklyCalories();

  const W = 320;
  const H = 130;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 26;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(goal, ...days.map((d) => d.kcal), 1);

  const pts = useMemo(
    () =>
      days.map((d, i) => ({
        x: PAD_L + (i / Math.max(days.length - 1, 1)) * chartW,
        y: PAD_T + (1 - d.kcal / maxVal) * chartH,
      })),
    [days, chartW, chartH, maxVal],
  );

  const line = smooth(pts);
  const area = line
    ? `${line} L${pts[pts.length - 1].x},${PAD_T + chartH} L${pts[0].x},${PAD_T + chartH} Z`
    : "";

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text variant="label" color="textMuted" weight="bold">
          WEEKLY CALORIES
        </Text>
        <Text variant="caption" color="textFaint">
          Goal {goal.toLocaleString()}
        </Text>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="wgArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={ACCENT_GREEN} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={ACCENT_GREEN} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {area ? <Path d={area} fill="url(#wgArea)" /> : null}
        {line ? (
          <Path
            d={line}
            fill="none"
            stroke={ACCENT_GREEN}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* dots */}
        {pts.map((p, i) => {
          const d = days[i];
          if (d.kcal === 0 && !d.isToday) return null;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={d.isToday ? 5 : 3}
              fill={d.isToday ? ACCENT_GREEN : c.surface}
              stroke={ACCENT_GREEN}
              strokeWidth={d.isToday ? 0 : 2}
            />
          );
        })}

        {/* day labels */}
        {days.map((d, i) => (
          <SvgText
            key={i}
            x={PAD_L + (i / Math.max(days.length - 1, 1)) * chartW}
            y={H - 6}
            fontSize={10}
            fontWeight={d.isToday ? "800" : "500"}
            fill={d.isToday ? c.text : c.textFaint}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
