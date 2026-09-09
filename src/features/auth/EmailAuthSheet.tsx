import { useState } from "react";
import { View, TextInput, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { BottomSheet, Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loginWithEmail, registerWithEmail } from "./emailAuth";
import { saveSession, type Session } from "./session";
import { restoreFromCloud } from "../sync/restore";

function normalize(session: Session): Session {
  return session;
}

type Mode = "login" | "signup";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (session: Session) => void;
};

/**
 * Log in and Sign up are the same shape underneath, and the old design leaned
 * on that — one form, a tiny segmented control at the top, a name field that
 * appeared when you flipped modes. That made the two flows read as the same
 * thing with a different label.
 *
 * They're not the same thing to a user. Logging in means "I know my details,
 * let me in." Signing up means "I'm starting fresh, tell me what you need."
 * So the two modes now have distinct layouts, copy, and CTAs — with one
 * shared row at the bottom to switch between them.
 */
export function EmailAuthSheet({ visible, onClose, onSuccess }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const submit = useMutation({
    mutationFn: async (): Promise<Session> =>
      mode === "login"
        ? loginWithEmail(email, password)
        : registerWithEmail(name, email, password),
    onSuccess: async (session) => {
      const s = normalize(session);
      await saveSession(s);
      await restoreFromCloud();
      onSuccess(s);
    },
    onError: (err: Error) => Alert.alert("Sign-in failed", err.message),
  });

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === "login" || name.trim().length > 0);

  const isLogin = mode === "login";
  const switchTo = (m: Mode) => {
    setMode(m);
    // Password rules differ between modes ("At least 6" hint on signup, no
    // hint on login). Clearing avoids a stale hint under the field.
    setPassword("");
    setShowPw(false);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {isLogin ? (
        // ── LOG IN ────────────────────────────────────────────────────────
        // Slim, familiar. Two fields, one clear "Log in" CTA. No name row,
        // no password-strength copy — the user is returning, not starting.
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <View style={{ gap: 6 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing.sm,
              }}
            >
              <Ionicons name="log-in-outline" size={22} color={c.text} />
            </View>
            <Text variant="title">Welcome back</Text>
            <Text variant="body" color="textMuted">
              Log in with the email you signed up with.
            </Text>
          </View>

          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            secure={!showPw}
            right={
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={c.textMuted}
                />
              </Pressable>
            }
            placeholder="Your password"
          />

          <Button
            title={submit.isPending ? "Signing in…" : "Log in"}
            onPress={() => submit.mutate()}
            size="lg"
            radius="full"
            haptic="medium"
            disabled={!canSubmit || submit.isPending}
          />

          <Pressable onPress={() => switchTo("signup")} hitSlop={6} style={{ marginTop: 4 }}>
            <Text variant="body" color="textMuted" center>
              New here?{" "}
              <Text variant="body" weight="bold" color="text">
                Create an account
              </Text>
            </Text>
          </Pressable>
        </View>
      ) : (
        // ── SIGN UP ───────────────────────────────────────────────────────
        // Three fields, framed as the start of something. The header names
        // what happens after ("takes ten seconds") because signup drop-off is
        // where extra clarity earns its keep.
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <View style={{ gap: 6 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.text,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing.sm,
              }}
            >
              <Ionicons name="sparkles-outline" size={20} color={c.inverseText} />
            </View>
            <Text variant="title">Create your account</Text>
            <Text variant="body" color="textMuted">
              Takes ten seconds. You can use every feature right away.
            </Text>
          </View>

          <Field
            label="Name"
            value={name}
            onChange={setName}
            autoCapitalize="words"
            placeholder="What should we call you?"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            secure={!showPw}
            right={
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={c.textMuted}
                />
              </Pressable>
            }
            placeholder="At least 6 characters"
          />

          <Text variant="caption" color="textFaint" style={{ marginTop: -4 }}>
            By creating an account you agree to our Terms and Privacy Policy.
          </Text>

          <Button
            title={submit.isPending ? "Creating…" : "Create account"}
            onPress={() => submit.mutate()}
            size="lg"
            radius="full"
            haptic="medium"
            disabled={!canSubmit || submit.isPending}
          />

          <Pressable onPress={() => switchTo("login")} hitSlop={6} style={{ marginTop: 4 }}>
            <Text variant="body" color="textMuted" center>
              Already have an account?{" "}
              <Text variant="body" weight="bold" color="text">
                Log in
              </Text>
            </Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  placeholder?: string;
  right?: React.ReactNode;
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
          height: 52,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={c.textFaint}
          style={{ flex: 1, fontSize: 16, color: c.text, paddingVertical: 0 }}
        />
        {right}
      </View>
    </View>
  );
}
