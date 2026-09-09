import { useEffect, useRef, useState } from "react";
import { View, Image, Animated, Easing, Alert, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import GoogleGLogo from "../../../components/GoogleGLogo";
import { useGoogleLogin } from "./useGoogleLogin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAppleLogin } from "./useAppleLogin";
import { isAppleSignInAvailable } from "./appleSignIn";
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
  // probe hiccuped — that ships a rejectable build that looks fine locally.
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

        {/* ── Bottom: auth buttons ── */}
        <View style={{ paddingBottom: theme.spacing.xl, gap: theme.spacing.sm }}>
          {/* Apple first. Guideline 4.8 requires an equivalent option to Google,
              and Apple's own button style is mandated by their HIG — hence the
              native component rather than our `Button`. */}
          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                theme.mode === "dark"
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              // Matches Button size="lg" radius="full" so the stack reads as one set.
              cornerRadius={29}
              style={{ height: 58, width: "100%", opacity: applePending ? 0.6 : 1 }}
              onPress={handleApple}
            />
          ) : null}

          <Button
            title={isPending ? "Signing in…" : "Sign in with Google"}
            variant={theme.mode === "light" ? "secondary" : "primary"}
            radius="full"
            size="lg"
            loading={isPending}
            haptic="medium"
            onPress={handleGoogle}
            left={<GoogleGLogo size={20} />}
            titleStyle={{ fontSize: 21, fontWeight: "600" }}
          />

          <Button
            title="Sign in with email"
            variant="secondary"
            radius="full"
            size="lg"
            onPress={() => router.push("/email-auth" as never)}
            left={<Ionicons name="mail-outline" size={20} color={theme.colors.text} 
          titleStyle={{ fontSize: 21, fontWeight: "600" }}
          />}
          
          titleStyle={{ fontSize: 21, fontWeight: "600" }}
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
