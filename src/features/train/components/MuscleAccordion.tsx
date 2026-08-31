import { useState } from "react";
import { View, Pressable } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Card, Text, Separator, Button } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useDeleteWorkout, type WorkoutLog } from "../api";
import { maxWeight, totalVolSets } from "../data";

/** Trim fake precision from a lb value. Whole numbers stay whole (185 lb),
 *  half-plates stay as decimals (187.5 lb). Never renders more than one decimal. */
function fmtLb(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}


type Stat = {
  mg: string;
  lastBest: number;
  delta: number | null;
  exNames: string[];
  sessionCount: number;
  /** Best weight per session, oldest → newest. Drives the row's sparkline. */
  history: number[];
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
      // Sessions arrive newest-first; a trend line has to read left to right.
      const history = sessions
        .slice(0, 10)
        .map((x) => x.bestWeight)
        .reverse();
      return {
        mg,
        lastBest: last.bestWeight,
        delta,
        exNames,
        sessionCount: sessions.length,
        history,
      };
    })
    .sort((a, b) => a.mg.localeCompare(b.mg));
}

/**
 * The change since the previous session.
 *
 * All three states render the same shape — previously "1st" and "= 0" used the
 * shared Badge while up/down used a hand-rolled View, so they had different
 * heights and didn't line up down the column. A minWidth keeps the chips a
 * consistent size regardless of digit count, so the right edge stays straight.
 */
function DeltaBadge({ delta }: { delta: number | null }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;

  const tint = up ? c.success : down ? c.danger : c.textMuted;
  const label =
    delta === null ? "1st" : delta === 0 ? "—" : fmtLb(Math.abs(delta));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        minWidth: 58,
        height: 22,
        paddingHorizontal: 8,
        borderRadius: 999,
        backgroundColor: tint + "1F",
      }}
    >
      {up || down ? (
        <Ionicons
          name={up ? "caret-up" : "caret-down"}
          size={10}
          color={tint}
        />
      ) : null}
      <Text style={{ fontSize: 12, fontWeight: "700", color: tint }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * A compressed trend of recent session bests.
 *
 * Deliberately unlabelled and unscaled — it isn't there to be read off, it's
 * there so a glance down the list shows which groups are climbing and which
 * have flattened. The single number beside it carries the precision.
 */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 56;
  const H = 18;
  if (values.length < 2) return <View style={{ width: W, height: H }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    // Inset vertically so a flat line doesn't sit flush against the edge.
    y: H - 2 - ((v - min) / span) * (H - 4),
  }));

  const d = pts
    .map((p, i) =>
      i === 0
        ? `M${p.x},${p.y}`
        : `L${p.x},${p.y}`,
    )
    .join(" ");

  const last = pts[pts.length - 1];

  return (
    <Svg width={W} height={H}>
      <Path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={2} fill={color} />
    </Svg>
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
          <Sparkline values={stat.history} color={theme.colors.textMuted} />
          <View style={{ alignItems: "flex-end", gap: 3 }}>
            <Text style={{ fontSize: 22, fontWeight: theme.fontWeight.heavy, color: theme.colors.text, letterSpacing: -0.5 }}>
              {fmtLb(stat.lastBest)}
              <Text variant="caption" color="textMuted">
                {" "}
                lb
              </Text>
            </Text>
            <DeltaBadge delta={stat.delta} />
          </View>
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
                        {maxWeight(ex.sets)} lb max · {totalVolSets(ex.sets).toLocaleString()} vol
                      </Text>
                    </View>
                    {ex.sets.map((s, j) => (
                      <View key={j} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                        <Text variant="caption" color="textFaint" weight="bold" style={{ width: 18, textAlign: "center" }}>
                          {j + 1}
                        </Text>
                        <Text variant="caption" color="textMuted">
                          {s.reps} × {s.weight} lb
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
