import { useEffect, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { saveToken } from "../src/auth/storage";
import { signInWithGoogle, isCancelled } from "../src/auth/google";
import GoogleGLogo from "../components/GoogleGLogo";
import { useTheme } from "../src/theme/ThemeContext";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused]   = useState(null);
  const [showPw,  setShowPw]    = useState(false);

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
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Submit pending intro data if user came through the new intro-first flow
      const pendingIntro = await AsyncStorage.getItem("@pending_intro");
      if (pendingIntro) {
        try {
          const introRes = await fetch("https://yourpocketgym.com/api/user-intro", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
            body: pendingIntro,
          });
          const introData = await introRes.json();
          if (introData.success) {
            await AsyncStorage.setItem("user", JSON.stringify({ ...data.user, hasIntro: true }));
          }
        } catch {}
        await AsyncStorage.removeItem("@pending_intro");
        router.replace("/(tabs)/tracking");
      } else {
        // Old flow fallback — check if intro was already done on the server
        const introRes  = await fetch("https://yourpocketgym.com/api/user-intro", {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        });
        const introData = await introRes.json();
        if (!introRes.ok || !introData?.exists) router.replace("/startersIntro");
        else                                     router.replace("/(tabs)/tracking");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const google = await signInWithGoogle();
      if (!google) { alert("Google sign-in failed. Please try again."); return; }

      const res  = await fetch("https://yourpocketgym.com/api/auth/google", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ idToken: google.idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data.error || "Google sign-in failed"); return; }

      await saveToken(data.token);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ ...data.user, photo: data.user.photo || google.photo }),
      );

      if (!data.user.hasIntro) router.replace("/startersIntro");
      else                     router.replace("/(tabs)/tracking");
    } catch (err) {
      if (isCancelled(err)) return;
      console.warn("Google sign-in error:", err?.code, err?.message, err);
      alert(`Google sign-in failed: ${err?.code || ""} ${err?.message || err}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const isValid = name && email && password.length >= 6;

  return (
    <View style={s.root}>
      <StatusBar barStyle={colors.statusBar} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* ── Top bar ── */}
            <View style={s.topBar}>
              <View style={{ width: 36 }} />
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
                  style={[s.input, focused === "name" && s.inputFocused]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textFaint}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View style={s.inputWrapper}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={[s.input, focused === "email" && s.inputFocused]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View style={s.inputWrapper}>
                <Text style={s.label}>Password</Text>
                <View style={[s.inputField, focused === "password" && s.inputFocused]}>
                  <TextInput
                    style={s.inputInner}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.textFaint}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                  />
                  <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10}>
                    <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={17} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={!isValid || loading}
                style={({ pressed }) => [s.primaryBtn, (!isValid || loading) && s.primaryBtnDisabled, pressed && { opacity: 0.9 }]}
              >
                <Text style={s.primaryBtnText}>{loading ? "Creating account…" : "Create account"}</Text>
              </Pressable>

              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              <Pressable
                onPress={handleGoogleSignup}
                disabled={googleLoading || loading}
                style={({ pressed }) => [s.googleBtn, (googleLoading || loading) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
              >
                <GoogleGLogo size={20} />
                <Text style={s.googleBtnText}>{googleLoading ? "Signing in…" : "Continue with Google"}</Text>
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

const makeStyles = (c) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
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
  backBtnText: { fontSize: 22, color: c.text },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoSmall: { width: 26, height: 26 },
  logoName: { fontSize: 14, fontWeight: "700", color: c.text, letterSpacing: -0.3 },

  // Headline
  headSection: { gap: 8 },
  title: { fontSize: 44, fontWeight: "800", color: c.text, letterSpacing: -1.6, lineHeight: 48 },
  titleAccent: { color: c.textMuted },
  subtitle: { fontSize: 14, color: c.textMuted },

  // Form (shadcn)
  form: { gap: 16 },
  inputWrapper: { gap: 8 },
  label: {
    fontSize: 14, fontWeight: "500", color: c.text,
  },
  input: {
    height: 44,
    backgroundColor: c.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: c.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  inputInner: { flex: 1, fontSize: 14, color: c.text },
  inputFocused: {
    borderColor: c.text,
    shadowColor: c.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  // Buttons (shadcn)
  primaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 44,
    backgroundColor: c.text,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { fontSize: 14, fontWeight: "600", color: c.bg },

  secondaryBtn: {
    backgroundColor: c.card,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "500", color: c.text },

  // Divider + Google (shadcn)
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { fontSize: 12, color: c.textFaint, fontWeight: "400", textTransform: "uppercase", letterSpacing: 0.5 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 44,
    backgroundColor: c.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  googleBtnText: { fontSize: 14, fontWeight: "500", color: c.text },

  // Footer
  footer: { gap: 12 },
  terms: { fontSize: 12, color: c.textFaint, textAlign: "center", lineHeight: 18 },
  termsLink: { color: c.textMuted, textDecorationLine: "underline" },
});
