import { View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/** Determinate progress bar. `value` is 0–1. */
export function Progress({
  value,
  height = 8,
  color,
}: {
  value: number;
  height?: number;
  color?: string;
}) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceAlt,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          borderRadius: theme.radius.full,
          backgroundColor: color ?? theme.colors.primary,
        }}
      />
    </View>
  );
}
