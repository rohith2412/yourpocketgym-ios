import { View, Pressable } from "react-native";
import { Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { ProMark } from "./ProMark";

/**
 * The upgrade card.
 *
 * Not a gold bar. A gradient slab shouting "Get Premium" is the pattern free
 * apps used a decade ago; it reads as an ad inside your own product, and it
 * fought the paywall it opens, which is flat black with a white button.
 *
 * This is the shape the App Store's better subscription apps settled on: a card
 * that names the product and what you get, with the action as a real button on
 * the right. It sells by being specific rather than by being loud.
 */
export function PremiumCta({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Upgrade to PocketGym Pro"
      style={({ pressed }) => ({
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        padding: theme.spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProMark size={19} color={c.text} strokeWidth={1.9} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="bold">
          PocketGym Pro
        </Text>
        {/* Naming the features does the persuading — "Get Premium" tells you
            nothing about what you'd actually be buying. */}
        <Text variant="caption" color="textMuted" numberOfLines={1} style={{ fontSize: 12 }}>
          AI coach, photo scanning, voice logging
        </Text>
      </View>

      {/* The same white pill the paywall uses for its CTA, so the tap that
          follows lands somewhere that looks like where it came from. */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: c.inverseBg,
        }}
      >
        <Text variant="caption" weight="bold" style={{ fontSize: 13, color: c.inverseText }}>
          Upgrade
        </Text>
      </View>
    </Pressable>
  );
}
