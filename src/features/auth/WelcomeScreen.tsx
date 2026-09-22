import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Linking, Platform, View } from "react-native";
import GoogleGLogo from "../../../components/GoogleGLogo";
import { ApiError } from "../../api/client";
import { useTheme } from "../../theme/ThemeProvider";
import { Button, Screen, Text } from "../../ui";
import { isAppleSignInAvailable } from "./appleSignIn";
import { useAppleLogin } from "./useAppleLogin";
import { useGoogleLogin } from "./useGoogleLogin";

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

  const afterLogin = (user: { hasIntro?: boolean }) => {
    router.replace((user.hasIntro ? "/(tabs)" : "/region-intro") as any);
  };

  const { mutate: login, isPending } = useGoogleLogin({ onSuccess: afterLogin });
  const { mutate: appleLogin, isPending: applePending } = useAppleLogin({
    onSuccess: afterLogin,
  });

  // iOS 13+ always has it, but the check keeps the button off any device or
  // simulator that can't actually complete the flow.
  // Visible on iOS by default, and the async check can only ever turn it ON.
  // Guideline 4.8 makes this button mandatory alongside Google, so the one
  // outcome we can't afford is it quietly vanishing because a availability
  // probe hiccuped - that ships a rejectable build that looks fine locally.
  // Every iOS version this app supports has Sign in with Apple anyway.
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === "ios");
  useEffect(() => {
    isAppleSignInAvailable().then((ok) => {
      if (ok) setAppleAvailable(true);
    });
  }, []);

  const handleApple = () => {
    appleLogin(undefined, {
      onError: (err) => {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Sign in with Apple failed. Please try again.";
        Alert.alert("Sign-in failed", msg);
      },
    });
  };

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
        {/* ── Center: typewriter hero ──
            The cursor is nested inside the same <Text> so the whole line
            renders as one string that centers itself. Two sibling texts in
            a row-centered container caused the block to re-center on every
            keystroke - that horizontal jitter was the "unalign" being seen. */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: theme.spacing.lg }}>
          <View
            style={{
              minHeight: 130,
              justifyContent: "center",
              width: "100%",
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
                textAlign: "center",
              }}
            >
              {typed}
              <Animated.Text
                style={{
                  fontWeight: theme.fontWeight.regular,
                  color: theme.colors.primary,
                  opacity: cursor,
                }}
              >
                |
              </Animated.Text>
            </Text>
          </View>
        </View>

        {/* ── Bottom: auth buttons ── */}
        <View style={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.sm }}>
          {/* Apple first. Guideline 4.8 requires an equivalent option to
              Google. Custom Button (instead of AppleAuthenticationButton) so
              the Apple logo can be sized to match the Google G and envelope
              icons — Apple's HIG allows a custom button as long as it uses
              their logo and says "Sign in with Apple" clearly. The actual
              auth flow is unchanged; only the visual wrapper differs. */}
          {appleAvailable ? (
            <Button
              title={applePending ? "Signing in…" : "Sign in with Apple"}
              variant="primary"
              radius="full"
              size="xl"
              loading={applePending}
              haptic="medium"
              onPress={handleApple}
              left={
                <Ionicons
                  name="logo-apple"
                  size={28}
                  color={theme.colors.inverseText}
                />
              }
              titleStyle={{ fontSize: 22, fontWeight: "600" }}
            />
          ) : null}

          <Button
            title={isPending ? "Signing in…" : "Sign in with Google"}
            variant={theme.mode === "light" ? "secondary" : "primary"}
            radius="full"
            size="xl"
            loading={isPending}
            haptic="medium"
            onPress={handleGoogle}
            left={<GoogleGLogo size={26} />}
            // Match Apple's native SIGN_IN label — at 58pt pill height it
            // renders at ~22pt semibold, which is what makes Apple read
            // heavier than the other two when they were kept at 19pt.
            titleStyle={{ fontSize: 22, fontWeight: "600" }}
          />

          <Button
            title="Sign in with email"
            variant={theme.mode === "light" ? "secondary" : "primary"}
            radius="full"
            size="xl"
            onPress={() => router.push("/email-auth" as never)}
            left={
              <Ionicons
                name="mail-outline"
                size={24}
                color={
                  theme.mode === "light" ? theme.colors.text : theme.colors.inverseText
                }
              />
            }
            // Match Apple's native SIGN_IN label — at 58pt pill height it
            // renders at ~22pt semibold, which is what makes Apple read
            // heavier than the other two when they were kept at 19pt.
            titleStyle={{ fontSize: 22, fontWeight: "600" }}
          />

          <Text
            variant="caption"
            color="textFaint"
            center
            style={{ lineHeight: 18, marginTop: theme.spacing.sm }}
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
        </View>
      </Animated.View>
</Screen>
  );
}
