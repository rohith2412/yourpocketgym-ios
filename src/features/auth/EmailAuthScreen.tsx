import { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loginWithEmail, registerWithEmail } from "./emailAuth";
import { saveSession, type Session } from "./session";
import { restoreFromCloud } from "../sync/restore";

type Mode = "login" | "signup";

/**
 * Full-page email auth.
 *
 * Replaces the old bottom sheet. Pushing to a real screen reads as faster than
 * a sheet sliding up — no dimmed background, no cramped padding, the keyboard
 * gets the whole screen to work with. This is the shape most modern apps have
 * settled on (Cash App, Duolingo, Notion, Robinhood, Amie): a plain page per
 * step, big pill CTA, quiet mode-switch link at the bottom.
 *
 * Both modes share this file because the underlying flow is one mutation with
 * a mode flag — separating into two components duplicates form state for no
 * gain. What *does* differ per mode: fields shown, header copy, CTA label,
 * validation. That branches inline, minimally.
 */
export function EmailAuthScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(params.mode === "signup" ? "signup" : "login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Auto-focus the first field on mount and after mode switch. Users on a
  // signup/login page expect the keyboard to be up already.
  const firstFieldRef = useRef<TextInput>(null);
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [mode]);

  const submit = useMutation({
    mutationFn: async (): Promise<Session> =>
      mode === "login"
        ? loginWithEmail(email, password)
        : registerWithEmail(name, email, password),
    onSuccess: async (session) => {
      await saveSession(session);
      await restoreFromCloud();
      router.replace((session.user.hasIntro ? "/(tabs)" : "/region-intro") as never);
    },
    onError: (err: Error) => Alert.alert("Sign-in failed", err.message),
  });

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === "login" || name.trim().length > 0);

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    // Reset password on switch — signup requires 6+, login might be shorter
    // on legacy accounts; showing "too short" hints from the wrong mode is
    // more confusing than the retype.
    setPassword("");
    setShowPw(false);
  };

  const isLogin = mode === "login";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header — just a back chevron. No title bar — the H1 below IS the title. */}
        <View
          style={{
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={26} color={c.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <View style={{ gap: 8, marginTop: theme.spacing.md, marginBottom: theme.spacing.xl }}>
            <Text
              style={{
                fontSize: 34,
                fontWeight: "800",
                letterSpacing: -1,
                color: c.text,
                lineHeight: 40,
              }}
            >
              {isLogin ? "Welcome back" : "Create your account"}
            </Text>
            <Text variant="body" color="textMuted" style={{ fontSize: 15, lineHeight: 20 }}>
              {isLogin
                ? "Log in to pick up where you left off."
                : "Ten seconds. You'll be in before your rest timer ends."}
            </Text>
          </View>

          {/* Fields */}
          <View style={{ gap: theme.spacing.md }}>
            {!isLogin ? (
              <Field
                label="Name"
                inputRef={firstFieldRef}
                value={name}
                onChange={setName}
                autoCapitalize="words"
                placeholder="What should we call you?"
                returnKeyType="next"
              />
            ) : null}
            <Field
              label="Email"
              inputRef={isLogin ? firstFieldRef : undefined}
              value={email}
              onChange={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@email.com"
              returnKeyType="next"
              autoComplete="email"
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              secure={!showPw}
              placeholder={isLogin ? "Your password" : "At least 6 characters"}
              returnKeyType="go"
              autoComplete={isLogin ? "current-password" : "new-password"}
              onSubmitEditing={() => canSubmit && submit.mutate()}
              right={
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={c.textMuted}
                  />
                </Pressable>
              }
            />

            {!isLogin ? (
              <Text variant="caption" color="textFaint" style={{ fontSize: 12, lineHeight: 17 }}>
                By creating an account you agree to our Terms and Privacy Policy.
              </Text>
            ) : null}
          </View>

          {/* Grows to push the CTA and mode-switch to the bottom on tall
              phones, keeps them naturally close on small phones. */}
          <View style={{ flex: 1, minHeight: theme.spacing.xl }} />

          {/* CTA */}
          <Button
            title={
              submit.isPending
                ? isLogin
                  ? "Signing in…"
                  : "Creating account…"
                : isLogin
                ? "Log in"
                : "Create account"
            }
            onPress={() => submit.mutate()}
            size="lg"
            radius="full"
            haptic="medium"
            disabled={!canSubmit || submit.isPending}
          />

          {/* Mode switch — plain link, no border, low chrome. */}
          <Pressable onPress={switchMode} hitSlop={10} style={{ marginTop: theme.spacing.lg }}>
            <Text variant="body" color="textMuted" center>
              {isLogin ? "New here?" : "Already have an account?"}{" "}
              <Text variant="body" weight="bold" color="text">
                {isLogin ? "Create an account" : "Log in"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  keyboardType,
  autoCapitalize,
  placeholder,
  right,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  placeholder?: string;
  right?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: "next" | "go" | "done";
  onSubmitEditing?: () => void;
  autoComplete?: "email" | "current-password" | "new-password";
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 10 }}>
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.surfaceAlt,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.md,
          height: 54,
        }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={c.textFaint}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoComplete={autoComplete}
          style={{ flex: 1, fontSize: 17, color: c.text, paddingVertical: 0 }}
        />
        {right}
      </View>
    </View>
  );
}
