import { useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Card, ListRow, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { WeightChart } from "./components/WeightChart";
import { WeightLogSheet } from "./WeightLogSheet";
import { useWeightLog } from "./hooks";
import { deleteWeight, latestWeight, type WeightEntry } from "./storage";

/**
 * The Body weight modification page — lives inside the More menu.
 * Shows current weight, log button, and a history list you can delete from.
 * The chart itself stays on the Progress tab.
 */
export default function BodyWeightScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const qc = useQueryClient();
  const [showLog, setShowLog] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: log = [] } = useWeightLog();
  const latest = latestWeight(log);
  const previous = log.length > 1 ? log[log.length - 2] : null;
  const delta = latest && previous ? latest.lb - previous.lb : null;

  const remove = useMutation({
    mutationFn: (id: string) => deleteWeight(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight-log"] }),
  });

  const confirmDelete = (entry: WeightEntry) => {
    Alert.alert(
      "Delete entry?",
      `${entry.lb.toFixed(1)} lb on ${new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => remove.mutate(entry.id),
        },
      ],
    );
  };

  const sorted = [...log].sort((a, b) => (a.date > b.date ? -1 : 1));
  const HISTORY_LIMIT = 10;
  const visible = showAll ? sorted : sorted.slice(0, HISTORY_LIMIT);
  const hiddenCount = sorted.length - visible.length;

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.lg }}>
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
            Track it
          </Text>
          <Text variant="title">Body weight</Text>
        </View>
      </View>

      {/* Chart */}
      <WeightChart />

      {/* Current weight card */}
      <Card>
        <View style={{ gap: 4 }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
            CURRENT
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: c.text, letterSpacing: -1 }}>
              {latest ? latest.lb.toFixed(1) : "—"}
            </Text>
            <Text variant="body" color="textMuted">
              lb
            </Text>
            {delta !== null ? (
              <Text
                variant="caption"
                weight="bold"
                style={{
                  marginLeft: "auto",
                  color: delta < 0 ? c.success : delta > 0 ? c.danger : c.textMuted,
                }}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} lb since last
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      {/* Log button */}
      <Pressable
        onPress={() => setShowLog(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 54,
          borderRadius: theme.radius.lg,
          backgroundColor: c.inverseBg,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" size={20} color={c.inverseText} />
        <Text variant="body" weight="bold" style={{ color: c.inverseText }}>
          {latest ? "Log today's weight" : "Log your first weight"}
        </Text>
      </Pressable>

      {/* History */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          HISTORY · {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
        </Text>
        {sorted.length === 0 ? (
          <Card>
            <Text variant="body" color="textMuted" center>
              Nothing logged yet.
            </Text>
          </Card>
        ) : (
          <>
            <Card padding="sm">
              {visible.map((entry, i) => (
                <View key={entry.id}>
                  {i > 0 ? <Separator inset={theme.spacing.lg} /> : null}
                  <ListRow
                    title={`${entry.lb.toFixed(1)} lb`}
                    subtitle={new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    icon="scale-outline"
                    chevron={false}
                    right={
                      <Pressable onPress={() => confirmDelete(entry)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={c.textMuted} />
                      </Pressable>
                    }
                  />
                </View>
              ))}
            </Card>
            {hiddenCount > 0 ? (
              <Pressable
                onPress={() => setShowAll(true)}
                style={({ pressed }) => ({
                  alignSelf: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text variant="caption" weight="bold" color="textMuted">
                  Show {hiddenCount} more
                </Text>
              </Pressable>
            ) : showAll && sorted.length > HISTORY_LIMIT ? (
              <Pressable
                onPress={() => setShowAll(false)}
                style={({ pressed }) => ({
                  alignSelf: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text variant="caption" weight="bold" color="textMuted">
                  Show less
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <WeightLogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </Screen>
  );
}
