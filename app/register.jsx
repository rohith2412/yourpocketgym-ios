import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken } from "../src/auth/storage";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

export default function Register() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const res  = await fetch("https://yourpocketgym.com/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Registration failed"); return; }

      await saveToken(data.token);
      // Mirror login.jsx — write to AsyncStorage so all hooks (useAuth, useSubscription) can read the session
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      const introRes  = await fetch("https://yourpocketgym.com/api/user-intro", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
      });
      const introData = await introRes.json();

      if (!introRes.ok || !introData?.exists) router.replace("/startersIntro");
      else                                     router.replace("/tracking");
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isValid = name && email && password.length >= 6;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* ── Top bar ── */}
            <View style={s.topBar}>
              <Pressable onPress={() => router.back()} style={s.backBtn}>
                <Text style={s.backBtnText}>←</Text>
              </Pressable>
              {/* <View style={s.logoRow}>
                <Animated.Image
                  source={require("../assets/images/logo.png")}
                  style={[s.logoSmall, { transform: [{ rotate: spin }] }]}
                  resizeMode="contain"
                />
                <Text style={s.logoName}>PocketGym</Text>
              </View> */}
            </View>

            {/* ── Headline ── */}
            <View style={s.headSection}>
              <Text style={s.title}>Create your{"\n"}<Text style={s.titleAccent}>account.</Text></Text>
              <Text style={s.subtitle}>Start your fitness journey today.</Text>
            </View>

            {/* ── Form ── */}
            <View style={s.form}>
              <View style={s.inputWrapper}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="John Doe"
                  placeholderTextColor="#c0bdb5"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={s.inputWrapper}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#c0bdb5"
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
                  placeholderTextColor="#c0bdb5"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={!isValid || loading}
                style={({ pressed }) => [s.primaryBtn, (!isValid || loading) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.primaryBtnText}>{loading ? "Creating account…" : "Create account"}</Text>
              </Pressable>
            </View>

            <View style={{ flex: 1 }} />

            {/* ── Footer ── */}
            <View style={s.footer}>
              <Pressable onPress={() => router.replace("/login")} style={s.secondaryBtn}>
                <Text style={s.secondaryBtnText}>Already have an account? Log in</Text>
              </Pressable>

              <Text style={s.terms}>
                By continuing you agree to our{" "}
                <Text style={s.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
                {" "}&{" "}
                <Text style={s.termsLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
              </Text>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 52,
    gap: 32,
  },

  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 22, color: "#0e0e0e" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoSmall: { width: 26, height: 26 },
  logoName: { fontSize: 14, fontWeight: "700", color: "#0e0e0e", letterSpacing: -0.3 },

  // Headline
  headSection: { gap: 8 },
  title: { fontSize: 48, fontWeight: "800", color: "#0e0e0e", letterSpacing: -2, lineHeight: 52 },
  titleAccent: { color: "#e8380d" },
  subtitle: { fontSize: 15, color: "rgba(0,0,0,0.38)" },

  // Form
  form: { gap: 16 },
  inputWrapper: { gap: 7 },
  label: {
    fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.35)",
    letterSpacing: 1, textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f7f7f5",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#0e0e0e",
    borderWidth: 1,
    borderColor: "#e8e5de",
  },

  // Buttons
  primaryBtn: {
    backgroundColor: "#0e0e0e",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },

  secondaryBtn: {
    backgroundColor: "#f4f4f4",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "600", color: "#0e0e0e" },

  // Footer
  footer: { gap: 12 },
  terms: { fontSize: 12, color: "rgba(0,0,0,0.25)", textAlign: "center", lineHeight: 18 },
  termsLink: { color: "rgba(0,0,0,0.45)", textDecorationLine: "underline" },
});
