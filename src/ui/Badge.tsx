import { View } from "react-native";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorTokens } from "../theme/tokens";

type Variant = "default" | "primary" | "success" | "danger" | "muted" | "outline";

export function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: Variant;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const map: Record<Variant, { bg: string; fg: keyof ColorTokens; border?: string }> = {
    default: { bg: c.inverseBg, fg: "inverseText" },
    primary: { bg: c.primary + "22", fg: "primary" },
    success: { bg: c.success + "22", fg: "success" },
    danger: { bg: c.danger + "22", fg: "danger" },
    muted: { bg: c.surfaceAlt, fg: "textMuted" },
    outline: { bg: "transparent", fg: "text", border: c.border },
  };
  const s = map[variant];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.full,
        backgroundColor: s.bg,
        borderWidth: s.border ? 1 : 0,
        borderColor: s.border,
      }}
    >
      <Text variant="caption" weight="semibold" color={s.fg}>
        {label}
      </Text>
    </View>
  );
}
