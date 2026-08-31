import { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import Markdown from "react-native-markdown-display";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useRouter } from "expo-router";
import { coachChat, type ChatMessage } from "./api";
import { isFitnessRelated } from "./topicFilter";
import { loadChatHistory, saveChatHistory, clearChatHistory } from "./storage";
import { useCoachQuota } from "./useCoachQuota";
import { useEntitlement } from "../subscription/useEntitlement";

const SUGGESTIONS = [
  "Build me a 4-day muscle gain plan",
  "How do I fix my squat form?",
  "What should I eat post-workout?",
];

export function CoachScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { plan } = useEntitlement();
  const quota = useCoachQuota(plan);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const hydrated = useRef(false);

  // Load persisted history once on mount
  useEffect(() => {
    (async () => {
      const saved = await loadChatHistory();
      if (saved.length > 0) setMessages(saved);
      hydrated.current = true;
    })();
  }, []);

  // Persist history whenever it changes (skip the first render before hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    saveChatHistory(messages).catch(() => {});
  }, [messages]);

  const chatM = useMutation({
    mutationFn: (next: ChatMessage[]) => coachChat(next),
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Coach couldn't reply: ${err.message}` },
      ]);
    },
  });

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || chatM.isPending) return;
    Haptics.selectionAsync().catch(() => {});
    const userMsg: ChatMessage = { role: "user", content: clean };

    // Client-side gate — only fitness/health goes to the API.
    if (!isFitnessRelated(clean)) {
      const localReply: ChatMessage = {
        role: "assistant",
        content:
          "I'm your fitness coach, so I stick to workouts, nutrition, recovery, and health. Try asking me about training, form, macros, or recovery.",
      };
      setMessages((prev) => [...prev, userMsg, localReply]);
      setInput("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
      return;
    }

    // Daily quota — block when hit
    if (!quota.hasQuota) {
      const localReply: ChatMessage = {
        role: "assistant",
        content: `You've hit your daily limit of ${quota.limit} messages. Come back tomorrow — I'll be here.`,
      };
      setMessages((prev) => [...prev, userMsg, localReply]);
      setInput("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
      return;
    }

    const next: ChatMessage[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    quota.consume();
    chatM.mutate(next);
  };

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen padded={false}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: 120,
            gap: theme.spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header — with back button since Coach is its own route now */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={c.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                Your AI trainer
              </Text>
              <Text variant="title">Coach</Text>
            </View>
            {messages.length > 0 ? (
              <Pressable
                onPress={() => {
                  setMessages([]);
                  clearChatHistory().catch(() => {});
                }}
                hitSlop={8}
                style={({ pressed }) => ({
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: pressed ? c.surfaceAlt : "transparent",
                  borderWidth: 1,
                  borderColor: c.border,
                })}
              >
                <Text variant="caption" color="textMuted" weight="semibold">
                  Clear
                </Text>
              </Pressable>
            ) : null}
          </View>

          {empty ? (
            <>
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius["2xl"],
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: theme.spacing.xl,
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <Ionicons name="sparkles" size={28} color={c.text} />
                <Text variant="heading" center>
                  Ask me anything
                </Text>
                <Text variant="body" color="textMuted" center>
                  Workouts, form, nutrition, recovery — I adapt to your goals.
                </Text>
              </View>

              <Text variant="label" color="textMuted" style={{ marginTop: theme.spacing.md }}>
                TRY ASKING
              </Text>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? c.surfaceAlt : c.surface,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: theme.spacing.md,
                  })}
                >
                  <Text variant="body">{s}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            messages.map((m, i) => <Bubble key={i} message={m} />)
          )}

          {chatM.isPending ? (
            <View
              style={{
                alignSelf: "flex-start",
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.lg,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ActivityIndicator size="small" color={c.textMuted} />
              <Text variant="caption" color="textMuted">
                Coach is thinking…
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Screen>

      {/* Input bar */}
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.lg,
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: c.surfaceAlt,
            borderRadius: 22,
            paddingHorizontal: 14,
            paddingVertical: 10,
            minHeight: 44,
            maxHeight: 120,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Coach anything…"
            placeholderTextColor={c.textFaint}
            multiline
            style={{
              color: c.text,
              fontSize: 15,
              paddingVertical: 0,
              maxHeight: 100,
            }}
            onSubmitEditing={() => send(input)}
            blurOnSubmit
          />
        </View>
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || chatM.isPending || !quota.hasQuota}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.inverseBg,
            opacity:
              !input.trim() || chatM.isPending || !quota.hasQuota
                ? 0.4
                : pressed
                ? 0.85
                : 1,
          })}
        >
          <Ionicons name="arrow-up" size={20} color={c.inverseText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isUser = message.role === "user";
  const fg = isUser ? c.inverseText : c.text;
  const mdStyles = {
    body: { color: fg, fontSize: 15, lineHeight: 22 },
    strong: { color: fg, fontWeight: "700" as const },
    em: { color: fg, fontStyle: "italic" as const },
    heading1: { color: fg, fontSize: 20, fontWeight: "800" as const, marginTop: 6, marginBottom: 4 },
    heading2: { color: fg, fontSize: 17, fontWeight: "800" as const, marginTop: 6, marginBottom: 4 },
    heading3: { color: fg, fontSize: 15, fontWeight: "800" as const, marginTop: 4, marginBottom: 2 },
    bullet_list: { marginVertical: 2 },
    ordered_list: { marginVertical: 2 },
    list_item: { color: fg, marginVertical: 2 },
    paragraph: { color: fg, marginTop: 0, marginBottom: 6 },
    code_inline: {
      color: fg,
      backgroundColor: isUser ? "rgba(255,255,255,0.15)" : c.surfaceAlt,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    fence: {
      backgroundColor: isUser ? "rgba(255,255,255,0.12)" : c.surfaceAlt,
      color: fg,
      padding: 8,
      borderRadius: 8,
      marginVertical: 4,
    },
    link: { color: c.primary },
    hr: { backgroundColor: c.border, height: 1, marginVertical: 6 },
  };
  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "88%",
        backgroundColor: isUser ? c.inverseBg : c.surface,
        borderWidth: isUser ? 0 : 1,
        borderColor: c.border,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Markdown style={mdStyles}>{message.content}</Markdown>
    </View>
  );
}
