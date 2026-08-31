import { useState } from "react";
import { View, TextInput, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { BottomSheet, Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loginWithEmail, registerWithEmail } from "./emailAuth";
import { saveSession, type Session } from "./session";
import { restoreFromCloud } from "../sync/restore";

/** Pass the server's hasIntro through unchanged so new users get routed to the
 *  region intro. (Previously this forced hasIntro=true to skip the old v1 intro,
 *  but that also skipped the new region flow.) */
function normalize(session: Session): Session {
  return session;
}

type Mode = "login" | "signup";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (session: Session) => void;
};

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

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ gap: 4 }}>
          <Text variant="caption" color="textMuted">
            Email
          </Text>
          <Text variant="title">{mode === "login" ? "Welcome back" : "Create account"}</Text>
        </View>

        {/* Mode toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.surfaceAlt,
            borderRadius: 999,
            padding: 4,
            gap: 4,
          }}
        >
          {(["login", "signup"] as Mode[]).map((m) => {
            const active = m === mode;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 999,
                  alignItems: "center",
                  backgroundColor: active ? c.surface : "transparent",
                  borderWidth: active ? 1 : 0,
                  borderColor: c.border,
                }}
              >
                <Text
                  variant="caption"
                  weight={active ? "bold" : "medium"}
                  color={active ? "text" : "textMuted"}
                  style={{ fontSize: 12 }}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === "signup" ? (
          <Field
            label="Name"
            value={name}
            onChange={setName}
            autoCapitalize="words"
            placeholder="Your name"
          />
        ) : null}

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
          placeholder={mode === "login" ? "••••••••" : "At least 6 characters"}
        />

        <Button
          title={submit.isPending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          onPress={() => submit.mutate()}
          size="lg"
          haptic="medium"
          disabled={!canSubmit || submit.isPending}
        />
      </View>
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
