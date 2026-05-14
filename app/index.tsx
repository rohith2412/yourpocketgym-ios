import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getToken } from "../src/auth/storage";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

const PHRASES = [
  "Track every rep.",
  "Eat smarter.",
  "Burn more.",
  "Train harder.",
  "Hit your macros.",
  "Your pocket gym.",
];

export default function Index() {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [displayText, setDisplayText] = useState("");

  const textOpacity   = useRef(new Animated.Value(1)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const spinAnim      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) { setDestination("/(tabs)/tracking"); setChecking(false); return; }
      const pending = await AsyncStorage.getItem("@pending_intro");
      if (pending) { setDestination("/register"); setChecking(false); return; }
      setDestination("/startersIntro");
      setChecking(false);
    })();

    // Fade whole screen in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    // Logo spin
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    // Blinking cursor
    Animated.loop(Animated.sequence([
      Animated.timing(cursorOpacity, { toValue: 0, duration: 530, useNativeDriver: true }),
      Animated.timing(cursorOpacity, { toValue: 1, duration: 530, useNativeDriver: true }),
    ])).start();

    // Typewriter loop
    let phraseIndex = 0;
    let cancelled   = false;
    let tid: ReturnType<typeof setTimeout>;

    const typePhrase = () => {
      if (cancelled) return;
      const phrase = PHRASES[phraseIndex];
      let charIndex = 0;

      const typeChar = () => {
        if (cancelled) return;
        if (charIndex <= phrase.length) {
          setDisplayText(phrase.slice(0, charIndex));
          charIndex++;
          tid = setTimeout(typeChar, 55);
        } else {
          // Pause → fade out → next phrase
          tid = setTimeout(() => {
            Animated.timing(textOpacity, {
              toValue: 0, duration: 350, useNativeDriver: true,
            }).start(() => {
              if (cancelled) return;
              setDisplayText("");
              phraseIndex = (phraseIndex + 1) % PHRASES.length;
              textOpacity.setValue(1);
              tid = setTimeout(typePhrase, 120);
            });
          }, 1000);
        }
      };

      typeChar();
    };

    typePhrase();
    return () => { cancelled = true; clearTimeout(tid); };
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (!checking && destination) return <Redirect href={destination as any} />;

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />



      {/* ── Typewriter (loops forever) ── */}
      <View style={s.phraseWrap}>
        <Animated.View style={[s.phraseRow, { opacity: textOpacity }]}>
          <Text style={s.phraseText}>{displayText}</Text>
          <Animated.Text style={[s.cursor, { opacity: cursorOpacity }]}>|</Animated.Text>
        </Animated.View>
      </View>

      {/* ── Buttons (always visible) ── */}
      <View style={s.bottom}>
        <Pressable
          onPress={() => router.push("/startersIntro")}
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.primaryBtnText}>Create account</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/login")}
          style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.secondaryBtnText}>Log in</Text>
        </Pressable>

        <Text style={s.terms}>
          By continuing you agree to our{" "}
          <Text style={s.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
          {" "}&{" "}
          <Text style={s.termsLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
        </Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 52,
    paddingHorizontal: 24,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 72,
    height: 72,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
  },

  // Typewriter
  phraseWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  phraseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phraseText: {
    fontSize: 34,
    fontWeight: "600",
    color: "#0e0e0e",
    letterSpacing: -0.5,
  },
  cursor: {
    fontSize: 34,
    fontWeight: "300",
    color: "rgba(0,0,0,0.25)",
    marginLeft: 2,
  },

  // Buttons
  bottom: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#0e0e0e",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryBtn: {
    width: "100%",
    backgroundColor: "#f4f4f4",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0e0e0e",
  },
  terms: {
    fontSize: 12,
    color: "rgba(0,0,0,0.25)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  termsLink: {
    color: "rgba(0,0,0,0.45)",
    textDecorationLine: "underline",
  },
});
