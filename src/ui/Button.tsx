import {
  Pressable,
  ActivityIndicator,
  View,
  type PressableProps,
  type GestureResponderEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";
import type { Radius } from "../theme/tokens";

type Variant = "primary" | "secondary" | "ghost";
type Haptic = "light" | "medium" | "heavy" | "none";

const IMPACT: Record<
  Exclude<Haptic, "none">,
  Haptics.ImpactFeedbackStyle
> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

type ButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
  /** Corner radius token. Default: "md". Use "full" for a pill. */
  radius?: Radius;
  /** Height/emphasis. Default: "md". */
  size?: "md" | "lg";
  /** Soft glowing halo in the button's own color (sparkle effect). */
  glow?: boolean;
  /** Tap vibration. Default: "light". Set "none" to disable. */
  haptic?: Haptic;
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  left,
  radius = "md",
  size = "md",
  glow = false,
  haptic = "light",
  onPress,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const height = size === "lg" ? 58 : 50;

  const handlePress = (e: GestureResponderEvent) => {
    if (haptic !== "none") {
      Haptics.impactAsync(IMPACT[haptic]).catch(() => {});
    }
    onPress?.(e);
  };

  // Sparkle: a soft halo tinted the button's own colour (white on dark).
  const glowStyle = glow
    ? {
        shadowColor: variant === "primary" ? c.inverseBg : c.text,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }
    : variant === "primary"
      ? theme.shadow.sm
      : {};

  const bg = {
    primary: c.inverseBg,
    secondary: c.surface,
    ghost: "transparent",
  }[variant];

  const fg: keyof typeof c = variant === "primary" ? "inverseText" : "text";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          height,
          borderRadius: theme.radius[radius],
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: bg,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: c.border,
          width: fullWidth ? "100%" : undefined,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          ...glowStyle,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={c[fg]} />
      ) : (
        <>
          {left ? <View>{left}</View> : null}
          <Text
            variant="body"
            weight="semibold"
            color={fg}
            style={{ fontSize: size === "lg" ? theme.fontSize.lg : theme.fontSize.md }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
