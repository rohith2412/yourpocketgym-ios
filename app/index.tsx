import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated, Easing, Image, Pressable,
  StatusBar, StyleSheet, Text, View,
} from "react-native";
import { getToken } from "../src/auth/storage";

export default function Index() {
  const router = useRouter();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 6000,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      // ✅ FIX: was redirecting to /tracking — changed to /ai-trainer to match
      // where login.jsx sends authenticated users
      if (token) router.replace("/ai-trainer");
    };
    checkToken();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1], outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={[
          "rgba(255, 107, 53, 0.55)",
          "rgba(250, 76, 13, 0.25)",
          "rgba(227, 64, 5, 0.08)",
          "transparent",
        ]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.5 }}
        style={s.glow}
        pointerEvents="none"
      />

      <Animated.View
        style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* LOGO */}
        <View style={s.logoSection}>
          <Text style={s.tagline}>The gym</Text>
          <View style={s.taglineRow}>
            <Text style={s.tagline}>in y</Text>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Image
                source={require("../assets/images/logo.png")}
                style={s.inlineLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={s.tagline}>ur</Text>
          </View>
          <Text style={s.taglineOrange}>pocket.</Text>
        </View>

        <View style={s.spacer} />

        {/* BOTTOM */}
        <View style={s.bottomSection}>
          <Pressable onPress={() => router.push("/register")} style={s.signInBtn}>
            <Text style={s.signInBtnText}>Sign up for free →</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/login")}>
            <Text style={s.loginText}>
              Already have an account? <Text style={s.loginLink}>Sign in</Text>
            </Text>
          </Pressable>

          <Text style={s.terms}>
            By continuing, you agree to our{" "}
            <Text style={s.termsLink}>Terms of Service</Text> and{" "}
            <Text style={s.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  glow: {
    position: "absolute", top: -120, right: -120,
    width: 700, height: 1000, borderRadius: 300,
  },
  inner: {
    flex: 1, paddingHorizontal: 28,
    paddingTop: 120, paddingBottom: 48,
  },
  logoSection: { alignItems: "flex-start" },
  tagline: {
    fontSize: 58, fontWeight: "800", color: "#1a1a1a",
    letterSpacing: -2, lineHeight: 62,
  },
  taglineRow: { flexDirection: "row", alignItems: "center" },
  inlineLogo: { width: 40, height: 40, marginHorizontal: 3, marginBottom: 2 },
  taglineOrange: {
    fontSize: 58, fontWeight: "800", color: "#ff6b35",
    letterSpacing: -2, lineHeight: 62,
  },
  spacer: { flex: 1 },
  bottomSection: { gap: 12 },
  signInBtn: {
    backgroundColor: "#1a1a1a", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  signInBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
  loginText: { textAlign: "center", fontSize: 13, color: "#aaa", marginTop: 4 },
  loginLink: { color: "#ff6b35", fontWeight: "700" },
  terms: { fontSize: 11, color: "#bbb", lineHeight: 18, textAlign: "center", marginTop: 4 },
  termsLink: { color: "#888", textDecorationLine: "underline" },
});