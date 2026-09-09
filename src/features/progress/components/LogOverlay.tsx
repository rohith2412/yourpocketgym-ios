import { View, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

/**
 * A frosted CTA layer for empty charts.
 *
 * On Progress a fresh install would otherwise show flatline curves and "0 lb
 * moved" — reads as broken. Instead, when the chart underneath has no data,
 * we keep it in place as a preview (so users see what the chart *will* look
 * like once they log) and float a blurred call-to-action on top of it.
 *
 * Wrap a chart with this component to get the pattern:
 *
 *   <LogOverlay visible={workouts.length === 0} label="Log a workout" onPress={…}>
 *     <ActivityChart />
 *   </LogOverlay>
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
          // Cover the child, but let normal children still be measurable
          // (blur here would break onLayout etc. underneath if we used a
          // proper overlay pattern — this way is simplest and works because
          // the chart underneath is inert while empty).
          style={{
            ...StyleSheetAbsoluteFill,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: theme.radius["2xl"],
          }}
          pointerEvents="box-none"
        >
          {/* The blur softens the empty chart behind the button so the
              flatline stops looking like a broken axis. */}
          <BlurView
            intensity={20}
            tint={theme.mode === "dark" ? "dark" : "light"}
            style={{
              ...StyleSheetAbsoluteFill,
              borderRadius: theme.radius["2xl"],
              overflow: "hidden",
            }}
          />
          {/* A tinted wash keeps the button legible over the blur — pure
              blur alone can still be busy when the chart has grid lines. */}
          <View
            style={{
              ...StyleSheetAbsoluteFill,
              borderRadius: theme.radius["2xl"],
              backgroundColor:
                theme.mode === "dark" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.20)",
            }}
          />

          <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: c.inverseBg,
              opacity: pressed ? 0.85 : 1,
              // Small lift so the pill reads as floating rather than pasted.
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            })}
          >
            <Ionicons name={icon} size={18} color={c.inverseText} />
            <Text variant="body" weight="bold" style={{ color: c.inverseText, fontSize: 15 }}>
              {label}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// Inline to avoid an extra file and stay readable at the call sites.
const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
