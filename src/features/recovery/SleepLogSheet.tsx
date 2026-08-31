import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { upsertSleep, type SleepEntry } from "./storage";
import { toISODay } from "../nutrition/storage";

const ACCENT = "#7E8FA6"; // slate blue — matches Sleep tile

const QUALITIES: { score: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { score: 1, label: "Poor" },
  { score: 2, label: "Fair" },
  { score: 3, label: "Okay" },
  { score: 4, label: "Good" },
  { score: 5, label: "Great" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  existing?: SleepEntry | null;
  onSaved?: () => void;
};

export function SleepLogSheet({ visible, onClose, existing, onSaved }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [hours, setHours] = useState<number>(existing?.hours ?? 7.5);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(existing?.quality ?? 4);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsertSleep({ date: toISODay(), hours, quality });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, paddingTop: theme.spacing.lg, gap: theme.spacing.xl }}>
        {/* Hero */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: `${ACCENT}22`,
              alignItems: "center", justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <Ionicons name="moon" size={34} color={ACCENT} />
          </View>
          <Text variant="title" center style={{ fontSize: 24 }}>
            How did you sleep?
          </Text>
          <Text variant="body" color="textMuted" center>
            Log last night's sleep to shape today's plan.
          </Text>
        </View>

        {/* Hours dial */}
        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xl }}>
            <RoundBtn icon="remove" onPress={() => setHours((h) => Math.max(0, +(h - 0.5).toFixed(1)))} c={c} accent={ACCENT} />
            <View style={{ alignItems: "center", minWidth: 130 }}>
              <Text style={{ fontSize: 68, fontWeight: "800", color: c.text, letterSpacing: -3, lineHeight: 72 }}>
                {hours.toFixed(1)}
              </Text>
              <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.6, fontSize: 11 }}>
                HOURS
              </Text>
            </View>
            <RoundBtn icon="add" onPress={() => setHours((h) => Math.min(14, +(h + 0.5).toFixed(1)))} c={c} accent={ACCENT} />
          </View>
        </View>

        {/* Quality — segmented cards */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 11 }}>
            QUALITY
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {QUALITIES.map((q) => {
              const active = quality === q.score;
              return (
                <Pressable
                  key={q.score}
                  onPress={() => setQuality(q.score)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: theme.radius.lg,
                    backgroundColor: active ? ACCENT : c.surfaceAlt,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: active ? "#fff" : c.textMuted,
                    }}
                  >
                    {q.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title={saving ? "Saving…" : "Save sleep"}
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

function RoundBtn({
  icon,
  onPress,
  c,
  accent,
}: {
  icon: "add" | "remove";
  onPress: () => void;
  c: any;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${accent}22`,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={26} color={accent} />
    </Pressable>
  );
}
