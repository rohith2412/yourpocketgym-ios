import { Alert, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useDeleteWorkout, type WorkoutLog } from "../api";
import { totalVolSets } from "../data";

/**
 * Flat list of recent workouts. Same shape as the Nutrition "Today's food"
 * row — icon block on the left, name+meta in the middle, numeric anchor on
 * the right, a close button to delete. Lives in its own section, so
 * per-muscle drilldowns don't hide behind an accordion.
 */

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WorkoutHistoryList({
  logs,
  limit = 12,
}: {
  logs: WorkoutLog[];
  limit?: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const del = useDeleteWorkout();

  if (logs.length === 0) return null;

  const rows = logs.slice(0, limit);

  const removeLog = (log: WorkoutLog) => {
    // Native iOS action sheet — same UX as the Sign out flow. A single tap
    // opens Apple's confirm dialog; destructive actions never fire without
    // an explicit yes from the OS UI.
    const dateLabel = new Date(log.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    Alert.alert(
      "Delete workout?",
      `${dateLabel} · ${log.exercises.length} exercise${log.exercises.length !== 1 ? "s" : ""}. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => del.mutate(log._id),
        },
      ],
    );
  };

  return (
    <Card padding="sm">
      {rows.map((log, i) => {
        const totalVol = log.exercises.reduce(
          (s, ex) => s + totalVolSets(ex.sets),
          0,
        );
        const muscleSet = new Set(
          log.exercises.map((e) => (e.muscleGroup || "").trim()).filter(Boolean),
        );
        const muscles = [...muscleSet].join(" · ") || "Workout";

        return (
          <View
            key={log._id}
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <Text
                  variant="body"
                  weight="semibold"
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {muscles}
                </Text>
                <Text
                  variant="caption"
                  color="textFaint"
                  style={{ fontSize: 10 }}
                >
                  {fmtTime(log.date)}
                </Text>
              </View>
              <Text
                variant="caption"
                color="textMuted"
                style={{ fontSize: 11 }}
                numberOfLines={1}
              >
                {fmtDate(log.date)} · {log.exercises.length} exercise
                {log.exercises.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <Text variant="body" weight="bold" style={{ fontSize: 14 }}>
                {Math.round(totalVol).toLocaleString()}
              </Text>
              <Text
                variant="caption"
                color="textFaint"
                style={{ fontSize: 9 }}
              >
                vol
              </Text>
            </View>

            <Pressable
              onPress={() => removeLog(log)}
              hitSlop={8}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={14} color={c.textMuted} />
            </Pressable>
          </View>
        );
      })}
    </Card>
  );
}
