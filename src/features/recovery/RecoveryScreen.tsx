import { useEffect, useState, useMemo } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useWorkoutLogs } from "../train/api";
import {
  loadSleep,
  loadMood,
  todaySleep,
  todayMood,
  type SleepEntry,
  type MoodEntry,
} from "./storage";
import { computeRecovery, computeLast7Days } from "./score";
import { SleepLogSheet } from "./SleepLogSheet";
import { MoodLogSheet } from "./MoodLogSheet";

export default function RecoveryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [sleepLog, setSleepLog] = useState<SleepEntry[]>([]);
  const [moodLog, setMoodLog] = useState<MoodEntry[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);

  useEffect(() => {
    loadSleep().then(setSleepLog);
    loadMood().then(setMoodLog);
  }, [reloadKey]);

  const { data: workouts = [] } = useWorkoutLogs();

  const sToday = useMemo(() => todaySleep(sleepLog), [sleepLog]);
  const mToday = useMemo(() => todayMood(moodLog), [moodLog]);
  const recovery = useMemo(
    () => computeRecovery(sToday, mToday, workouts),
    [sToday, mToday, workouts],
  );

  const week = useMemo(
    () => computeLast7Days(sleepLog, moodLog, workouts),
    [sleepLog, moodLog, workouts],
  );

  const reload = () => setReloadKey((k) => k + 1);


  return (
    <Screen
      scroll
      contentContainerStyle={{
        paddingBottom: theme.spacing["3xl"],
        gap: theme.spacing.lg,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            Today
          </Text>
          <Text variant="title">Recovery</Text>
        </View>
      </View>

      {/* Score hero — big number + 7-day bar chart */}
      <Card padding="xl" style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={{ gap: 2 }}>
            <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 11 }}>
              RECOVERY
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={{ fontSize: 52, fontWeight: "800", color: c.text, letterSpacing: -2, lineHeight: 56 }}>
                {recovery.score}
              </Text>
              <Text variant="body" color="textMuted" weight="semibold">/ 100</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: barTone(recovery.score) }} />
              <Text variant="body" weight="semibold">
                {recovery.label}
              </Text>
            </View>
          </View>
        </View>

        <WeekBars data={week} c={c} />

        <Text variant="body" color="textMuted" style={{ lineHeight: 20 }}>
          {subtitle(recovery.score)}
        </Text>
      </Card>

      {/* Sleep + Mood tiles — bigger, richer */}
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <LogTile
          icon="moon"
          accent={NEUTRAL.sleep}
          label="Sleep"
          primary={sToday ? `${sToday.hours.toFixed(1)}` : "—"}
          unit={sToday ? "h" : ""}
          hint={sToday ? `Quality ${sToday.quality}/5` : "Not logged"}
          cta={sToday ? "Edit" : "Log sleep"}
          onPress={() => setSleepOpen(true)}
          c={c}
          theme={theme}
        />
        <LogTile
          icon="pulse"
          accent={NEUTRAL.mind}
          label="Mindset"
          primary={mToday ? `${mToday.score}` : "—"}
          unit={mToday ? "/5" : ""}
          moodIcon={mToday ? moodIconFor(mToday.score) : undefined}
          hint={mToday ? moodLabel(mToday.score) : "Not logged"}
          cta={mToday ? "Edit" : "Check in"}
          onPress={() => setMoodOpen(true)}
          c={c}
          theme={theme}
        />
      </View>

      {/* Breakdown */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          BREAKDOWN
        </Text>
        <Card padding="lg" style={{ gap: theme.spacing.md }}>
          <BarRow label="Sleep hours" value={recovery.sleepHours} suffix="h" target={8} c={c} theme={theme} />
          <BarRow label="Sleep quality" value={recovery.sleepQuality} suffix="/5" target={5} c={c} theme={theme} />
          <BarRow label="Mindset" value={recovery.mood} suffix="/5" target={5} c={c} theme={theme} />
          <BreakRow
            label="Days since last workout"
            value={recovery.daysSinceLastWorkout != null ? `${recovery.daysSinceLastWorkout}` : "—"}
            c={c}
          />
        </Card>
      </View>

      <SleepLogSheet
        visible={sleepOpen}
        onClose={() => setSleepOpen(false)}
        existing={sToday}
        onSaved={reload}
      />
      <MoodLogSheet
        visible={moodOpen}
        onClose={() => setMoodOpen(false)}
        existing={mToday}
        onSaved={reload}
      />
    </Screen>
  );
}

// ── 7-day bar chart ──────────────────────────────────────────────────────────

