import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Card, Text, Button, Separator } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { maxWeight, totalVolSets } from "../data";
import { useDeleteWorkout, type WorkoutLog } from "../api";

export function HistoryList({ logs, loading }: { logs: WorkoutLog[]; loading: boolean }) {
  const { theme } = useTheme();
  const del = useDeleteWorkout();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((v) => (v === id ? null : v)), 3000);
      return;
    }
    setConfirmId(null);
    del.mutate(id);
  };

  if (loading) {
    return <ActivityIndicator style={{ padding: 60 }} color={theme.colors.text} size="large" />;
  }

  if (!logs.length) {
    return (
      <View style={{ paddingVertical: theme.spacing["3xl"], alignItems: "center", gap: theme.spacing.md }}>
        <Text variant="heading">No workouts yet</Text>
        <Text variant="body" color="textMuted" center>
          Your history will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      {logs.map((log) => {
        const date = new Date(log.date);
        const isPending = confirmId === log._id;
        return (
          <Card key={log._id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.inverseBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: theme.colors.inverseText, fontSize: 8, opacity: 0.7, letterSpacing: 0.6 }}
                >
                  {date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.inverseText, lineHeight: 20 }}>
                  {date.getDate()}
                </Text>
              </View>
              <Text variant="heading" style={{ flex: 1 }}>
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </Text>
              <Button
                title={isPending ? "Confirm?" : "Delete"}
                variant={isPending ? "primary" : "ghost"}
                size="md"
                fullWidth={false}
                haptic="light"
                onPress={() => remove(log._id)}
              />
            </View>

            <Separator inset={0} />

            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              {log.exercises.map((ex, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.sm }}>
                  <Text variant="label" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {ex.sets.length} sets · {maxWeight(ex.sets)} lbs · {totalVolSets(ex.sets).toLocaleString()} vol
                  </Text>
                </View>
              ))}
            </View>

            {log.notes ? (
              <>
                <Separator inset={0} />
                <Text variant="caption" color="textMuted" style={{ fontStyle: "italic", marginTop: theme.spacing.sm }}>
                  "{log.notes}"
                </Text>
              </>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
