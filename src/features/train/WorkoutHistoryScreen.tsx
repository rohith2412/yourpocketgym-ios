import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useWorkoutLogs } from "./api";
import { WorkoutHistoryList } from "./components/WorkoutHistoryList";
import { totalVolSets } from "./data";

/**
 * Dedicated history page.
 *
 * `useWorkoutLogs` is the single source of truth: it reads from the backend
 * (`/tracking`) with react-query, which persists the last successful
 * response as its own cache — so the list still renders offline. No extra
 * local-storage plumbing needed; the same hook that powers the streak card
 * powers this screen.
 */
export default function WorkoutHistoryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { data: logs = [], isLoading, refetch, isRefetching } = useWorkoutLogs();

  const totalWorkouts = logs.length;
  const totalVolume = logs.reduce(
    (s, l) => s + l.exercises.reduce((es, ex) => es + totalVolSets(ex.sets), 0),
    0,
  );

  return (
    <Screen
      scroll
      contentContainerStyle={{
        paddingBottom: theme.spacing["3xl"],
        gap: theme.spacing.lg,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            All sessions
          </Text>
          <Text variant="title">History</Text>
        </View>
        <Pressable onPress={() => refetch()} hitSlop={12}>
          <Ionicons
            name="refresh"
            size={20}
            color={isRefetching ? c.textFaint : c.textMuted}
          />
        </Pressable>
      </View>

      {/* Summary stats */}
      {totalWorkouts > 0 ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <SummaryStat label="WORKOUTS" value={totalWorkouts.toLocaleString()} />
          <SummaryStat
            label="TOTAL VOLUME"
            value={Math.round(totalVolume).toLocaleString()}
            suffix="lb"
          />
        </View>
      ) : null}

      {/* List */}
      {isLoading ? (
        <View style={{ paddingVertical: theme.spacing["3xl"], alignItems: "center" }}>
          <Text variant="caption" color="textMuted">
            Loading…
          </Text>
        </View>
      ) : totalWorkouts === 0 ? (
        <View
          style={{
            paddingVertical: theme.spacing["3xl"],
            alignItems: "center",
            gap: theme.spacing.md,
          }}
        >
          <Ionicons name="barbell-outline" size={32} color={c.textFaint} />
          <Text variant="body" color="textMuted" center>
            No workouts logged yet.
          </Text>
        </View>
      ) : (
        <WorkoutHistoryList logs={logs} limit={logs.length} />
      )}
    </Screen>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: 2,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 0.6,
          fontWeight: "700",
          color: c.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          letterSpacing: -0.6,
          color: c.text,
        }}
      >
        {value}
        {suffix ? (
          <Text
            style={{
              fontSize: 12,
              color: c.textMuted,
              fontWeight: "700",
            }}
          >
            {" "}
            {suffix}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
