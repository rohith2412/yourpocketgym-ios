import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageBackground from "@/components/PageBackground";
import { useRouter } from "expo-router";
import PremiumGate from "@/components/PremiumGate";
import { useSubscription } from "@/src/hooks/useSubscription";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
//plan saved regenerate save plan good
const BASE_URL = "https://yourpocketgym.com";

const EQUIPMENT_OPTIONS = [
  "Full gym",
  "Dumbbells only",
  "Barbell & rack",
  "Resistance bands",
  "Bodyweight only",
  "Kettlebells",
  "Cable machine",
  "Home gym",
];
const FOCUS_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Glutes",
  "Core",
  "Full body",
  "Upper body",
  "Lower body",
];
const SESSION_LENGTHS = ["30", "45", "60", "75", "90"];
const QUICK_PROMPTS = [
  "How do I break through a bench press plateau?",
  "What should I eat before and after training?",
  "How many rest days do I actually need?",
  "Should I do cardio on rest days?",
  "How do I improve my squat form?",
  "What supplements are actually worth it?",
  "How do I build a bigger back?",
  "How do I lose fat without losing muscle?",
];

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// true  → show a pre-built plan for App Store screenshots
// false → normal live experience
const TRAINER_DEMO_MODE = true;

const DEMO_PLAN = {
  planTitle: "Hypertrophy Push·Pull·Legs",
  difficulty: "Intermediate",
  planSummary: "A 6-day PPL split engineered for maximum muscle growth. Progressive overload and deload built in from week 1.",
  weeklyVolume: "18–22 sets per muscle group / week",
  days: [
    {
      day: "Monday", label: "Push Day A", focus: "Chest", restDay: false, estimatedTime: 65,
      warmup: "5 min incline walk · 2 × 15 band pull-aparts",
      exercises: [
        { name: "Barbell Bench Press",    muscleGroup: "Chest",     sets: 4, reps: "6–8",   rest: "3 min",  tempo: "3-1-1-0", notes: "Drive through your lats. Touch chest lightly each rep." },
        { name: "Incline Dumbbell Press", muscleGroup: "Chest",     sets: 3, reps: "8–10",  rest: "2 min",  tempo: "2-1-1-0", notes: "30–45° incline. Elbows at ~60° from torso." },
        { name: "Cable Lateral Raise",   muscleGroup: "Shoulders", sets: 4, reps: "12–15", rest: "90 sec", tempo: "2-0-1-1", notes: "Lead with elbow. Slight forward lean." },
        { name: "Overhead Press",        muscleGroup: "Shoulders", sets: 3, reps: "8–10",  rest: "2 min",  tempo: "2-1-1-0", notes: "Bar path slightly forward of the crown." },
        { name: "Tricep Pushdown",       muscleGroup: "Arms",      sets: 3, reps: "10–12", rest: "90 sec", tempo: "2-0-1-1", notes: "Keep elbows fixed at sides." },
      ],
      cooldown: "Chest doorway stretch 60s each side · shoulder cross-body stretch",
    },
    {
      day: "Tuesday", label: "Pull Day A", focus: "Back", restDay: false, estimatedTime: 60,
      warmup: "Dead hang 3 × 20s · band face pulls 2 × 15",
      exercises: [
        { name: "Weighted Pull-Up",   muscleGroup: "Back",      sets: 4, reps: "5–7",   rest: "3 min",  tempo: "3-1-1-0", notes: "Full dead hang at bottom. Squeeze lat at top." },
        { name: "Barbell Row",        muscleGroup: "Back",      sets: 4, reps: "6–8",   rest: "2.5 min",tempo: "2-1-1-0", notes: "Hinge to ~45°. Pull bar to lower sternum." },
        { name: "Seated Cable Row",   muscleGroup: "Back",      sets: 3, reps: "10–12", rest: "90 sec", tempo: "2-1-1-1", notes: "Pause at full contraction each rep." },
        { name: "Barbell Curl",       muscleGroup: "Arms",      sets: 3, reps: "8–10",  rest: "2 min",  tempo: "3-0-1-0", notes: "Supinate fully at top. No body swing." },
        { name: "Face Pull",          muscleGroup: "Shoulders", sets: 3, reps: "15–20", rest: "60 sec", tempo: "2-1-1-0", notes: "Pull to forehead. External rotate at end." },
      ],
      cooldown: "Lat stretch in doorway 45s each side · bicep wall stretch 30s",
    },
    {
      day: "Wednesday", label: "Legs Day A", focus: "Legs", restDay: false, estimatedTime: 70,
      warmup: "5 min bike · bodyweight squats 2 × 15 · hip circles",
      exercises: [
        { name: "Barbell Back Squat",      muscleGroup: "Legs", sets: 4, reps: "6–8",   rest: "3 min",  tempo: "3-1-1-0", notes: "Break parallel. Knees tracking over toes." },
        { name: "Bulgarian Split Squat",   muscleGroup: "Legs", sets: 3, reps: "8–10",  rest: "2 min",  tempo: "2-1-1-0", notes: "Front foot forward. Rear foot elevated." },
        { name: "Leg Press",               muscleGroup: "Legs", sets: 3, reps: "12–15", rest: "2 min",  tempo: "2-0-1-0", notes: "High foot for more glute activation." },
        { name: "Romanian Deadlift",       muscleGroup: "Legs", sets: 3, reps: "10–12", rest: "2 min",  tempo: "3-1-1-0", notes: "Feel the hamstring stretch at bottom." },
        { name: "Leg Extension",           muscleGroup: "Legs", sets: 3, reps: "12–15", rest: "90 sec", tempo: "2-0-1-2", notes: "Pause at top. Control the eccentric." },
      ],
      cooldown: "Couch stretch 90s each side · pigeon pose 60s each side",
    },
    {
      day: "Thursday", label: "Rest & Recovery", focus: "Recovery", restDay: true, estimatedTime: 0,
      warmup: null, exercises: [], cooldown: null,
    },
    {
      day: "Friday", label: "Push Day B", focus: "Shoulders", restDay: false, estimatedTime: 60,
      warmup: "Shoulder CARs 2 × 5 each · band pull-aparts 2 × 15",
      exercises: [
        { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", sets: 4, reps: "8–10",  rest: "2 min",  tempo: "2-1-1-0", notes: "Neutral grip. Full range of motion." },
        { name: "Incline Cable Fly",       muscleGroup: "Chest",     sets: 3, reps: "12–15", rest: "90 sec", tempo: "3-0-1-0", notes: "Slight bend in elbow. Squeeze at centre." },
        { name: "Arnold Press",            muscleGroup: "Shoulders", sets: 3, reps: "10–12", rest: "90 sec", tempo: "2-1-1-0", notes: "Rotate palms out as you press." },
        { name: "Skull Crusher",           muscleGroup: "Arms",      sets: 3, reps: "10–12", rest: "90 sec", tempo: "3-0-1-0", notes: "Keep upper arms vertical." },
      ],
      cooldown: "Chest stretch on floor 60s · overhead tricep stretch 30s each",
    },
    {
      day: "Saturday", label: "Pull Day B", focus: "Back", restDay: false, estimatedTime: 60,
      warmup: "Scapular pull-ups 2 × 8 · band rows 2 × 15",
      exercises: [
        { name: "Lat Pulldown",          muscleGroup: "Back", sets: 4, reps: "8–10",  rest: "2 min",  tempo: "2-1-2-0", notes: "Wide overhand grip. Lean back slightly." },
        { name: "Dumbbell Row",          muscleGroup: "Back", sets: 3, reps: "10–12", rest: "90 sec", tempo: "2-1-1-0", notes: "Brace core. Elbow close to torso." },
        { name: "Hammer Curl",           muscleGroup: "Arms", sets: 3, reps: "10–12", rest: "90 sec", tempo: "2-0-1-1", notes: "Neutral grip. No swinging." },
        { name: "Incline Dumbbell Curl", muscleGroup: "Arms", sets: 3, reps: "10–12", rest: "90 sec", tempo: "3-0-1-0", notes: "Full stretch at bottom each rep." },
      ],
      cooldown: "Lat hang 30s · bicep wall stretch 30s each",
    },
    {
      day: "Sunday", label: "Rest & Recovery", focus: "Recovery", restDay: true, estimatedTime: 0,
      warmup: null, exercises: [], cooldown: null,
    },
  ],
  weeklyGoals: [
    "Add 2.5 kg to main lifts when you hit the top of the rep range for 3 consecutive sessions",
    "Log every session — track small wins to stay motivated and accountable",
    "Sleep 7–9 hours. Most muscle repair happens during deep sleep",
    "Hit your daily protein: 1.6–2.2 g per kg of bodyweight",
  ],
  progressionTips: [
    "Double progression: first add reps to top of range, then add weight",
    "Deload every 4–6 weeks — reduce volume by 40% to let joints recover",
    "Take progress photos every 4 weeks rather than weighing daily",
    "If a lift stalls, reset 10% and rebuild — breaking through plateaus takes patience",
  ],
  nutritionTips: [
    "Eat 300–500 kcal surplus on training days for lean muscle gain",
    "30 g protein within 2 hours post-workout aids recovery significantly",
    "Carb-load before heavy leg days — glycogen drives high-intensity performance",
    "Creatine monohydrate 3–5 g daily is the most evidence-backed supplement",
  ],
};

// ─── Auth Hook - reads from AsyncStorage synchronously on mount ───────────────
// No loading spinner: session is pre-loaded from cache instantly.
function useAuth() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(["token", "user"]).then(
      ([[, token], [, userRaw]]) => {
        if (token && userRaw) {
          try {
            const user = JSON.parse(userRaw);
            setSession({ user: { ...user, token } });
          } catch {}
        }
        setReady(true);
      },
    );
  }, []);

  return { session, ready };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function muscleColor(mg = "") {
  const map = {
    chest: "#e8380d",
    back: "#e8380d",
    shoulders: "#f59e0b",
    arms: "#ec4899",
    legs: "#22c55e",
    core: "#14b8a6",
    glutes: "#e8380d",
    cardio: "#ef4444",
  };
  return map[(mg || "").toLowerCase().split(/[\s,&]/)[0]] || "#aaa";
}

