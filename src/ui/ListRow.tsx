import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorTokens } from "../theme/tokens";

/** A tappable settings/menu row: optional leading icon, title/subtitle, right slot or chevron. */
export function ListRow({
  title,
  subtitle,
  icon,
  right,
  onPress,
  danger = false,
  chevron = true,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const titleColor: keyof ColorTokens = danger ? "danger" : "text";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={danger ? c.danger : c.textMuted} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="body" color={titleColor}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress && chevron ? (
        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      ) : null)}
    </Pressable>
  );
}
