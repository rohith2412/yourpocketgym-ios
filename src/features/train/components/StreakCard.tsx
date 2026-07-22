import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
    <Card padding="md">
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
            {weekVolume.toLocaleString()} lbs
          </Text>
        ) : null}
      </View>

      {/* Week dots — smaller */}
      <View style={{ flexDirection: "row", gap: 4 }}>
        {week.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 6,
                backgroundColor: d.active ? c.text : c.surfaceAlt,
                borderWidth: d.today && !d.active ? 1.5 : 0,
                borderColor: c.text,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d.active ? (
                <Ionicons name="checkmark" size={11} color={c.inverseText} />
              ) : null}
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
    </Card>
  );
}
