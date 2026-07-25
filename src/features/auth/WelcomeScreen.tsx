import { useEffect, useRef, useState } from "react";
import { View, Image, Animated, Easing, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Text, Button, BottomSheet } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import GoogleGLogo from "../../../components/GoogleGLogo";
import { useGoogleLogin } from "./useGoogleLogin";
import { ApiError } from "../../api/client";

const TERMS_URL = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

const PHRASES = [
  "Get fit.",
  "Get strong.",
  "Get lean.",
  "Level up.",
  "Go harder.",
];

/** Types each phrase out char-by-char, pauses, deletes, moves to the next. */
function useTypewriter(
  phrases: string[],
  { typeMs = 65, deleteMs = 30, pauseMs = 1500 } = {},
) {
  const [text, setText] = useState("");
  useEffect(() => {
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let tid: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        setText(phrase.slice(0, charIdx));
        if (charIdx === phrase.length) {
          deleting = true;
          tid = setTimeout(tick, pauseMs);
          return;
        }
        tid = setTimeout(tick, typeMs);
      } else {
        charIdx--;
        setText(phrase.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          tid = setTimeout(tick, 300);
          return;
        }
        tid = setTimeout(tick, deleteMs);
      }
    };

    tid = setTimeout(tick, 500);
    return () => clearTimeout(tid);
  }, []);
  return text;
}

export function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const typed = useTypewriter(PHRASES);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { mutate: login, isPending } = useGoogleLogin({
    onSuccess: (user) => {
      setSheetOpen(false);
      router.replace(user.hasIntro ? "/(tabs)" : "/startersIntro");
    },
  });

  const handleGoogle = () => {
    login(undefined, {
      onError: (err) => {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Google sign-in failed. Please try again.";
        Alert.alert("Sign-in failed", msg);
      },
    });
  };

  // Screen fade-in + blinking cursor
  const fade = useRef(new Animated.Value(0)).current;
  const cursor = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 480, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(cursor, { toValue: 1, duration: 480, easing: Easing.ease, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Screen>
      <Animated.View style={{ flex: 1, opacity: fade }}>
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

        {/* ── Center: typewriter hero ── */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              minHeight: 130,
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <Text
              center
              numberOfLines={1}
              style={{
                fontSize: 52,
                lineHeight: 58,
                fontWeight: theme.fontWeight.heavy,
                color: theme.colors.text,
                letterSpacing: -1.5,
              }}
            >
              {typed}
            </Text>
            <Animated.Text
              style={{
                fontSize: 52,
                lineHeight: 58,
                fontWeight: theme.fontWeight.regular,
                color: theme.colors.primary,
                opacity: cursor,
                marginLeft: 2,
              }}
            >
              |
            </Animated.Text>
          </View>
          {/* <Text
            variant="body"
            color="textMuted"
            center
            style={{ fontSize: theme.fontSize.lg, marginTop: theme.spacing.md }}
          >
            Your pocket-sized personal gym.
          </Text> */}
        </View>

        {/* ── Bottom: CTA ── */}
        <View style={{ paddingBottom: theme.spacing.xl }}>
          <Button
            title="Get Started"
            variant="primary"
            radius="full"
            size="lg"
            glow
            haptic="medium"
            onPress={() => setSheetOpen(true)}
          />
        </View>
      </Animated.View>

      {/* ── Sign-in sheet ── */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.xl }}>
          <Text variant="title">Sign in</Text>
          <Text variant="body" color="textMuted">
            Continue with your Google account to get started.
          </Text>
        </View>

        <Button
          title={isPending ? "Signing in…" : "Sign in with Google"}
          variant="primary"
          radius="full"
          size="lg"
          loading={isPending}
          onPress={handleGoogle}
          left={<GoogleGLogo size={20} />}
        />

        <Text
          variant="caption"
          color="textFaint"
          center
          style={{ lineHeight: 18, marginTop: theme.spacing.lg }}
        >
          By continuing you agree to our{" "}
          <Text
            variant="caption"
            color="textMuted"
            onPress={() => Linking.openURL(TERMS_URL)}
            style={{ textDecorationLine: "underline" }}
          >
            Terms
          </Text>{" "}
          &{" "}
          <Text
            variant="caption"
            color="textMuted"
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={{ textDecorationLine: "underline" }}
          >
            Privacy Policy
          </Text>
        </Text>
      </BottomSheet>
    </Screen>
  );
}