// Neutral / earthy palette — subtle, not traffic-light. Used across the page.
const NEUTRAL = {
  high: "#8FA69A",   // muted sage — recovered
  good: "#B8AE8E",   // warm khaki — good
  low:  "#B58C7A",   // muted terracotta — take it easy
  rest: "#8E7573",   // muted rose brown — rest
  // Section accents (used for icon chip backgrounds)
  sleep: "#7E8FA6",  // slate blue
  mind:  "#A69A7E",  // warm sand
  tip:   "#9AA67E",  // olive
  scoreBg: "rgba(143,166,154,0.08)", // whisper-sage wash for hero
};

function barTone(score: number): string {
  if (score >= 80) return NEUTRAL.high;
  if (score >= 60) return NEUTRAL.good;
  if (score >= 40) return NEUTRAL.low;
  return NEUTRAL.rest;
}

function WeekBars({ data, c }: { data: { date: string; weekday: string; score: number | null }[]; c: any }) {
  const MAX_H = 84;
  const isToday = (idx: number) => idx === data.length - 1;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: MAX_H + 16, gap: 8 }}>
        {data.map((d, i) => {
          const pct = d.score != null ? Math.max(0.06, d.score / 100) : 0;
          const filled = d.score != null;
          const tone = filled ? barTone(d.score!) : c.surfaceAlt;
          return (
            <View key={d.date} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
              {filled && d.score != null ? (
                <Text style={{ fontSize: 10, fontWeight: "700", color: c.textMuted, marginBottom: 4 }}>
                  {d.score}
                </Text>
              ) : null}
              <View
                style={{
                  width: "100%",
                  height: (filled ? pct : 0.06) * MAX_H,
                  borderRadius: 4,
                  backgroundColor: tone,
                  opacity: filled ? (isToday(i) ? 1 : 0.75) : 1,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        {data.map((d, i) => (
          <View key={d.date} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: isToday(i) ? "700" : "500",
                color: isToday(i) ? c.text : c.textFaint,
              }}
            >
              {d.weekday}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Sleep / Mood tile ───────────────────────────────────────────────────────

function LogTile({
  icon,
  accent,
  label,
  primary,
  unit,
  moodIcon,
  hint,
  cta,
  onPress,
  c,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  label: string;
  primary: string;
  unit: string;
  moodIcon?: keyof typeof Ionicons.glyphMap;
  hint: string;
  cta: string;
  onPress: () => void;
  c: any;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: `${accent}22`,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={13} color={accent} />
        </View>
        <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 11 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, minHeight: 40 }}>
        {moodIcon ? <Ionicons name={moodIcon} size={30} color={c.text} style={{ marginRight: 4 }} /> : null}
        <Text style={{ fontSize: 30, fontWeight: "800", color: c.text, letterSpacing: -1 }}>
          {primary}
        </Text>
        {unit ? (
          <Text style={{ fontSize: 16, fontWeight: "700", color: c.textMuted }}>{unit}</Text>
        ) : null}
      </View>
      <Text variant="caption" color="textFaint" style={{ fontSize: 12 }}>
        {hint}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: c.text }}>{cta}</Text>
        <Ionicons name="chevron-forward" size={12} color={c.text} />
      </View>
    </Pressable>
  );
}

// ── Breakdown rows ───────────────────────────────────────────────────────────

function BarRow({
  label,
  value,
  suffix,
  target,
  c,
  theme,
}: {
  label: string;
  value: number | null;
  suffix: string;
  target: number;
  c: any;
  theme: any;
}) {
  const pct = value != null ? Math.max(0, Math.min(1, value / target)) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="body" color="textMuted">{label}</Text>
        <Text variant="body" weight="bold">
          {value != null ? `${value}${suffix}` : "—"}
        </Text>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: c.surfaceAlt, overflow: "hidden" }}>
        <View style={{ width: `${pct * 100}%`, height: 4, backgroundColor: c.text, borderRadius: 2 }} />
      </View>
    </View>
  );
}

function BreakRow({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
      <Text variant="body" color="textMuted">
        {label}
      </Text>
      <Text variant="body" weight="bold">
        {value}
      </Text>
    </View>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function subtitle(score: number) {
  if (score >= 80) return "You're recovered. Push hard today.";
  if (score >= 60) return "Solid readiness. Train as planned.";
  if (score >= 40) return "Dial intensity down 20–30%.";
  return "Prioritise sleep, food, and a walk today.";
}
function moodLabel(score: number) {
  return ["Rough", "Meh", "Okay", "Good", "Great"][score - 1] ?? "Okay";
}
function moodIconFor(score: number): keyof typeof Ionicons.glyphMap {
  return (
    (["sad", "sad-outline", "remove-outline", "happy-outline", "happy"] as const)[score - 1] ?? "happy-outline"
  );
}
