import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

export type ProgressRange = "7d" | "30d" | "90d" | "1y";

const OPTIONS: { value: ProgressRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "1y", label: "Last year" },
];

export function RangePicker({
  value,
  onChange,
}: {
  value: ProgressRange;
  onChange: (r: ProgressRange) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? c.surfaceAlt : "transparent",
        })}
      >
        <Ionicons name="reorder-three" size={22} color={c.textMuted} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={{ padding: theme.spacing.lg, gap: 4 }}>
          <Text variant="label" color="textMuted" style={{ marginBottom: theme.spacing.sm }}>
            RANGE
          </Text>
          {OPTIONS.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  backgroundColor: pressed ? c.surfaceAlt : "transparent",
                })}
              >
                <Text variant="body" weight={active ? "bold" : "regular"} style={{ flex: 1 }}>
                  {o.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={18} color={c.text} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
