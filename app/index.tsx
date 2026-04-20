import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { getToken } from "../src/auth/storage";

export default function Index() {
  const router = useRouter();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      if (token) router.replace("/tracking");
    };
    checkToken();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Mesh gradient background ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <RadialGradient id="bg_a" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#6d28d9" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#6d28d9" stopOpacity="0"    />
            </RadialGradient>
            <RadialGradient id="bg_b" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#3730a3" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#3730a3" stopOpacity="0"   />
            </RadialGradient>
            <RadialGradient id="bg_c" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#f43f5e" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#f43f5e" stopOpacity="0"    />
            </RadialGradient>
            <RadialGradient id="bg_d" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#1e1b4b" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0f0a1e" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Deep dark base */}
          <Rect width="390" height="844" fill="#0c0a1e" />

          {/* Colour blobs */}
          <Ellipse cx="320" cy="120"  rx="340" ry="300" fill="url(#bg_a)" />
          <Ellipse cx="50"  cy="240"  rx="300" ry="280" fill="url(#bg_b)" />
          <Ellipse cx="200" cy="80"   rx="240" ry="200" fill="url(#bg_c)" />
          <Ellipse cx="60"  cy="700"  rx="280" ry="260" fill="url(#bg_b)" />
          <Ellipse cx="340" cy="780"  rx="260" ry="220" fill="url(#bg_a)" />

          {/* Dark vignette overlay */}
          <Ellipse cx="195" cy="422"  rx="350" ry="500" fill="url(#bg_d)" />
        </Svg>
      </View>

      <Animated.View
        style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* ── Logo / wordmark ── */}
        <View style={s.logoSection}>
          {/* Frosted pill badge */}
          <View style={s.badge}>
            <Text style={s.badgeText}>✦ Your Pocket Gym</Text>
          </View>

          <Text style={s.headline}>The gym{"\n"}in your</Text>
          <View style={s.taglineRow}>
            <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseAnim }] }}>
              <Image
                source={require("../assets/images/logo.png")}
                style={s.inlineLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={s.headlinePocket}>pocket.</Text>
          </View>

          <Text style={s.sub}>
            AI coaching · smart macros · habit tracking —{"\n"}all in one place.
          </Text>
        </View>

        {/* ── Feature chips ── */}
        <View style={s.chips}>
          {["🤖 AI Trainer", "🥗 Macro Scanner", "📅 Habit Tracker", "🍳 Recipes"].map((c) => (
            <View key={c} style={s.chip}>
              <Text style={s.chipText}>{c}</Text>
            </View>
          ))}
        </View>

        <View style={s.spacer} />

        {/* ── CTAs ── */}
        <View style={s.bottomSection}>
          <Pressable
            onPress={() => router.push("/register")}
            style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.88 }]}
          >
            <View style={s.primaryBtnInner}>
              <Text style={s.primaryBtnText}>Get started free →</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => router.push("/login")}>
            <Text style={s.loginText}>
              Already have an account?{" "}
              <Text style={s.loginLink}>Sign in</Text>
            </Text>
          </Pressable>

          <Text style={s.terms}>
            By continuing you agree to our{" "}
            <Text style={s.termsLink}>Terms</Text> &{" "}
            <Text style={s.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0a1e" },

  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 52,
  },

  logoSection: { alignItems: "flex-start" },

  badge: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  headline: {
    fontSize: 62,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -2.5,
    lineHeight: 64,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  inlineLogo: {
    width: 52,
    height: 52,
    marginRight: 6,
    marginBottom: 2,
  },
  headlinePocket: {
    fontSize: 62,
    fontWeight: "800",
    color: "#a78bfa",
    letterSpacing: -2.5,
    lineHeight: 64,
  },

  sub: {
    marginTop: 20,
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 23,
    letterSpacing: 0.1,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 28,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 100,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600",
  },

  spacer: { flex: 1 },

  bottomSection: { gap: 14 },

  primaryBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryBtnInner: {
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  loginText: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  loginLink: { color: "#a78bfa", fontWeight: "700" },

  terms: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 2,
  },
  termsLink: { color: "rgba(255,255,255,0.4)", textDecorationLine: "underline" },
});
