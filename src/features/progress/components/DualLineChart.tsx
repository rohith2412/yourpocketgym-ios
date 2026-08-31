import { useMemo, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Text } from "../../../ui";
import { RangePicker, type ProgressRange } from "./RangePicker";
import { useTheme } from "../../../theme/ThemeProvider";
import { useProgressCardColor } from "../cardSurface";
import { CardEdge } from "../CardEdge";
import { useFoodEntries } from "../../nutrition/hooks";
import { totalsForDay, toISODay } from "../../nutrition/storage";
import { useWorkoutLogs } from "../../train/api";
import { totalVolSets } from "../../train/data";

type Range = ProgressRange;
const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

const CAL_COLOR = "#22C55E";
const VOL_COLOR = "#3B82F6";

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

export function DualLineChart() {
  const { theme } = useTheme();
  const cardBg = useProgressCardColor();
  const c = theme.colors;
  const [range, setRange] = useState<Range>("7d");
  const [containerW, setContainerW] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const N = RANGE_DAYS[range];

  const { data: foods = [] } = useFoodEntries();
  const { data: workouts = [] } = useWorkoutLogs();

  const days = useMemo(() => {
    const out: { iso: string; date: Date; kcal: number; volume: number }[] = [];
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const iso = toISODay(d);
      const kcal = totalsForDay(foods, iso).calories;
      const volume = workouts
        .filter((w) => toISODay(new Date(w.date)) === iso)
        .reduce(
          (sum, log) =>
            sum + log.exercises.reduce((s, ex) => s + totalVolSets(ex.sets), 0),
          0,
        );
      out.push({ iso, date: d, kcal, volume });
    }
    return out;
  }, [foods, workouts, N]);

  const W = 320;
  const H = 120;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 8;
  const PAD_B = 18;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxKcalRaw = Math.max(...days.map((d) => d.kcal), 0);
  const maxVolRaw = Math.max(...days.map((d) => d.volume), 0);
  const maxKcal = Math.max(1, maxKcalRaw);
  const maxVol = Math.max(1, maxVolRaw);

  // If a series is all-zero, keep its line 4px above the baseline so it's still visible.
  const FLOOR_PX = 4;
  const kcalPts = days.map((d, i) => ({
    x: PAD_L + (i / Math.max(days.length - 1, 1)) * chartW,
    y:
      maxKcalRaw === 0
        ? PAD_T + chartH - FLOOR_PX
        : PAD_T + (1 - d.kcal / maxKcal) * chartH,
  }));
  const volPts = days.map((d, i) => ({
    x: PAD_L + (i / Math.max(days.length - 1, 1)) * chartW,
    y:
      maxVolRaw === 0
        ? PAD_T + chartH - FLOOR_PX * 2
        : PAD_T + (1 - d.volume / maxVol) * chartH,
  }));

  const kcalLine = smooth(kcalPts);
  const volLine = smooth(volPts);

  const baseY = PAD_T + chartH;
  const kcalArea = kcalLine
    ? `${kcalLine} L${kcalPts[kcalPts.length - 1].x},${baseY} L${kcalPts[0].x},${baseY} Z`
    : "";
  const volArea = volLine
    ? `${volLine} L${volPts[volPts.length - 1].x},${baseY} L${volPts[0].x},${baseY} Z`
    : "";

  // Horizontal grid (4 lines: top, 2 middle, bottom)
  const gridYs = [0, 0.33, 0.66, 1].map((r) => PAD_T + r * chartH);

  // X-axis tick indices — pick ~4 evenly spaced dates
  const tickIdxs = (() => {
    const desired = Math.min(4, days.length);
    if (desired <= 1) return [0];
    const step = (days.length - 1) / (desired - 1);
    return Array.from({ length: desired }, (_, i) => Math.round(i * step));
  })();
  const fmtDate = (d: Date) =>
    range === "1y"
      ? d.toLocaleDateString("en-US", { month: "short" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const totalKcal = days.reduce((s, d) => s + d.kcal, 0);
  const totalVol = days.reduce((s, d) => s + d.volume, 0);
  const rangeLabel =
    range === "7d"
      ? "Last 7 days"
      : range === "30d"
      ? "Last 30 days"
      : range === "90d"
      ? "Last 3 months"
      : "Last year";

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: theme.radius["2xl"],
        overflow: "hidden",
      }}
    >
      <CardEdge radius={theme.radius["2xl"]} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xs,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="bold">
            Activity
          </Text>
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
            {rangeLabel}
          </Text>
        </View>
        <RangePicker value={range} onChange={setRange} />
      </View>

      {/* Chart */}
      <View
        style={{ paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.sm }}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width - theme.spacing.sm * 2)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e: GestureResponderEvent) => {
          if (!containerW) return;
          const vbX = (e.nativeEvent.locationX / containerW) * W;
          const rel = (vbX - PAD_L) / chartW;
          const idx = Math.round(rel * (days.length - 1));
          setActiveIdx(Math.max(0, Math.min(days.length - 1, idx)));
        }}
        onResponderMove={(e: GestureResponderEvent) => {
          if (!containerW) return;
          const vbX = (e.nativeEvent.locationX / containerW) * W;
          const rel = (vbX - PAD_L) / chartW;
          const idx = Math.round(rel * (days.length - 1));
          setActiveIdx(Math.max(0, Math.min(days.length - 1, idx)));
        }}
        onResponderRelease={() => setActiveIdx(null)}
        onResponderTerminate={() => setActiveIdx(null)}
      >
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="fillCal" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="5%" stopColor={CAL_COLOR} stopOpacity="0.28" />
              <Stop offset="95%" stopColor={CAL_COLOR} stopOpacity="0.02" />
            </LinearGradient>
            <LinearGradient id="fillVol" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="5%" stopColor={VOL_COLOR} stopOpacity="0.28" />
              <Stop offset="95%" stopColor={VOL_COLOR} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid */}
          {gridYs.map((y, i) => (
            <Line
              key={i}
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y}
              y2={y}
              stroke={c.border}
              strokeWidth={1}
            />
          ))}

          {/* Areas (translucent so both are visible) */}
          {kcalArea ? <Path d={kcalArea} fill="url(#fillCal)" /> : null}
          {volArea ? <Path d={volArea} fill="url(#fillVol)" /> : null}

          {/* Strokes always on top */}
          {volLine ? (
            <Path d={volLine} fill="none" stroke={VOL_COLOR} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {kcalLine ? (
            <Path d={kcalLine} fill="none" stroke={CAL_COLOR} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}

          {/* X-axis ticks — hidden when scrubbing */}
          {activeIdx === null
            ? tickIdxs.map((idx) => {
                const x = PAD_L + (idx / Math.max(days.length - 1, 1)) * chartW;
                return (
                  <SvgText
                    key={idx}
                    x={x}
                    y={H - 6}
                    fontSize={10}
                    fontWeight="500"
                    fill={c.textMuted}
                    textAnchor={idx === 0 ? "start" : idx === days.length - 1 ? "end" : "middle"}
                  >
                    {fmtDate(days[idx].date)}
                  </SvgText>
                );
              })
            : null}

          {/* Scrub marker */}
          {activeIdx !== null
            ? (() => {
                const ax = PAD_L + (activeIdx / Math.max(days.length - 1, 1)) * chartW;
                const kPt = kcalPts[activeIdx];
                const vPt = volPts[activeIdx];
                const d = days[activeIdx];
                const label = `${fmtDate(d.date)}`;
                // Tooltip pill position — clamp near edges
                const tipW = 120;
                const tipH = 34;
                let tipX = ax - tipW / 2;
                if (tipX < 2) tipX = 2;
                if (tipX + tipW > W - 2) tipX = W - 2 - tipW;
                return (
                  <>
                    <Line x1={ax} x2={ax} y1={PAD_T} y2={PAD_T + chartH} stroke={c.textFaint} strokeWidth={1} strokeDasharray="3 3" />
                    <Circle cx={ax} cy={kPt.y} r={4} fill={CAL_COLOR} stroke={c.surface} strokeWidth={1.5} />
                    <Circle cx={ax} cy={vPt.y} r={4} fill={VOL_COLOR} stroke={c.surface} strokeWidth={1.5} />
                    {/* Tooltip pill */}
                    <Rect x={tipX} y={2} width={tipW} height={tipH} rx={6} fill={c.surfaceAlt} />
                    <SvgText x={tipX + 6} y={13} fontSize={9} fontWeight="600" fill={c.textMuted}>
                      {label.toUpperCase()}
                    </SvgText>
                    <SvgText x={tipX + 6} y={27} fontSize={10} fontWeight="800" fill={CAL_COLOR}>
                      {Math.round(d.kcal).toLocaleString()}
                    </SvgText>
                    <SvgText x={tipX + tipW - 6} y={27} fontSize={10} fontWeight="800" fill={VOL_COLOR} textAnchor="end">
                      {Math.round(d.volume).toLocaleString()} lb
                    </SvgText>
                  </>
                );
              })()
            : null}
        </Svg>
      </View>

      {/* Compact totals row */}
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CAL_COLOR }} />
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
            Cal
          </Text>
          <Text variant="caption" weight="bold" style={{ fontSize: 11 }}>
            {totalKcal.toLocaleString()}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: VOL_COLOR }} />
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
            Vol
          </Text>
          <Text variant="caption" weight="bold" style={{ fontSize: 11 }}>
            {Math.round(totalVol).toLocaleString()} lb
          </Text>
        </View>
      </View>
    </View>
  );
}
