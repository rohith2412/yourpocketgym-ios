import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Animated,
    Easing,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { saveToken } from "../src/auth/storage";
//handleLogin
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

// Replace the entire handleLogin function:
const handleLogin = async () => {
  if (!email || !password) return;
  setLoading(true);

  try {
    const res = await fetch("https://yourpocketgym.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || "Login failed");
      return;
    }
        await saveToken(data.token);

    // Save both token AND user object — useAuth needs both
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));

    // Redirect based on hasIntro from login response (no extra fetch needed)
    if (!data.user.hasIntro) {
      router.replace("/startersIntro");
    } else {
      router.replace("/ai-trainer");
    }
  } catch (err) {
    alert("Something went wrong. Check your connection.");
  } finally {
    setLoading(false);
  }
};

  const isValid = email && password;

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            s.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* HEADER handleLogin */}
          <View style={s.headerSection}>
            <View style={s.logoRow}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={s.logoSmall}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={s.logoName}>PocketGym</Text>
            </View>
            <Text style={s.title}>
              Welcome{"\n"}
              <Text style={s.titleOrange}>back.</Text>
            </Text>
            <Text style={s.subtitle}>Sign in to continue your journey.</Text>
          </View>

          {/* FORM */}
          <View style={s.form}>
            <View style={s.inputWrapper}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="#ccc"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                placeholder="Your password"
                placeholderTextColor="#ccc"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={!isValid || loading}
              style={[s.btn, (!isValid || loading) && s.btnDisabled]}
            >
              <Text style={s.btnText}>
                {loading ? "Signing in..." : "Sign In →"}
              </Text>
            </Pressable>
          </View>

          {/* SPACER */}
          <View style={s.spacer} />

          {/* FOOTER */}
          <View style={s.footer}>
            <Pressable onPress={() => router.replace("/register")}>
              <Text style={s.footerText}>
                Don't have an account?{" "}
                <Text style={s.footerLink}>Create one</Text>
              </Text>
            </Pressable>
            <Text style={s.terms}>
              By continuing, you agree to our{" "}
              <Text style={s.termsLink}>Terms of Service</Text> and{" "}
              <Text style={s.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  glow: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
    gap: 36,
  },
  headerSection: { gap: 12 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logoSmall: { width: 28, height: 28 },
  logoName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -2,
    lineHeight: 52,
  },
  titleOrange: { color: "#ff6b35" },
  subtitle: { fontSize: 15, color: "#aaa", marginTop: 4 },
  form: { gap: 16 },
  inputWrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 15,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e8e5de",
  },
  btn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  spacer: { flex: 1 },
  footer: { gap: 14, alignItems: "center" },
  footerText: { fontSize: 13, color: "#aaa" },
  footerLink: { color: "#ff6b35", fontWeight: "700" },
  terms: { fontSize: 11, color: "#bbb", lineHeight: 18, textAlign: "center" },
  termsLink: { color: "#888", textDecorationLine: "underline" },
});
