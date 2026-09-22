import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

/**
 * A floating CTA pill layered over an empty chart.
 *
 * We tried blurring the chart underneath but it read as a stack of loose
 * blur boxes with pills instead of the actual chart with a prompt. Cleaner:
 * let the empty chart show through and float a single high-contrast pill
 * over it, centred. The empty chart itself is the hint of what the user is
 * about to fill in.
 */
export function LogOverlay({
  visible,
  label,
  icon = "add",
  onPress,
  children,
}: {
  visible: boolean;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={{ position: "relative" }}>
      {children}
      {visible ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.textMuted,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name={icon} size={18} color={c.text} />
            <Text variant="body" weight="bold" style={{ color: c.text, fontSize: 15 }}>
              {label}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
