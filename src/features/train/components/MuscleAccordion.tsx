import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Text, Badge, Separator, Button } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useDeleteWorkout, type WorkoutLog } from "../api";
import { maxWeight, totalVolSets } from "../data";

type Stat = {
  mg: string;
  lastBest: number;
  delta: number | null;
  exNames: string[];
  sessionCount: number;
};

export function buildMuscleStats(logs: WorkoutLog[]): Stat[] {
  const grouped: Record<string, { date: string; bestWeight: number; exNames: string[] }[]> = {};
  logs.forEach((log) => {
    const seen = new Set<string>();
    log.exercises.forEach((ex) => {
      const mg = (ex.muscleGroup || "").trim();
      if (!mg || seen.has(mg)) return;
      seen.add(mg);
      const mgExs = log.exercises.filter((e) => (e.muscleGroup || "").trim() === mg);
      const weights = mgExs.flatMap((e) => e.sets.map((s) => s.weight));
      const best = weights.length ? Math.max(...weights) : 0;
      const names = [...new Set(mgExs.map((e) => e.name))];
      (grouped[mg] ||= []).push({ date: log.date, bestWeight: best, exNames: names });
    });
  });

  return Object.entries(grouped)
    .map(([mg, sessions]) => {
      const last = sessions[0];
      const prev = sessions[1] ?? null;
      const delta = prev ? last.bestWeight - prev.bestWeight : null;
      const exNames = [...new Set(sessions.flatMap((s) => s.exNames))];
      return { mg, lastBest: last.bestWeight, delta, exNames, sessionCount: sessions.length };
    })
    .sort((a, b) => a.mg.localeCompare(b.mg));
}

function DeltaBadge({ delta }: { delta: number | null }) {
  const { theme } = useTheme();
  if (delta === null) return <Badge label="1st" variant="muted" />;
  if (delta === 0) return <Badge label="= 0" variant="muted" />;
  const up = delta > 0;
  return (
    <View
      style={{
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 3,
        backgroundColor: up ? theme.colors.success + "22" : theme.colors.danger + "22",
      }}
    >
      <Text
        variant="caption"
        weight="bold"
        style={{ color: up ? theme.colors.success : theme.colors.danger }}
      >
        {up ? "▲" : "▼"} {Math.abs(delta)}
      </Text>
    </View>
  );
}

export function MuscleAccordionRow({ stat, logs }: { stat: Stat; logs: WorkoutLog[] }) {
  const { theme } = useTheme();
  const del = useDeleteWorkout();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Every log that touched this muscle group — newest first.
  const relevantLogs = logs.filter((log) =>
    log.exercises.some((ex) => (ex.muscleGroup || "").trim() === stat.mg),
  );

  const removeLog = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((v) => (v === id ? null : v)), 3000);
      return;
    }
    setConfirmId(null);
    del.mutate(id);
  };

  return (
    <Card padding="lg">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View>
          <Text variant="body" weight="bold">
            {stat.mg}
          </Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 3 }}>
            {stat.sessionCount} session{stat.sessionCount !== 1 ? "s" : ""} · {stat.exNames.length}{" "}
            exercise{stat.exNames.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <Text style={{ fontSize: 22, fontWeight: theme.fontWeight.heavy, color: theme.colors.text, letterSpacing: -0.5 }}>
            {stat.lastBest}
            <Text variant="caption" color="textMuted">
              {" "}
              lbs
            </Text>
          </Text>
          <DeltaBadge delta={stat.delta} />
          <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.textFaint} />
        </View>
      </Pressable>

      {open ? (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          <Separator />
          {relevantLogs.map((log) => {
            const isPending = confirmId === log._id;
            const date = new Date(log.date);
            const mgExercises = log.exercises.filter(
              (ex) => (ex.muscleGroup || "").trim() === stat.mg,
            );
            return (
              <View key={log._id} style={{ gap: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="bold">
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <Button
                    title={isPending ? "Confirm?" : "Delete"}
                    variant={isPending ? "primary" : "ghost"}
                    size="md"
                    fullWidth={false}
                    haptic="light"
                    onPress={() => removeLog(log._id)}
                  />
                </View>

                {mgExercises.map((ex, ei) => (
                  <View key={ei} style={{ gap: 4, paddingLeft: theme.spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Text variant="label" weight="bold">
                        {ex.name}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {maxWeight(ex.sets)} lbs max · {totalVolSets(ex.sets).toLocaleString()} vol
                      </Text>
                    </View>
                    {ex.sets.map((s, j) => (
                      <View key={j} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                        <Text variant="caption" color="textFaint" weight="bold" style={{ width: 18, textAlign: "center" }}>
                          {j + 1}
                        </Text>
                        <Text variant="caption" color="textMuted">
                          {s.reps} × {s.weight} lbs
                        </Text>
                        <Text variant="caption" color="textFaint" style={{ marginLeft: "auto" }}>
                          {(s.reps * s.weight).toLocaleString()} vol
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}

                <Separator />
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}
