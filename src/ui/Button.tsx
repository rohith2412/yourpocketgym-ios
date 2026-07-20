import {
  Pressable,
  ActivityIndicator,
  View,
  type PressableProps,
} from "react-native";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  left,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

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
      style={({ pressed }) => [
        {
          height: 50,
          borderRadius: theme.radius.md,
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
          ...(variant === "primary" ? theme.shadow.sm : {}),
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={c[fg]} />
      ) : (
        <>
          {left ? <View>{left}</View> : null}
          <Text variant="body" weight="semibold" color={fg}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
