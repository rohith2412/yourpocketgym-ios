import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useAddWater, useWater } from "../hooks";
import { toISODay, WATER_GOAL_ML } from "../storage";

const QUICK = [250, 500, 1000];

export function WaterTracker() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: water } = useWater();
  const add = useAddWater();

  const today = toISODay();
  const ml = water?.[today] ?? 0;
  const pct = Math.min(1, ml / WATER_GOAL_ML);
  const L = (v: number) => (v / 1000).toFixed(1);

  const bump = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    add.mutate({ day: today, ml: delta });
  };

  const BLUE = "#3B82F6";

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(59, 130, 246, 0.14)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="water" size={22} color={BLUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
            WATER
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: theme.fontWeight.heavy,
                color: c.text,
                letterSpacing: -0.5,
              }}
            >
              {L(ml)}
            </Text>
            <Text variant="body" color="textMuted">
              / {L(WATER_GOAL_ML)} L
            </Text>
          </View>
        </View>
        {ml > 0 ? (
          <Pressable onPress={() => bump(-Math.min(ml, 250))} hitSlop={8}>
            <Ionicons name="remove-circle-outline" size={22} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: BLUE,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Quick-add pills */}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {QUICK.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => bump(ml)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.full,
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text variant="label" weight="bold" style={{ color: BLUE }}>
              +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
