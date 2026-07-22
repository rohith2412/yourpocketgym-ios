import { useEffect, useRef } from "react";
import { View, Image, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";

export function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* ── Top: logo + name ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingTop: theme.spacing.lg,
          }}
        >
          <Image
            source={require("../../../assets/images/logo-v2.png")}
            style={{ width: 26, height: 26, tintColor: theme.colors.text }}
            resizeMode="contain"
          />
          <Text variant="heading" weight="bold">
            PocketGym
          </Text>
        </View>

        {/* ── Center: tagline ── */}
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            opacity: fade,
            transform: [{ translateY: slide }],
          }}
        >
          <Text
            center
            style={{
              fontSize: 56,
              lineHeight: 60,
              fontWeight: theme.fontWeight.heavy,
              color: theme.colors.text,
              letterSpacing: -1.5,
            }}
          >
            Get fit.
          </Text>
          <Text
            variant="body"
            color="textMuted"
            center
            style={{ fontSize: theme.fontSize.lg, marginTop: theme.spacing.md }}
          >
            Your pocket-sized personal gym.
          </Text>
        </Animated.View>

        {/* ── Bottom: CTA ── */}
        <View style={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.md }}>
          <Button
            title="Get Started"
            variant="primary"
            radius="full"
            size="lg"
            glow
            onPress={() => router.push("/login")}
          />
        </View>
      </View>
    </Screen>
  );
}
