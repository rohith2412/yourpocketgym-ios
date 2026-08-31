import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { upsertMood, type MoodEntry } from "./storage";
import { toISODay } from "../nutrition/storage";

const ACCENT = "#A69A7E"; // warm sand — matches Mindset tile

const CHOICES: { score: 1 | 2 | 3 | 4 | 5; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { score: 1, icon: "sad",            label: "Rough" },
  { score: 2, icon: "sad-outline",    label: "Meh" },
  { score: 3, icon: "remove-outline", label: "Okay" },
  { score: 4, icon: "happy-outline",  label: "Good" },
  { score: 5, icon: "happy",          label: "Great" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  existing?: MoodEntry | null;
  onSaved?: () => void;
};

export function MoodLogSheet({ visible, onClose, existing, onSaved }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [score, setScore] = useState<1 | 2 | 3 | 4 | 5>(existing?.score ?? 4);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsertMood({ date: toISODay(), score, note: note.trim() || undefined });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const current = CHOICES.find((ch) => ch.score === score)!;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, paddingTop: theme.spacing.lg, gap: theme.spacing.xl }}>
        {/* Hero — icon reacts to selection */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 92, height: 92, borderRadius: 46,
              backgroundColor: `${ACCENT}22`,
              alignItems: "center", justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <Ionicons name={current.icon} size={52} color={ACCENT} />
          </View>
          <Text variant="title" center style={{ fontSize: 24 }}>
            How are you feeling?
          </Text>
          <Text variant="body" color="textMuted" center>
            A quick check-in — no wrong answer.
          </Text>
        </View>

        {/* Icon selector row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
          {CHOICES.map((ch) => {
            const active = ch.score === score;
            return (
              <Pressable
                key={ch.score}
                onPress={() => setScore(ch.score)}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: theme.radius.xl,
                  backgroundColor: active ? ACCENT : c.surfaceAlt,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name={ch.icon} size={28} color={active ? "#fff" : c.textMuted} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: active ? "#fff" : c.textMuted,
                  }}
                >
                  {ch.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Optional note */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 11 }}>
            NOTE (OPTIONAL)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Anything on your mind?"
            placeholderTextColor={c.textFaint}
            multiline
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.md,
              minHeight: 76,
              color: c.text,
              fontSize: 15,
              textAlignVertical: "top",
            }}
          />
        </View>

        <Button
          title={saving ? "Saving…" : "Save check-in"}
          onPress={save}
          disabled={saving}
          radius="full"
          size="lg"
          haptic="medium"
        />
      </View>
    </BottomSheet>
  );
}
