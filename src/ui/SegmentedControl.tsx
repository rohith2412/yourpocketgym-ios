import { View, Pressable } from "react-native";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";

/** shadcn "Tabs"-style segmented control for switching views inside a screen. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.surfaceAlt,
        borderRadius: theme.radius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => onChange(seg.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: "center",
              borderRadius: theme.radius.sm,
              backgroundColor: active ? c.surface : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: c.border,
            }}
          >
            <Text
              variant="label"
              weight={active ? "semibold" : "medium"}
              color={active ? "text" : "textMuted"}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
