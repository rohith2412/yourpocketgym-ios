import { View, Pressable, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { Spacing } from "../theme/tokens";

type CardProps = {
  children: React.ReactNode;
  padding?: Spacing;
  onPress?: () => void;
  style?: ViewStyle;
};

/** Themed surface with border + radius. The building block for all lists/cards. */
export function Card({ children, padding = "lg", onPress, style }: CardProps) {
  const { theme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing[padding],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
