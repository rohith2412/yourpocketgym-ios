import { useMemo, useRef, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { getWeekActivity } from "../data";
import type { WorkoutLog } from "../api";

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;

const toISODate = (d: Date | string) => new Date(d).toLocaleDateString("en-CA");

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

export function StreakCard({ logs }: { logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const yearScrollRef = useRef<ScrollView>(null);

  const week = getWeekActivity(logs);
  const streak = week.filter((d) => d.active).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekVolume = logs
    .filter((l) => new Date(l.date) >= weekStart)
    .reduce(
      (s, l) =>
        s + l.exercises.reduce((es, ex) => es + ex.sets.reduce((ss, st) => ss + st.reps * st.weight, 0), 0),
      0,
    );

  // Year grid (only built when opened)
  const { weeks, maxVol } = useMemo(() => (open ? buildYearGrid(logs) : { weeks: [], maxVol: 1 }), [open, logs]);
  const yearSessions = useMemo(() => {
    if (!open) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    return logs.filter((l) => new Date(l.date) >= cutoff).length;
  }, [open, logs]);

  // Month labels for the heatmap
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

  const isDark = theme.mode === "dark";
  const baseRgb = isDark ? "255,255,255" : "0,0,0";
  const cellColor = (vol: number, hasLog: boolean) => {
    if (!hasLog) return c.surfaceAlt;
    const i = vol / maxVol;
    if (i < 0.25) return `rgba(${baseRgb},0.25)`;
    if (i < 0.5) return `rgba(${baseRgb},0.45)`;
    if (i < 0.75) return `rgba(${baseRgb},0.7)`;
    return c.text;
  };

  return (
    <Card padding="md">
      <Pressable onPress={() => setOpen((v) => !v)}>
        {/* Header: streak + volume, tight */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: theme.fontWeight.heavy,
              color: c.text,
              letterSpacing: -0.5,
            }}
          >
            {streak}
          </Text>
          <Text variant="caption" color="textMuted">
            / 7 sessions
          </Text>
          {weekVolume > 0 ? (
            <Text variant="caption" color="textFaint">
              {" · "}
              {weekVolume.toLocaleString()} lb
            </Text>
          ) : null}
        </View>

        {/* Week dots */}
        <View style={{ flexDirection: "row", gap: 4 }}>
          {week.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 999,
                  backgroundColor: d.active ? c.text : c.surfaceAlt,
                  borderWidth: d.today && !d.active ? 1.5 : 0,
                  borderColor: c.text,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: d.active ? c.inverseText : c.text,
                  }}
                >
                  {d.date}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: d.today ? "700" : "500",
                  color: d.today ? c.text : c.textFaint,
                }}
              >
                {d.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Toggle line */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: c.textFaint,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            textAlign: "right",
            marginTop: theme.spacing.sm,
          }}
        >
          {open ? "▲ Hide" : "▼ Year view"}
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
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: c.textMuted,
              }}
            >
              Past year
            </Text>
            <Text variant="caption" color="textFaint">
              {yearSessions} session{yearSessions !== 1 ? "s" : ""}
            </Text>
          </View>

          <ScrollView
            ref={yearScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}
            onContentSizeChange={() => yearScrollRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width: weeks.length * STEP }}>
              {/* Month labels */}
              <View style={{ height: 14, marginBottom: 4 }}>
                {monthLabels.map(({ wi, x, label }) => (
                  <Text
                    key={wi}
                    style={{
                      position: "absolute",
                      left: x,
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
                          borderRadius: 2,
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
          </ScrollView>

          {/* Legend */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: theme.spacing.sm,
              justifyContent: "flex-end",
            }}
          >
            <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
              Less
            </Text>
            {[
              c.surfaceAlt,
              `rgba(${baseRgb},0.25)`,
              `rgba(${baseRgb},0.45)`,
              `rgba(${baseRgb},0.7)`,
              c.text,
            ].map((bg, i) => (
              <View
                key={i}
                style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: bg }}
              />
            ))}
            <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
              More
            </Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
