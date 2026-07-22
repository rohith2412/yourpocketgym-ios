import { View } from "react-native";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { getWeekActivity } from "../data";
import type { WorkoutLog } from "../api";

export function StreakCard({ logs }: { logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const c = theme.colors;

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

  return (
    <Card>
      {/* Summary line */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Text style={{ fontSize: 28, fontWeight: theme.fontWeight.heavy, color: c.text, letterSpacing: -1 }}>
          {streak}
        </Text>
        <Text variant="caption" color="textMuted">
          / 7 sessions
        </Text>
        {weekVolume > 0 ? (
          <Text variant="caption" color="textMuted">
            · {weekVolume.toLocaleString()} lbs
          </Text>
        ) : null}
      </View>

      {/* Week dots */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {week.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: theme.radius.md,
                backgroundColor: d.active ? c.text : c.surfaceAlt,
                borderWidth: d.today && !d.active ? 2 : 1,
                borderColor: d.today ? c.text : c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d.active ? (
                <Text style={{ fontSize: 13, fontWeight: "800", color: c.inverseText }}>✓</Text>
              ) : null}
            </View>
            <Text
              variant="caption"
              color={d.today ? "text" : "textFaint"}
              weight="semibold"
              style={{ fontSize: 10 }}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
