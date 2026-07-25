import { useMemo } from "react";
import { View } from "react-native";
import Body, { type Slug, type ExtendedBodyPart } from "react-native-body-highlighter";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useWorkoutLogs } from "../../train/api";
import { totalVolSets } from "../../train/data";
import { toISODay } from "../../nutrition/storage";

type Group = "Chest" | "Back" | "Shoulders" | "Arms" | "Legs" | "Core";

const GROUP_SLUGS: Record<Group, Slug[]> = {
  Chest: ["chest"],
  Back: ["upper-back", "lower-back", "trapezius"],
  Shoulders: ["deltoids"],
  Arms: ["biceps", "triceps", "forearm"],
  Legs: ["quadriceps", "hamstring", "calves", "gluteal", "adductors"],
  Core: ["abs", "obliques"],
};

// Orange heat ramp — 5 levels of intensity (mapped to library colors array)
const HEAT_COLORS = [
  "#F9731633", // faint
  "#F9731666",
  "#F9731699",
  "#F97316CC",
  "#F97316FF", // hot
] as const;

export function BodyHeatmap() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: workouts = [] } = useWorkoutLogs();

  const { data, mostGroup, leastGroup } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffIso = toISODay(cutoff);

    const vol: Record<Group, number> = {
      Chest: 0, Back: 0, Shoulders: 0, Arms: 0, Legs: 0, Core: 0,
    };

    workouts.forEach((w) => {
      if (toISODay(new Date(w.date)) < cutoffIso) return;
      w.exercises.forEach((ex) => {
        const g = (ex.muscleGroup as Group) ?? null;
        if (g && g in vol) vol[g] += totalVolSets(ex.sets);
      });
    });

    const max = Math.max(1, ...Object.values(vol));

    // Convert to library data — 1..5 intensity levels per slug
    const data: ExtendedBodyPart[] = [];
    (Object.keys(vol) as Group[]).forEach((g) => {
      const norm = vol[g] / max; // 0..1
      if (norm <= 0) return;
      const level = Math.max(1, Math.min(HEAT_COLORS.length, Math.ceil(norm * HEAT_COLORS.length)));
      GROUP_SLUGS[g].forEach((slug) => data.push({ slug, intensity: level }));
    });

    const entries = Object.entries(vol) as [Group, number][];
    const worked = entries.filter(([, v]) => v > 0);
    const mostGroup = worked.length ? worked.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : null;
    const leastGroup = worked.length > 1 ? worked.reduce((a, b) => (b[1] < a[1] ? b : a))[0] : null;

    return { data, mostGroup, leastGroup };
  }, [workouts]);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
      }}
    >
      <View style={{ marginBottom: theme.spacing.sm }}>
        <Text variant="body" weight="bold">Muscle balance</Text>
        <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>This week</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 12, paddingVertical: 2 }}>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Body
            data={data}
            side="front"
            gender="male"
            scale={0.6}
            colors={HEAT_COLORS as unknown as string[]}
            border={c.border}
            defaultFill={c.surfaceAlt}
          />
          <Text variant="caption" color="textFaint" style={{ fontSize: 10, letterSpacing: 1 }}>FRONT</Text>
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Body
            data={data}
            side="back"
            gender="male"
            scale={0.6}
            colors={HEAT_COLORS as unknown as string[]}
            border={c.border}
            defaultFill={c.surfaceAlt}
          />
          <Text variant="caption" color="textFaint" style={{ fontSize: 10, letterSpacing: 1 }}>BACK</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.sm, flexWrap: "wrap" }}>
        {mostGroup ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: HEAT_COLORS[HEAT_COLORS.length - 1] }} />
            <Text variant="caption" style={{ fontSize: 10 }}>
              Most: <Text variant="caption" weight="bold" style={{ fontSize: 10 }}>{mostGroup}</Text>
            </Text>
          </View>
        ) : null}
        {leastGroup ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.textFaint }} />
            <Text variant="caption" style={{ fontSize: 10 }}>
              Least: <Text variant="caption" weight="bold" style={{ fontSize: 10 }}>{leastGroup}</Text>
            </Text>
          </View>
        ) : null}
        {!mostGroup ? (
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>No workouts this week yet.</Text>
        ) : null}
      </View>
    </View>
  );
}
