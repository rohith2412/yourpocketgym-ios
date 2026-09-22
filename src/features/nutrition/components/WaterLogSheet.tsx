import { useEffect, useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BottomSheet, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useAddWater, useSaveWaterGoal, useWater, useWaterGoal } from "../hooks";
import { toISODay, WATER_GOAL_ML } from "../storage";

const BLUE = "#38BDF8";
const BLUE_DARK = "#0284C7";
// Quick-add options in ML, labeled in L.
const QUICK: { ml: number; label: string }[] = [
  { ml: 250, label: "+0.25L" },
  { ml: 500, label: "+0.5L" },
  { ml: 1000, label: "+1L" },
];

type Props = { visible: boolean; onClose: () => void };

export function WaterLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const today = toISODay();

  const { data: water } = useWater();
  const { data: goalMl = WATER_GOAL_ML } = useWaterGoal();
  const addM = useAddWater();
  const saveGoal = useSaveWaterGoal();

  const ml = water?.[today] ?? 0;
  const pct = Math.min(1, ml / goalMl);
  // Show 2 decimals under 1 L (so 250 ml reads as 0.25 L, not 0.3 L).
  const L = (v: number) => {
    const liters = v / 1000;
    return liters < 1 ? liters.toFixed(2) : liters.toFixed(1);
  };

  // Goal is edited in liters (decimal), stored in ml.
  const [goalInput, setGoalInput] = useState((goalMl / 1000).toString());

  useEffect(() => {
    if (visible) setGoalInput((goalMl / 1000).toString());
  }, [visible, goalMl]);

  const bump = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addM.mutate({ day: today, ml: delta });
  };

  const commitGoal = () => {
    const liters = parseFloat(goalInput || "0") || WATER_GOAL_ML / 1000;
    const clamped = Math.max(0.5, Math.min(10, liters));
    const ml = Math.round(clamped * 1000);
    if (ml !== goalMl) saveGoal.mutate(ml);
    setGoalInput(clamped.toString());
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ gap: 4 }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
            WATER
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: c.text, letterSpacing: -1 }}>
              {L(ml)}
            </Text>
            <Text variant="body" color="textMuted">
              / {L(goalMl)} L · {Math.round(pct * 100)}%
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: c.surfaceAlt,
            overflow: "hidden",
          }}
        >
          <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: BLUE, borderRadius: 4 }} />
        </View>

        {/* Quick add */}
        <View style={{ gap: 8 }}>
          <Text variant="label" color="textMuted">
            ADD
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {QUICK.map((q) => (
              <Pressable
                key={q.ml}
                onPress={() => bump(q.ml)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 52,
                  borderRadius: theme.radius.lg,
                  backgroundColor: BLUE,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text variant="body" weight="bold" style={{ color: "#ffffff" }}>
                  {q.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {ml > 0 ? (
            <Pressable
              onPress={() => bump(-Math.min(ml, 250))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="arrow-undo" size={16} color={c.textMuted} />
              <Text variant="caption" color="textMuted">
                Undo last 0.25 L
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Daily goal editor */}
        <View style={{ gap: 6 }}>
          <Text variant="label" color="textMuted">
            DAILY GOAL
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              height: 52,
            }}
          >
            <TextInput
              value={goalInput}
              onChangeText={(t) => setGoalInput(t.replace(/[^0-9.]/g, ""))}
              onBlur={commitGoal}
              onSubmitEditing={commitGoal}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={{ flex: 1, fontSize: 22, fontWeight: "800", color: c.text, paddingVertical: 0 }}
            />
            <Text variant="body" color="textMuted">
              L / day
            </Text>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
