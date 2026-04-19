import { useEffect, useRef, useState } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { saveToken } from "../src/auth/storage";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
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

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const res = await fetch("https://yourpocketgym.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      await saveToken(data.token);

      // Check if user intro exists (same as login)
      const introRes = await fetch(
        "https://yourpocketgym.com/api/user-intro",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
        },
      );

      const introData = await introRes.json();

      if (!introRes.ok || !introData?.exists) {
        router.replace("/startersIntro");
      } else {
        router.replace("/tracking");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isValid = name && email && password.length >= 6;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={[
          "rgba(109, 40, 217, 0.5)",
          "rgba(55, 48, 163, 0.22)",
          "rgba(109, 40, 217, 0.07)",
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
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              s.inner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* HEADER handleRegister */}
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
                Create your{"\n"}
                <Text style={s.titleOrange}>account.</Text>
              </Text>
              <Text style={s.subtitle}>Start your fitness journey today.</Text>
            </View>

            {/* FORM */}
            <View style={s.form}>
              <View style={s.inputWrapper}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="John Doe"
                  placeholderTextColor="#ccc"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#ccc"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={!isValid || loading}
                style={[s.btn, (!isValid || loading) && s.btnDisabled]}
              >
                <Text style={s.btnText}>
                  {loading ? "Creating account..." : "Create Account →"}
                </Text>
              </Pressable>
            </View>

            {/* FOOTER */}
            <View style={s.footer}>
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={s.footerText}>
                  Already have an account?{" "}
                  <Text style={s.footerLink}>Sign in</Text>
                </Text>
              </Pressable>
              <Text style={s.terms}>
                By continuing, you agree to our{" "}
                <Text style={s.termsLink}>Terms of Service</Text> and{" "}
                <Text style={s.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
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
  scroll: { flexGrow: 1 },
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
  titleOrange: { color: "#7c3aed" },
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
  footer: { gap: 14, alignItems: "center" },
  footerText: { fontSize: 13, color: "#aaa" },
  footerLink: { color: "#7c3aed", fontWeight: "700" },
  terms: { fontSize: 11, color: "#bbb", lineHeight: 18, textAlign: "center" },
  termsLink: { color: "#888", textDecorationLine: "underline" },
});
