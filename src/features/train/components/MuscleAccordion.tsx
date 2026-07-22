import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Text, Badge, Separator } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import type { WorkoutLog } from "../api";
import { maxWeight } from "../data";

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
  const [open, setOpen] = useState(false);

  // Collect all exercises for this MG across logs, deduped by name.
  const seen = new Set<string>();
  const exercises: WorkoutLog["exercises"] = [];
  logs.forEach((log) => {
    log.exercises.forEach((ex) => {
      if ((ex.muscleGroup || "").trim() === stat.mg && !seen.has(ex.name)) {
        seen.add(ex.name);
        exercises.push(ex);
      }
    });
  });

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
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          <Separator />
          {exercises.map((ex, i) => (
            <View key={i} style={{ paddingTop: theme.spacing.sm, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text variant="label" weight="bold">
                  {ex.name}
                </Text>
                <Text variant="caption" color="textMuted">
                  {maxWeight(ex.sets)} lbs max
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
        </View>
      ) : null}
    </Card>
  );
}