function difficultyColor(d = "") {
  return (
    { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" }[d] ||
    "#aaa"
  );
}

function difficultyBg(d = "") {
  return (
    {
      Beginner: "rgba(34,197,94,0.1)",
      Intermediate: "rgba(245,158,11,0.1)",
      Advanced: "rgba(239,68,68,0.1)",
    }[d] || "rgba(0,0,0,0.06)"
  );
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ height = 80, radius = 16 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        height,
        borderRadius: radius,
        backgroundColor: "#ece9e3",
        opacity: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      }}
    />
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, index }) {
  const [open, setOpen] = useState(false);
  const color = muscleColor(ex.muscleGroup);
  return (
    <Pressable onPress={() => setOpen(o => !o)} style={s.exerciseCard}>
      <View style={s.exerciseRow}>
        <Text style={s.exNum}>{String(index + 1).padStart(2, "0")}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
          <Text style={[s.exMuscle, { color }]}>{ex.muscleGroup}</Text>
        </View>
        <Text style={s.exSetsText}>{ex.sets}×{ex.reps}</Text>
      </View>
      {open && (
        <View style={s.exDetail}>
          {ex.notes && <Text style={s.exNotes}>{ex.notes}</Text>}
          {ex.tempo && (
            <Text style={s.exTempo}>Tempo {ex.tempo}  ·  Rest {ex.rest}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────
function DayCard({ day, index }) {
  const [open, setOpen] = useState(index === 0 && !day.restDay);
  const color = muscleColor(day.focus);

  if (day.restDay) {
    return (
      <View style={[s.dayCard, s.restDayCard]}>
        <View style={s.dayCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.dayWeekday}>{day.day}</Text>
            <Text style={s.dayLabel}>Rest & Recovery</Text>
            <Text style={s.dayMeta}>Active recovery · mobility</Text>
          </View>
          <View style={s.restPill}>
            <Text style={s.restPillText}>REST</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.dayCard}>
      <Pressable onPress={() => setOpen(o => !o)} style={s.dayCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.dayWeekday}>{day.day}</Text>
          <Text style={s.dayLabel}>{day.label}</Text>
          <Text style={s.dayMeta}>{day.exercises?.length} exercises · {day.estimatedTime} min</Text>
        </View>
        <View style={[s.focusBadge, { backgroundColor: color + "15" }]}>
          <Text style={[s.focusBadgeText, { color }]}>{day.focus}</Text>
        </View>
        <Text style={[s.chevron, open && { transform: [{ rotate: "90deg" }] }]}>›</Text>
      </Pressable>

      {open && (
        <View style={s.dayBody}>
          {day.warmup && (
            <View style={[s.warmupBox, { borderLeftColor: color }]}>
              <Text style={[s.warmupLabel, { color }]}>Warmup</Text>
              <Text style={s.warmupText}>{day.warmup}</Text>
            </View>
          )}
          <View style={{ gap: 1, marginBottom: day.cooldown ? 10 : 0 }}>
            {day.exercises?.map((ex, i) => (
              <ExerciseCard key={i} ex={ex} index={i} />
            ))}
          </View>
          {day.cooldown && (
            <View style={[s.cooldownBox, { borderLeftColor: color }]}>
              <Text style={[s.cooldownLabel, { color }]}>Cooldown</Text>
              <Text style={s.cooldownText}>{day.cooldown}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Week Strip ───────────────────────────────────────────────────────────────
function WeekStrip({ days }) {
  const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <View style={ws.wrap}>
      {days.map((day, i) => {
        const color = day.restDay ? "rgba(255,255,255,0.07)" : muscleColor(day.focus);
        return (
          <View key={i} style={ws.dayCol}>
            <View style={[ws.dot, { backgroundColor: color }]} />
            <Text style={[ws.dayLbl, !day.restDay && { color: "rgba(255,255,255,0.6)" }]}>
              {DAY_SHORT[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const ws = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginTop: 10,
  },
  dayCol: { alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dayLbl: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.16)" },
});

// ─── Plan View ────────────────────────────────────────────────────────────────
function PlanView({
  plan,
  onRegen,
  isLoading,
  onBack,
  onSave,
  isSaved,
  saving,
}) {
  const [tab, setTab] = useState("schedule");

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
    >
      {/* Action row */}
      <View style={s.actionRow}>
        <Pressable onPress={onBack} style={s.actionBtn}>
          <Text style={s.actionBtnText}>← Back</Text>
        </Pressable>
        {onRegen && (
          <Pressable
            onPress={onRegen}
            disabled={isLoading}
            style={[s.actionBtn, { opacity: isLoading ? 0.4 : 1 }]}
          >
            <Text style={[s.actionBtnText, { color: "#000000" }]}>
              {isLoading ? "Generating…" : "Regenerate"}
            </Text>
          </Pressable>
        )}
        {onSave && !isSaved ? (
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[s.actionBtnPrimary, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.actionBtnPrimaryText}>Save plan</Text>
            )}
          </Pressable>
        ) : onSave === null ? null : (
          <View style={s.savedBadge}>
            <Text style={s.savedBadgeText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Plan header */}
      <View style={s.planHeader}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.planEyebrow}>Your plan</Text>
            <Text style={s.planTitle}>{plan.planTitle}</Text>
          </View>
          <View
            style={[
              s.diffBadge,
              { backgroundColor: difficultyBg(plan.difficulty) },
            ]}
          >
            <Text
              style={[
                s.diffBadgeText,
                { color: difficultyColor(plan.difficulty) },
              ]}
            >
              {plan.difficulty}
            </Text>
          </View>
        </View>
        <Text style={s.planSummary}>{plan.planSummary}</Text>
        <View style={s.volBadge}>
          <Text style={s.volBadgeText}>{plan.weeklyVolume}</Text>
        </View>
      </View>

      {/* Week strip */}
      {plan.days && <WeekStrip days={plan.days} />}

      {/* Tab switcher */}
      <View style={s.segControl}>
        {[
          ["schedule", "Schedule"],
          ["tips", "Tips & Nutrition"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[s.segBtn, tab === key && s.segBtnActive]}
          >
            <Text style={[s.segBtnText, tab === key && s.segBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "schedule" && (
        <View style={{ gap: 8 }}>
          {plan.days?.map((day, i) => (
            <DayCard key={i} day={day} index={i} />
          ))}
        </View>
      )}

      {tab === "tips" && (
        <View style={{ gap: 10 }}>
          {plan.weeklyGoals?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Weekly goals</Text>
              {plan.weeklyGoals.map((g, i) => (
                <View key={i} style={s.tipRow}>
                  <View style={s.tipNum}>
                    <Text style={s.tipNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.tipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.progressionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Progression</Text>
              {plan.progressionTips.map((t, i) => (
                <View key={i} style={s.tipRow}>
                  <View
                    style={[
                      s.tipNum,
                      { backgroundColor: "rgba(99,102,241,0.1)" },
                    ]}
                  >
                    <Text style={[s.tipNumText, { color: "#e8380d" }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={s.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.nutritionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Nutrition</Text>
              {plan.nutritionTips.map((t, i) => (
                <View key={i} style={s.tipRow}>
                  <View
                    style={[
                      s.tipNum,
                      { backgroundColor: "rgba(34,197,94,0.1)" },
                    ]}
                  >
                    <Text style={[s.tipNumText, { color: "#22c55e" }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={s.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Saved Plan Card ──────────────────────────────────────────────────────────
function SavedPlanCard({ saved, onView, onRemove, removing }) {
  return (
    <View style={s.card}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <View
          style={[
            s.diffBadge,
            { backgroundColor: difficultyBg(saved.plan.difficulty) },
          ]}
        >
          <Text
            style={[
              s.diffBadgeText,
              { color: difficultyColor(saved.plan.difficulty) },
            ]}
          >
            {saved.plan.difficulty}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: "#bbb" }}>
          {fmtDate(saved.savedAt)}
        </Text>
      </View>
      <Text style={s.savedPlanTitle}>{saved.plan.planTitle}</Text>
      <Text style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
        {saved.plan.weeklyVolume}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <Pressable onPress={() => onView(saved)} style={s.viewBtn}>
          <Text style={s.viewBtnText}>View plan</Text>
        </Pressable>
        <Pressable
          onPress={() => onRemove(saved._id)}
          disabled={removing}
          style={[s.removeBtn, { opacity: removing ? 0.4 : 1 }]}
        >
          <Text style={s.removeBtnText}>{removing ? "…" : "Remove"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({ extra, intro, token }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: intro
        ? `Good ${getGreeting()}. I can see your goal is ${intro.fitnessGoal || "improving fitness"}. What do you want to work on?`
        : "Good. Ask me anything about training, nutrition or recovery.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "chat", extra, messages: next }),
      });
      const json = await res.json();
      if (json.success)
        setMessages((p) => [
          ...p,
          { role: "assistant", content: json.data.reply },
        ]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "Connection error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length <= 1 && (
          <View style={{ gap: 6, marginBottom: 8 }}>
            <Text style={s.eyebrow}>Suggested questions</Text>
            {QUICK_PROMPTS.map((q, i) => (
              <Pressable key={i} onPress={() => send(q)} style={s.promptBtn}>
                <Text style={s.promptText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              s.msgRow,
              m.role === "user" && { justifyContent: "flex-end" },
            ]}
          >
            {m.role === "assistant" && <View style={s.botDot} />}
            <View
              style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleBot]}
            >
              <Text
                style={[s.bubbleText, m.role === "user" && { color: "#fff" }]}
              >
                {m.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={s.msgRow}>
            <View style={s.botDot} />
            <View
              style={[
                s.bubbleBot,
                { paddingHorizontal: 16, paddingVertical: 14 },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={s.typingDot} />
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor="#bbb"
          multiline
          style={s.chatInput}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={() => send()}
        />
        <Pressable
          onPress={() => send()}
          disabled={!input.trim() || loading}
          style={[s.sendBtn, input.trim() && !loading && s.sendBtnActive]}
        >
          <Text
            style={[
              s.sendBtnIcon,
              input.trim() && !loading && { color: "#fff" },
            ]}
          >
            ↑
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Profile Banner ───────────────────────────────────────────────────────────
// Fixed: proper alignment, no emoji, cleaner tag layout
function ProfileBanner({ intro, extra, onEdit }) {
  if (!intro) return null;

  const tags = [
    intro.age && `${intro.age} yrs`,
    intro.weight && `${intro.weight} kg`,
    intro.height && `${intro.height} cm`,
    intro.fitnessGoal && intro.fitnessGoal,
    intro.experienceLevel && intro.experienceLevel,
    extra.equipment && extra.equipment,
  ].filter(Boolean);

  return (
    <View style={s.profileBanner}>
      <View style={s.profileBannerLeft}>
        <Text style={s.profileBannerEyebrow}>Profile</Text>
        <View style={s.profileTags}>
          {tags.map((tag, i) => (
            <View key={i} style={s.profileTag}>
              <Text style={s.profileTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable onPress={onEdit} style={s.profileEditBtn}>
        <Text style={s.profileEditBtnText}>Add</Text>
        <Text style={s.profileEditBtnText}>✎</Text>
      </Pressable>
    </View>
  );
}

// ─── Extra Form ───────────────────────────────────────────────────────────────
function ExtraForm({ extra, onChange, onClose }) {
  const [local, setLocal] = useState({ ...extra });

  const toggle = (field, val) =>
    setLocal((p) => ({ ...p, [field]: p[field] === val ? "" : val }));

  const toggleMulti = (field, val) => {
    const arr = (local[field] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = arr.includes(val)
      ? arr.filter((v) => v !== val)
      : [...arr, val];
    setLocal((p) => ({ ...p, [field]: next.join(", ") }));
  };

  const isMulti = (field, val) =>
    (local[field] || "")
      .split(",")
      .map((s) => s.trim())
      .includes(val);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          <Text style={s.sheetTitle}>Personalise plan</Text>

          <Text style={s.sheetLabel}>Equipment</Text>
          <View style={s.chipRow}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                active={local.equipment === eq}
                onPress={() => toggle("equipment", eq)}
              />
            ))}
          </View>

          <Text style={[s.sheetLabel, { marginTop: 20 }]}>Focus areas</Text>
          <View style={s.chipRow}>
            {FOCUS_OPTIONS.map((f) => (
              <Chip
                key={f}
                label={f}
                active={isMulti("focusAreas", f)}
                onPress={() => toggleMulti("focusAreas", f)}
              />
            ))}
          </View>

          <Text style={[s.sheetLabel, { marginTop: 20 }]}>Session length</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {SESSION_LENGTHS.map((l) => (
              <Pressable
                key={l}
                onPress={() => toggle("sessionLength", l)}
                style={[
                  s.sessBtn,
                  local.sessionLength === l && s.sessBtnActive,
                ]}
              >
                <Text
                  style={[
                    s.sessBtnText,
                    local.sessionLength === l && { color: "#fff" },
                  ]}
                >
                  {l}m
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.sheetLabel, { marginTop: 20 }]}>
            Injuries / limitations
          </Text>
          <TextInput
            value={local.injuries || ""}
            onChangeText={(v) => setLocal((p) => ({ ...p, injuries: v }))}
            placeholder="e.g. bad knees, lower back…"
            placeholderTextColor="#bbb"
            style={s.injuryInput}
          />

          <Pressable
            onPress={() => {
              onChange(local);
              onClose();
            }}
            style={[s.saveSheetBtn, { marginTop: 28 }]}
          >
            <Text style={s.saveSheetBtnText}>Save & apply</Text>
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AITrainerScreen() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const { isPremium } = useSubscription();

  const [intro, setIntro] = useState(null);
  const [introReady, setIntroReady] = useState(false);
  const [extra, setExtra] = useState({
    equipment: "",
    focusAreas: "",
    sessionLength: "45",
    injuries: "",
  });
  const [showExtra, setShowExtra] = useState(false);
  const [mainTab, setMainTab] = useState("plan");
  const [plan, setPlan] = useState(TRAINER_DEMO_MODE ? DEMO_PLAN : null);
  const [planLoad, setPlanLoad] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [showPlan, setShowPlan] = useState(TRAINER_DEMO_MODE);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [viewingSaved, setViewingSaved] = useState(null);

  const token = session?.user?.token || "";

  // ── Auth guard - fires as soon as ready, no spinner ──────────────────────
  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    // Fetch user-intro from server
    fetch(`${BASE_URL}/api/user-intro`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setIntro(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setIntroReady(true));
  }, [ready]);

  useEffect(() => {
    if (mainTab !== "saved") return;

    setSavedLoading(true);
    // Fetch saved plans from server
    fetch(`${BASE_URL}/api/ai-trainer/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSavedPlans(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setSavedLoading(false));
  }, [mainTab]);

  async function generatePlan(forceNew = false) {
    if (!session) return;
    if (!forceNew && plan) {
      setShowPlan(true);
      return;
    }
    setPlanLoad(true);
    setPlanError(null);
    setSavedId(null);
    try {
      const res = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "plan", extra }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setPlan(json.data);
      setShowPlan(true);
    } catch (e) {
      setPlanError(e.message);
    } finally {
      setPlanLoad(false);
    }
  }

  async function savePlan() {
    if (!plan || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai-trainer/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.success) {
        const id = json.data._id;
        setSavedId(id);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(id) {
    // Remove from UI immediately
    setSavedPlans((p) => p.filter((sv) => sv._id !== id));
    if (viewingSaved?._id === id) setViewingSaved(null);
    if (savedId === id) setSavedId(null);
    setRemovingId(id);
    // Fire-and-forget server delete
    fetch(`${BASE_URL}/api/ai-trainer/saved/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .catch(() => {})
      .finally(() => setRemovingId(null));
  }

  // ── No spinner - show screen immediately from cached session ─────────────
  if (!ready && !TRAINER_DEMO_MODE) return null;

  const firstName = session?.user?.name?.split(" ")[0] ?? "Athlete";
  const showTabs = !showPlan && !viewingSaved;

  return (
    <PremiumGate isUserPremium={isPremium} featureName="AI Trainer">
      <SafeAreaView style={s.screen} edges={["top"]}>
        {/* <PageBackground variant="trainer" /> */}
        {/* ── Header ── */}
        <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              Good {getGreeting()}, {firstName}
            </Text>
            <Text style={s.headerTitle}>AI Trainer</Text>
          </View>

          <AvatarButton />
        </View>

        {showTabs && (
          <View style={s.tabRow}>
            {[
              ["plan", "Plan"],
              ["saved", "Saved"],
              ["chat", "Chat"],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setMainTab(key)}
                style={s.tabItem}
              >
                <Text style={[s.tabText, mainTab === key && s.tabTextActive]}>
                  {label}
                </Text>
                <View style={[s.tabLine, mainTab === key && s.tabLineActive]} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Profile banner - shown on plan + saved tabs */}
        {showTabs && mainTab !== "chat" && introReady && (
          <ProfileBanner
            intro={intro}
            extra={extra}
            onEdit={() => setShowExtra(true)}
          />
        )}

        {/* Plan tab - landing edit */}
        {mainTab === "plan" && !showPlan && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: 40,
              gap: 14,
            }}
          >
            <View style={s.planLandingCard}>
              <Text style={s.planLandingTitle}>Your weekly plan</Text>
              <Text style={s.planLandingDesc}>
                AI builds a full programme based on your profile, goals and
                equipment.
              </Text>
              {planError && <Text style={s.errorText}>{planError}</Text>}
              <Pressable
                onPress={() => generatePlan(false)}
                disabled={planLoad}
                style={[s.generateBtn, { opacity: planLoad ? 0.6 : 1 }]}
              >
                {planLoad ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={s.generateBtnText}>Building your plan…</Text>
                  </View>
                ) : (
                  <Text style={s.generateBtnText}>
                    {plan ? "View my plan" : "Generate weekly plan"}
                  </Text>
                )}
              </Pressable>
            </View>

            {planLoad ? (
              <View style={{ gap: 10 }}>
                {[120, 72, 72, 72, 72].map((h, i) => (
                  <Skeleton key={i} height={h} />
                ))}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {[
                  {
                    title: "Full 7-day schedule",
                    desc: "Training days and rest days tailored to your availability",
                  },
                  {
                    title: "Exercise breakdown",
                    desc: "Sets, reps, rest periods and tempo for every movement",
                  },
                  {
                    title: "Progression system",
                    desc: "How to add load and intensity each week",
                  },
                  {
                    title: "Nutrition guidelines",
                    desc: "What to eat to support your specific goal",
                  },
                  {
                    title: "Warmup & cooldown",
                    desc: "Built into every training day",
                  },
                ].map((f, i) => (
                  <View
                    key={i}
                    style={[
                      s.card,
                      {
                        flexDirection: "row",
                        gap: 14,
                        padding: 16,
                        alignItems: "flex-start",
                      },
                    ]}
                  >
                    <View style={s.featureNum}>
                      <Text style={s.featureNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.featureTitle}>{f.title}</Text>
                      <Text style={s.featureDesc}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Plan view */}
        {mainTab === "plan" && showPlan && plan && (
          <PlanView
            plan={plan}
            onRegen={() => generatePlan(true)}
            isLoading={planLoad}
            onBack={() => setShowPlan(false)}
            onSave={savePlan}
            isSaved={!!savedId}
            saving={saving}
          />
        )}

        {/* Saved tab */}
        {mainTab === "saved" && !viewingSaved && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: 40,
              gap: 10,
            }}
          >
            {savedLoading ? (
              <View style={{ gap: 10 }}>
                {[90, 90, 90].map((h, i) => (
                  <Skeleton key={i} height={h} />
                ))}
              </View>
            ) : savedPlans.length === 0 ? (
              <View style={[s.card, { alignItems: "center", padding: 48 }]}>
                <Text style={s.emptyTitle}>No saved plans</Text>
                <Text style={s.emptyDesc}>
                  Generate a plan and tap Save to keep it here.
                </Text>
              </View>
            ) : (
              savedPlans.map((sv) => (
                <SavedPlanCard
                  key={sv._id}
                  saved={sv}
                  onView={(item) => setViewingSaved(item)}
                  onRemove={removePlan}
                  removing={removingId === sv._id}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* Saved plan viewer */}
        {mainTab === "saved" && viewingSaved && (
          <PlanView
            plan={viewingSaved.plan}
            onRegen={null}
            isLoading={false}
            onBack={() => setViewingSaved(null)}
            onSave={null}
            isSaved={true}
            saving={false}
          />
        )}

        {/* Chat tab */}
        {mainTab === "chat" && (
          <ChatView extra={extra} intro={intro} token={token} />
        )}
      </View>

      {showExtra && (
        <ExtraForm
          extra={extra}
          onChange={setExtra}
          onClose={() => setShowExtra(false)}
        />
      )}
      </SafeAreaView>
    </PremiumGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafaf8" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.6)",
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  greeting: { fontSize: 12, color: "#323131", fontWeight: "400", marginBottom: 2 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1,
  },

  // Avatar - shows first initial, no emoji
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Tabs
  tabRow: { flexDirection: "row" },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    position: "relative",
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#bbb" },
  tabTextActive: { color: "#1a1a1a", fontWeight: "700" },
  tabLine: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabLineActive: { backgroundColor: "#000000" },
  tabBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e8380d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // Profile banner - fixed alignment
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  profileBannerLeft: { flex: 1, marginRight: 12 },
  profileBannerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  profileTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  profileTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  profileTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  profileEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  profileEditBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e8e5de",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  // Plan landing
  planLandingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5de",
    padding: 24,
    alignItems: "center",
    marginTop: 4,
  },
  planLandingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  planLandingDesc: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 22,
    marginBottom: 22,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "600",
    marginBottom: 12,
  },
  generateBtn: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Feature list
  featureNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f4f2ed",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureNumText: { fontSize: 12, fontWeight: "800", color: "#aaa" },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  featureDesc: { fontSize: 13, color: "#aaa", lineHeight: 19 },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#fff" },

  // Eyebrow
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#bbb",
    marginBottom: 10,
  },

  // Plan view
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#0b0a0a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  savedBadge: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    borderRadius: 12,
    alignItems: "center",
  },
  savedBadgeText: { fontSize: 13, fontWeight: "700", color: "#22c55e" },

  planHeader: { backgroundColor: "#1a1a1a", borderRadius: 20, padding: 20 },
  planEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  planSummary: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
    marginVertical: 10,
  },
  volBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  volBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  diffBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  segControl: {
    flexDirection: "row",
    backgroundColor: "#f0ede8",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  segBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  segBtnText: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  segBtnTextActive: { color: "#1a1a1a", fontWeight: "700" },

  // Day card
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e8e5de",
    overflow: "hidden",
  },
  restDayCard: { opacity: 0.55 },
  dayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  dayWeekday: {
    fontSize: 10,
    fontWeight: "700",
    color: "#c0bdb5",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  dayMeta: { fontSize: 12, color: "#bbb", marginTop: 2 },
  focusBadge: {
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  focusBadgeText: { fontSize: 11, fontWeight: "700" },
  chevron: { fontSize: 18, color: "#ccc", marginLeft: 4 },
  dayBody: { borderTopWidth: 1, borderTopColor: "#f4f1ec", padding: 12, gap: 10 },

  warmupBox: {
    backgroundColor: "#fafaf8", borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: "#e8380d",
  },
  warmupLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#c0bdb5",
    marginBottom: 4,
  },
  warmupText: { fontSize: 12, color: "#777", lineHeight: 18 },
  cooldownBox: {
    backgroundColor: "#fafaf8", borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: "#e8380d",
  },
  cooldownLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#c0bdb5",
    marginBottom: 4,
  },
  cooldownText: { fontSize: 12, color: "#777", lineHeight: 18 },

  restPill: {
    backgroundColor: "#f0ede8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  restPillText: { fontSize: 9, fontWeight: "800", color: "#c0bdb5", letterSpacing: 1.2 },

  // Exercise card — minimal list style
  exerciseCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f1ec",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 2,
    paddingVertical: 11,
  },
  exNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d0cdc5",
    width: 22,
    textAlign: "right",
    flexShrink: 0,
  },
  exName: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  exMuscle: { fontSize: 11, marginTop: 1, fontWeight: "500" },
  exSetsText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", flexShrink: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  exDetail: {
    paddingLeft: 34,
    paddingRight: 2,
    paddingBottom: 12,
  },
  exNotes: { fontSize: 13, color: "#777", lineHeight: 20 },
  exTempo: {
    fontSize: 11,
    color: "#bbb",
    marginTop: 6,
    fontWeight: "500",
  },

  // Tips
  tipSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipNumText: { fontSize: 11, fontWeight: "800", color: "#e8380d" },
  tipText: { fontSize: 14, color: "#555", lineHeight: 21, flex: 1 },

  // Saved plan card
  savedPlanTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
  },
  viewBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    borderRadius: 12,
    alignItems: "center",
  },
  removeBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },

  // Empty
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 21,
    textAlign: "center",
  },

  // Chat saved
  promptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
    borderRadius: 14,
  },
  promptText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    lineHeight: 20,
  },
  msgRow: { flexDirection: "row", alignItems: "flex-end" },
  botDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1a1a1a",
    marginRight: 10,
    marginBottom: 6,
    flexShrink: 0,
  },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 22, color: "#1a1a1a" },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ccc" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 6 : 10,
    borderTopWidth: 1,
    borderTopColor: "#e8e5de",
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 14,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fff",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f0ede8",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: "#1a1a1a" },
  sendBtnIcon: { fontSize: 18, color: "#ccc", fontWeight: "700" },

  // Extra form sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fafaf8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0ddd6",
    alignSelf: "center",
    marginTop: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  sheetLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#bbb",
    marginBottom: 10,
  },
  sessBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  sessBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  sessBtnText: { fontSize: 13, fontWeight: "700", color: "#aaa" },
  injuryInput: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 13,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fff",
  },
  saveSheetBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveSheetBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
