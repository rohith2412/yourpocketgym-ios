import { useMemo, useRef, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import type { WorkoutLog } from "../api";

/**
 * Train uses the same orange heat ramp as the BodyHeatmap — keeps the tab
 * feeling like one thing, and adds the colour the card was missing (the
 * nutrition tab reads as "alive" because the ring, macro chips and water
 * tracker all carry semantic hues; without an accent the train card felt
 * grey next to it).
 */
const HEAT = {
  ring: "#22C55E", // active workout ring
  today: "#22C55E", // today ring / accent number
  levels: [
    "#22C55E22",
    "#22C55E55",
    "#22C55E99",
    "#22C55ECC",
    "#22C55EFF",
  ] as const,
};

/**
 * Muscle-group palette. Same idea as the nutrition macro colours (protein
 * red / carbs amber / fat purple) — a distinct hue per bucket so the eye
 * can tell them apart at a glance. Order below drives the display order in
 * the split-chip row.
 */
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#EF4444",
  Back: "#3B82F6",
  Shoulders: "#F59E0B",
  Arms: "#8B5CF6",
  Legs: "#22C55E",
  Core: "#EC4899",
};
const MUSCLE_ORDER = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const toISODate = (d: Date | string) => new Date(d).toLocaleDateString("en-CA");

function startOfWeek(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay()); // Sunday start
  return out;
}

/* ─────────────────── Ring for a single day ─────────────────── */

