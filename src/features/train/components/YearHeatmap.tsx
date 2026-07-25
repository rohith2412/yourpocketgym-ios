import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import type { WorkoutLog } from "../api";

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 20;
const DAY_NAMES = ["", "Mon", "", "Wed", "", "Fri", ""];

const toISODate = (d: Date | string) => new Date(d).toLocaleDateString("en-CA");
// const [tooltip, setTooltip] = useState<DayCell | null>(null);
type DayCell = { date: string; vol: number; hasLog: boolean };

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
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const weeks: (DayCell | null)[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: (DayCell | null)[] = [];
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

  // Longest run of consecutive logged days across the year.
  let longestStreak = 0;
  let cur = 0;
  weeks.flat().forEach((day) => {
    if (day === null) return;
    if (day.hasLog) {
      cur += 1;
      longestStreak = Math.max(longestStreak, cur);
    } else {
      cur = 0;
    }
  });

  return { weeks, maxVol, longestStreak };
}

/** Total workouts logged in the past 365 days. */
function yearSessionCount(logs: WorkoutLog[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  return logs.filter((l) => new Date(l.date) >= cutoff).length;
}

/** Monochrome intensity — from a subtle dim to full text color. */
function useCellColor() {
  const { theme } = useTheme();
  const c = theme.colors;
  const isDark = theme.mode === "dark";
  const base = isDark ? "255,255,255" : "0,0,0";
  return (vol: number, maxVol: number, hasLog: boolean) => {
    if (!hasLog) return c.surfaceAlt;
    const i = vol / maxVol;
    if (i < 0.25) return `rgba(${base},0.25)`;
    if (i < 0.5) return `rgba(${base},0.45)`;
    if (i < 0.75) return `rgba(${base},0.7)`;
    return c.text;
  };
}

export function YearHeatmap({ logs }: { logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const cellColor = useCellColor();
  const scrollRef = useRef<ScrollView>(null);
  const [tooltip, setTooltip] = useState<DayCell | null>(null);

  const { weeks, maxVol, longestStreak } = useMemo(() => buildYearGrid(logs), [logs]);
  const sessions = yearSessionCount(logs);
  const sessionsLabel = `${sessions} session${sessions !== 1 ? "s" : ""}`;
  const streakLabel = `${longestStreak} day${longestStreak !== 1 ? "s" : ""} streak`;

  // Month labels — one per month at the first week of that month.
  const monthLabels: { wi: number; x: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        wi,
        x: wi * STEP,
        label: new Date(first.date).toLocaleDateString("en-US", { month: "short" }),
      });
      lastMonth = m;
    }
  });

  const gridWidth = weeks.length * STEP;
  const isDark = theme.mode === "dark";
  const legendBase = isDark ? "255,255,255" : "0,0,0";

  return (
    <Card padding="md">
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text variant="label" color="textMuted" weight="bold">
          THIS YEAR
        </Text>
        <Text variant="caption" color="textFaint">
          {sessionsLabel} · {streakLabel}
        </Text>
      </View>

      <View style={{ flexDirection: "row" }}>
        {/* Day-of-week labels — fixed column, doesn't scroll with the grid */}
        <View style={{ width: DAY_LABEL_WIDTH, marginTop: 18 }}>
          {DAY_NAMES.map((name, di) => (
            <View
              key={di}
              style={{ height: CELL, marginBottom: GAP, justifyContent: "center" }}
            >
              {name !== "" && (
                <Text
                  variant="caption"
                  color="textFaint"
                  style={{ fontSize: 8, fontWeight: "600" }}
                >
                  {name}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            <View style={{ width: gridWidth }}>
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

              {/* Weeks × days grid */}
              <View style={{ flexDirection: "row", gap: GAP }}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                    {week.map((day, di) => (
                      <Pressable
                        key={di}
                        disabled={!day?.hasLog}
                        onPress={() => {
                          if (!day) return;
                          setTooltip((t) => (t?.date === day.date ? null : day));
                        }}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          backgroundColor: day
                            ? cellColor(day.vol, maxVol, day.hasLog)
                            : "transparent",
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Tapped-day detail */}
      {tooltip && (
        <View
          style={{
            marginTop: theme.spacing.sm,
            backgroundColor: c.surfaceAlt,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignSelf: "flex-start",
          }}
        >
          <Text variant="caption" color="textMuted">
            {new Date(tooltip.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text variant="caption" color="text" weight="bold" style={{ fontSize: 13 }}>
            {tooltip.vol.toLocaleString()} lb
          </Text>
        </View>
      )}

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
          `rgba(${legendBase},0.25)`,
          `rgba(${legendBase},0.45)`,
          `rgba(${legendBase},0.7)`,
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
    </Card>
  );
}