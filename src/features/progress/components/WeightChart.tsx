import { useMemo, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { Text } from "../../../ui";
import { RangePicker, type ProgressRange } from "./RangePicker";
import { useTheme } from "../../../theme/ThemeProvider";
import { useProgressCardColor } from "../cardSurface";
import { CardEdge } from "../CardEdge";
import { useWeightLog } from "../hooks";
import { toISODay } from "../../nutrition/storage";
import type { WeightEntry } from "../storage";

type Range = ProgressRange;
const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

const WEIGHT_COLOR = "#A855F7"; // purple accent — distinct from Activity's green/blue

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

// Fill in daily values by carrying-forward the last known weight
function densify(log: WeightEntry[], n: number): { date: Date; lb: number | null }[] {
  const byDay = new Map(log.map((e) => [e.date, e.lb]));
  const out: { date: Date; lb: number | null }[] = [];
  // Find first known weight so days before it are null
  const knownDates = log.map((e) => e.date).sort();
  const firstKnown = knownDates[0];
  let carry: number | null = null;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = toISODay(d);
    if (byDay.has(iso)) carry = byDay.get(iso)!;
    else if (firstKnown && iso >= firstKnown && carry === null) {
      // walk back to find earliest known
      for (const k of knownDates) if (k <= iso) carry = byDay.get(k)!;
    }
    out.push({ date: d, lb: iso >= (firstKnown ?? "9999") ? carry : null });
  }
  return out;
}

export function WeightChart() {
  const { theme } = useTheme();
  const cardBg = useProgressCardColor();
  const c = theme.colors;
  const [range, setRange] = useState<Range>("30d");
  const [containerW, setContainerW] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const N = RANGE_DAYS[range];

  const { data: log = [] } = useWeightLog();

  const days = useMemo(() => densify(log, N), [log, N]);

  const W = 320;
  const H = 80;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 6;
  const PAD_B = 16;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = days.filter((d) => d.lb !== null).map((d) => d.lb as number);
  const minLb = values.length ? Math.min(...values) : 0;
  const maxLb = values.length ? Math.max(...values) : 1;
  const span = Math.max(1, maxLb - minLb);

  // Segments of the line (skip null gaps)
  const segments: { pts: { x: number; y: number }[] }[] = [];
  let cur: { x: number; y: number }[] = [];
  days.forEach((d, i) => {
    if (d.lb === null) {
      if (cur.length) segments.push({ pts: cur });
      cur = [];
      return;
    }
    const x = PAD_L + (i / Math.max(days.length - 1, 1)) * chartW;
    const y = PAD_T + (1 - (d.lb - minLb) / span) * chartH * 0.85 + chartH * 0.075;
    cur.push({ x, y });
  });
  if (cur.length) segments.push({ pts: cur });

  const lineSegs = segments.filter((s) => s.pts.length >= 2);
  const dotPts = segments.filter((s) => s.pts.length === 1).flatMap((s) => s.pts);

  const firstLineSeg = lineSegs[0];
  const lastLineSeg = lineSegs[lineSegs.length - 1];
  const firstPt = firstLineSeg?.pts[0];
  const lastPt = lastLineSeg?.pts[lastLineSeg.pts.length - 1];

  const areaPath =
    firstPt && lastPt
      ? lineSegs.map((s) => smooth(s.pts)).join(" ") +
        ` L${lastPt.x},${PAD_T + chartH} L${firstPt.x},${PAD_T + chartH} Z`
      : "";

  const gridYs = [0, 0.33, 0.66, 1].map((r) => PAD_T + r * chartH);

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

  const current = values[values.length - 1] ?? null;
  const first = values[0] ?? null;
  const delta = current !== null && first !== null ? current - first : null;

  const rangeLabel =
    range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : range === "90d" ? "Last 3 months" : "Last year";

  return (
    <View>
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: theme.radius["2xl"],
          overflow: "hidden",
        }}
      >
        <CardEdge radius={theme.radius["2xl"]} />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
            paddingBottom: 2,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="bold">
              Body weight
            </Text>
            <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
              {rangeLabel} · tap to log
            </Text>
          </View>
          <RangePicker value={range} onChange={setRange} />
        </View>

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
              <LinearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="5%" stopColor={WEIGHT_COLOR} stopOpacity="0.28" />
                <Stop offset="95%" stopColor={WEIGHT_COLOR} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {gridYs.map((y, i) => (
              <Line key={i} x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={c.border} strokeWidth={1} />
            ))}

            {areaPath ? <Path d={areaPath} fill="url(#fillWeight)" /> : null}
            {lineSegs.map((s, i) => (
              <Path
                key={i}
                d={smooth(s.pts)}
                fill="none"
                stroke={WEIGHT_COLOR}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {dotPts.map((p, i) => (
              <Circle key={`d-${i}`} cx={p.x} cy={p.y} r={4} fill={WEIGHT_COLOR} />
            ))}

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
                  const d = days[activeIdx];
                  // Nearest defined pt for the dot (walk back if this day has no value)
                  let py: number | null = null;
                  if (d.lb !== null) py = PAD_T + (1 - (d.lb - minLb) / span) * chartH * 0.85 + chartH * 0.075;
                  const tipW = 100;
                  const tipH = 30;
                  let tipX = ax - tipW / 2;
                  if (tipX < 2) tipX = 2;
                  if (tipX + tipW > W - 2) tipX = W - 2 - tipW;
                  return (
                    <>
                      <Line x1={ax} x2={ax} y1={PAD_T} y2={PAD_T + chartH} stroke={c.textFaint} strokeWidth={1} strokeDasharray="3 3" />
                      {py !== null ? (
                        <Circle cx={ax} cy={py} r={4} fill={WEIGHT_COLOR} stroke={c.surface} strokeWidth={1.5} />
                      ) : null}
                      <Rect x={tipX} y={2} width={tipW} height={tipH} rx={6} fill={c.surfaceAlt} />
                      <SvgText x={tipX + 6} y={13} fontSize={9} fontWeight="600" fill={c.textMuted}>
                        {fmtDate(d.date).toUpperCase()}
                      </SvgText>
                      <SvgText x={tipX + tipW - 6} y={24} fontSize={11} fontWeight="800" fill={WEIGHT_COLOR} textAnchor="end">
                        {d.lb !== null ? `${d.lb.toFixed(1)} lb` : "—"}
                      </SvgText>
                    </>
                  );
                })()
              : null}
          </Svg>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            paddingTop: 2,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: WEIGHT_COLOR }} />
            <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
              Now
            </Text>
            <Text variant="caption" weight="bold" style={{ fontSize: 11 }}>
              {current !== null ? `${current.toFixed(1)} lb` : "—"}
            </Text>
          </View>
          <Text
            variant="caption"
            weight="bold"
            style={{
              fontSize: 11,
              color:
                delta === null
                  ? c.textMuted
                  : delta < 0
                  ? c.success
                  : delta > 0
                  ? c.danger
                  : c.textMuted,
            }}
          >
            {delta === null ? "" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} lb`}
          </Text>
        </View>
      </View>
    </View>
  );
}