const CIRCLE = 40;
const STROKE = 3;
const RADIUS = (CIRCLE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function DayRing({ pct, color, track }: { pct: number; color: string; track: string }) {
  const dashoffset = CIRC * (1 - Math.min(1, Math.max(0, pct)));
  return (
    <Svg
      width={CIRCLE}
      height={CIRCLE}
      style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
    >
      <Circle cx={CIRCLE / 2} cy={CIRCLE / 2} r={RADIUS} stroke={track} strokeWidth={STROKE} fill="none" />
      {pct > 0 ? (
        <Circle
          cx={CIRCLE / 2}
          cy={CIRCLE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={dashoffset}
        />
      ) : null}
    </Svg>
  );
}

/* ─────────────────── Year grid (calendar heatmap) ─────────────────── */

function buildYearGrid(logs: WorkoutLog[]) {
  const volByDate: Record<string, number> = {};
  logs.forEach((log) => {
    const iso = toISODate(log.date);
    const vol = log.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
      0,
    );
    volByDate[iso] = (volByDate[iso] ?? 0) + vol;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());

  const weeks: ({ date: string; vol: number; hasLog: boolean } | null)[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: (typeof weeks)[number] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today) {
        week.push(null);
      } else {
        const iso = toISODate(cursor);
        week.push({ date: iso, vol: volByDate[iso] ?? 0, hasLog: !!volByDate[iso] });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const maxVol = Math.max(1, ...Object.values(volByDate));
  return { weeks, maxVol };
}

/* ────────────────────────── Streak card ────────────────────────── */

export function StreakCard({ logs }: { logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const yearScrollRef = useRef<ScrollView>(null);

  // Calendar week (Sun→Sat) with per-day volume, so the ring can be
  // proportional to that day's effort within the week (matches how the
  // nutrition calendar reads).
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toISODate(today);
    const start = startOfWeek(today);
    const volByIso: Record<string, number> = {};
    logs.forEach((log) => {
      const iso = toISODate(log.date);
      const vol = log.exercises.reduce(
        (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
        0,
      );
      volByIso[iso] = (volByIso[iso] ?? 0) + vol;
    });
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      const vol = volByIso[iso] ?? 0;
      return {
        iso,
        dayNum: d.getDate(),
        label: DAY_LABELS[d.getDay()],
        isToday: iso === todayIso,
        isFuture: d > today,
        vol,
      };
    });
    const maxVol = Math.max(1, ...days.map((d) => d.vol));
    // Normalise ring: a workout day always reads as at least ~35% so an easy
    // session isn't invisible next to a heavy one, but the ordering still
    // shows through.
    return days.map((d) => ({
      ...d,
      pct: d.vol > 0 ? Math.max(0.35, d.vol / maxVol) : 0,
    }));
  }, [logs]);

  const sessions = week.filter((d) => d.vol > 0).length;
  const totalVolume = week.reduce((s, d) => s + d.vol, 0);

  // Muscle-group split for this week. Powers the colourful strip below —
  // the equivalent of Nutrition's protein/carbs/fat row.
  const muscleMix = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const totals: Record<string, number> = {};
    logs.forEach((log) => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      if (d < weekStart) return;
      log.exercises.forEach((ex: any) => {
        const g = ex.muscleGroup;
        if (!g || !(g in MUSCLE_COLORS)) return;
        const vol = ex.sets.reduce(
          (s: number, set: { reps: number; weight: number }) =>
            s + set.reps * set.weight,
          0,
        );
        totals[g] = (totals[g] ?? 0) + vol;
      });
    });
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    if (total === 0) return { entries: [] as { g: string; pct: number }[], total };
    const entries = MUSCLE_ORDER.filter((g) => totals[g] > 0).map((g) => ({
      g,
      pct: totals[g] / total,
    }));
    return { entries, total };
  }, [logs]);

  // Year grid (only built when opened)
  const { weeks, maxVol } = useMemo(
    () => (open ? buildYearGrid(logs) : { weeks: [], maxVol: 1 }),
    [open, logs],
  );
  const yearSessions = useMemo(() => {
    if (!open) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    return logs.filter((l) => new Date(l.date) >= cutoff).length;
  }, [open, logs]);

  const monthLabels = useMemo(() => {
    const out: { wi: number; x: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((wk, wi) => {
      const first = wk.find((d) => d !== null);
      if (!first) return;
      const m = new Date(first.date).getMonth();
      if (m !== lastMonth) {
        out.push({
          wi,
          x: wi * STEP,
          label: new Date(first.date).toLocaleDateString("en-US", { month: "short" }),
        });
        lastMonth = m;
      }
    });
    return out;
  }, [weeks]);

  // Year heatmap uses a neutral dark ramp — the weekly ring already owns the
  // green accent, so the grid stays quiet and lets the ring speak.
  const isDark = theme.mode === "dark";
  const baseRgb = isDark ? "255,255,255" : "0,0,0";
  const yearLevels = [
    `rgba(${baseRgb},0.15)`,
    `rgba(${baseRgb},0.35)`,
    `rgba(${baseRgb},0.55)`,
    `rgba(${baseRgb},0.8)`,
    c.text,
  ];
  const cellColor = (vol: number, hasLog: boolean) => {
    if (!hasLog) return c.surfaceAlt;
    const i = vol / maxVol;
    if (i < 0.25) return yearLevels[0];
    if (i < 0.5) return yearLevels[1];
    if (i < 0.75) return yearLevels[2];
    if (i < 1) return yearLevels[3];
    return yearLevels[4];
  };

  return (
    <Card padding="lg">
      <Pressable onPress={() => setOpen((v) => !v)}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: theme.spacing.md,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1,
                fontWeight: "700",
                color: c.textMuted,
                marginBottom: 2,
              }}
            >
              THIS WEEK
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: theme.fontWeight.heavy,
                  color: c.text,
                  letterSpacing: -1.5,
                  lineHeight: 38,
                }}
              >
                {sessions}
              </Text>
              <Text variant="caption" color="textMuted" weight="semibold" style={{ fontSize: 12 }}>
                / 7 sessions
              </Text>
            </View>
          </View>
          {totalVolume > 0 ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 9,
                  letterSpacing: 0.8,
                  fontWeight: "700",
                  color: c.textFaint,
                }}
              >
                VOLUME
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: c.text,
                  letterSpacing: -0.4,
                }}
              >
                {Math.round(totalVolume).toLocaleString()}
                <Text
                  style={{ fontSize: 10, color: c.textMuted, fontWeight: "700" }}
                >
                  {" "}
                  lb
                </Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Week strip — ring per day, matches nutrition calendar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {week.map((d) => {
            // Neutral: solid ink ring on any active day, hairline track
            // otherwise. Today gets a filled dark circle instead of a ring.
            const ringColor = c.text;
            const trackColor = c.border;
            return (
              <View
                key={d.iso}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 6,
                  opacity: d.isFuture ? 0.35 : 1,
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color: c.textMuted,
                    fontSize: 10,
                    letterSpacing: 0.5,
                    fontWeight: "700",
                  }}
                >
                  {d.label}
                </Text>
                <View
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Filled bg for today */}
                  <View
                    style={{
                      position: "absolute",
                      width: CIRCLE - STROKE * 2,
                      height: CIRCLE - STROKE * 2,
                      borderRadius: (CIRCLE - STROKE * 2) / 2,
                      backgroundColor: d.isToday ? c.inverseBg : "transparent",
                    }}
                  />
                  {/* Skip the ring on today — the filled circle is enough */}
                  {d.isToday ? null : (
                    <DayRing pct={d.pct} color={ringColor} track={trackColor} />
                  )}
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: d.isToday ? c.inverseText : c.text,
                    }}
                  >
                    {d.dayNum}
                  </Text>
                </View>
                {/* Reserve a 4px lane so rows stay level with / without a dot */}
                <View style={{ height: 4, marginTop: -2 }}>
                  {d.vol > 0 && !d.isToday ? (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: c.text,
                      }}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Muscle mix — the colour splash this card was missing */}
        {muscleMix.entries.length > 0 ? (
          <View style={{ marginTop: theme.spacing.lg, gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  fontWeight: "700",
                  color: c.textMuted,
                }}
              >
                MUSCLE MIX
              </Text>
              <Text
                variant="caption"
                color="textFaint"
                style={{ fontSize: 10 }}
              >
                {muscleMix.entries.length}{" "}
                {muscleMix.entries.length === 1 ? "group" : "groups"}
              </Text>
            </View>

            {/* Stacked bar: one segment per muscle group, sized by share */}
            <View
              style={{
                flexDirection: "row",
                height: 22,
                borderRadius: 11,
                overflow: "hidden",
                backgroundColor: c.surfaceAlt,
              }}
            >
              {muscleMix.entries.map((e) => (
                <View
                  key={e.g}
                  style={{
                    flex: e.pct,
                    backgroundColor: MUSCLE_COLORS[e.g],
                  }}
                />
              ))}
            </View>

            {/* Legend chips */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 2,
              }}
            >
              {muscleMix.entries.map((e) => (
                <View
                  key={e.g}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: c.surfaceAlt,
                  }}
                >
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: MUSCLE_COLORS[e.g],
                    }}
                  />
                  <Text
                    variant="caption"
                    style={{ fontSize: 11, color: c.text, fontWeight: "600" }}
                  >
                    {e.g}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ fontSize: 10, color: c.textMuted, fontWeight: "700" }}
                  >
                    {Math.round(e.pct * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Toggle line */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: c.textFaint,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: theme.spacing.md,
          }}
        >
          {open ? "▲ Hide year" : "▼ Year view"}
        </Text>
      </Pressable>

      {/* ── Expanded year heatmap ─────────────────────────────────────────── */}
      {open ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <View
            style={{
              height: 1,
              backgroundColor: c.border,
              marginBottom: theme.spacing.md,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: theme.spacing.sm,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  fontWeight: "700",
                  color: c.textMuted,
                }}
              >
                PAST YEAR
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: theme.fontWeight.heavy,
                    color: c.text,
                    letterSpacing: -0.8,
                  }}
                >
                  {yearSessions}
                </Text>
                <Text variant="caption" color="textMuted" weight="semibold" style={{ fontSize: 11 }}>
                  session{yearSessions !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Legend inline with header — no more crammed footer */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
                Less
              </Text>
              {[c.surfaceAlt, ...yearLevels].map((bg, i) => (
                <View
                  key={i}
                  style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: bg }}
                />
              ))}
              <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
                More
              </Text>
            </View>
          </View>

          <ScrollView
            ref={yearScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}
            onContentSizeChange={() => yearScrollRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width: weeks.length * STEP + 20 }}>
              {/* Month labels */}
              <View style={{ height: 14, marginBottom: 6 }}>
                {monthLabels.map(({ wi, x, label }) => (
                  <Text
                    key={wi}
                    style={{
                      position: "absolute",
                      left: x + 18,
                      fontSize: 9,
                      fontWeight: "700",
                      color: c.textMuted,
                      letterSpacing: 0.3,
                    }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: "row" }}>
                {/* Weekday labels down the left edge */}
                <View
                  style={{
                    width: 16,
                    justifyContent: "space-between",
                    paddingRight: 4,
                    height: 7 * STEP - GAP,
                  }}
                >
                  {["M", "W", "F"].map((label, i) => (
                    <Text
                      key={label}
                      style={{
                        fontSize: 8,
                        color: c.textFaint,
                        fontWeight: "700",
                        letterSpacing: 0.3,
                        position: "absolute",
                        top: (i * 2 + 1) * STEP - 4,
                        left: 0,
                      }}
                    >
                      {label}
                    </Text>
                  ))}
                </View>

                {/* Grid */}
                <View style={{ flexDirection: "row", gap: GAP }}>
                  {weeks.map((wk, wi) => (
                    <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                      {wk.map((day, di) => (
                        <View
                          key={di}
                          style={{
                            width: CELL,
                            height: CELL,
                            borderRadius: 3,
                            backgroundColor: day
                              ? cellColor(day.vol, day.hasLog)
                              : "transparent",
                          }}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </Card>
  );
}
