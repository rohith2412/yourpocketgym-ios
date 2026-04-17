// AITrainerScreen.jsx startersIntro
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://yourpocketgym.com";

const EQUIPMENT_OPTIONS = [
  "Full gym", "Dumbbells only", "Barbell & rack", "Resistance bands",
  "Bodyweight only", "Kettlebells", "Cable machine", "Home gym",
];
const FOCUS_OPTIONS = [
  "Chest", "Back", "Shoulders", "Arms", "Legs", "Glutes",
  "Core", "Full body", "Upper body", "Lower body",
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

// ─── Auth Hook ────────────────────────────────────────────────────────────────
function useAuth() {
  const [session, setSession] = useState(null);
  const [status,  setStatus]  = useState("loading");

  useEffect(() => {
    async function loadAuth() {
      try {
        const token   = await AsyncStorage.getItem("token");
        const userRaw = await AsyncStorage.getItem("user");
        if (!token || !userRaw) {
          setStatus("unauthenticated");
          return;
        }
        const user = JSON.parse(userRaw);
        setSession({ user: { ...user, token } });
        setStatus("authenticated");
      } catch (e) {
        setStatus("unauthenticated");
      }
    }
    loadAuth();
  }, []);

  return { session, status };
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
    chest: "#ff6b35", back: "#6366f1", shoulders: "#f59e0b",
    arms: "#ec4899", legs: "#22c55e", core: "#14b8a6",
    glutes: "#8b5cf6", cardio: "#ef4444",
  };
  const key = (mg || "").toLowerCase().split(/[\s,&]/)[0];
  return map[key] || "#aaa";
}

function difficultyColor(d = "") {
  return { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" }[d] || "#aaa";
}

function difficultyBg(d = "") {
  return {
    Beginner:     "rgba(34,197,94,0.1)",
    Intermediate: "rgba(245,158,11,0.1)",
    Advanced:     "rgba(239,68,68,0.1)",
  }[d] || "rgba(255,255,255,0.08)";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, style }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ height = 80 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return <Animated.View style={[s.skeletonBase, { height, opacity }]} />;
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, index }) {
  const [open, setOpen] = useState(false);
  const color = muscleColor(ex.muscleGroup);
  return (
    <TouchableOpacity
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.85}
      style={s.exerciseCard}
    >
      <View style={s.exerciseRow}>
        <View style={[s.exerciseIndex, open && s.exerciseIndexOpen]}>
          <Text style={[s.exerciseIndexText, open && { color: "#fff" }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.exerciseName} numberOfLines={1}>{ex.name}</Text>
          <Text style={s.exerciseMuscle}>{ex.muscleGroup}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.exerciseSets}>{ex.sets} × {ex.reps}</Text>
          <Text style={s.exerciseRest}>rest {ex.rest}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: color }]} />
      </View>
      {open && (
        <View style={s.exerciseDetail}>
          {ex.tempo && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              <Text style={s.tempoLabel}>Tempo</Text>
              <View style={s.tempoBadge}>
                <Text style={s.tempoBadgeText}>{ex.tempo}</Text>
              </View>
            </View>
          )}
          {ex.notes && <Text style={s.exerciseNotes}>💡 {ex.notes}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, index }) {
  const [open, setOpen] = useState(index === 0 && !day.restDay);

  if (day.restDay) {
    return (
      <View style={s.restDayCard}>
        <View style={s.restDayIcon}><Text style={{ fontSize: 18 }}>😴</Text></View>
        <View>
          <Text style={s.dayCardTitle}>{day.day}</Text>
          <Text style={s.dayCardSub}>Rest & Recovery</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.dayCard}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.85}
        style={s.dayCardHeader}
      >
        <View style={[s.dayIndexBox, open && s.dayIndexBoxOpen]}>
          <Text style={[s.dayIndexLabel, open && { color: "rgba(255,255,255,0.45)" }]}>
            {day.day.slice(0, 3).toUpperCase()}
          </Text>
          <Text style={[s.dayIndexNum, open && { color: "#fff" }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.dayLabel}>{day.label}</Text>
          <Text style={s.dayMeta}>{day.exercises?.length} exercises · {day.estimatedTime}min</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={s.focusBadge}><Text style={s.focusBadgeText}>{day.focus}</Text></View>
          <Text style={[s.chevron, open && s.chevronOpen]}>›</Text>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={s.dayCardBody}>
          {day.warmup && (
            <View style={s.warmupBox}>
              <Text style={s.warmupLabel}>🔥 Warmup</Text>
              <Text style={s.warmupText}>{day.warmup}</Text>
            </View>
          )}
          <View style={{ gap: 6, marginBottom: 10 }}>
            {day.exercises?.map((ex, i) => <ExerciseCard key={i} ex={ex} index={i} />)}
          </View>
          {day.cooldown && (
            <View style={s.cooldownBox}>
              <Text style={s.cooldownLabel}>🧘 Cooldown</Text>
              <Text style={s.cooldownText}>{day.cooldown}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Plan View ────────────────────────────────────────────────────────────────
function PlanView({ plan, onRegen, isLoading, onBack, onSave, isSaved, saving }) {
  const [tab, setTab] = useState("schedule");

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 32 }}>
      <View style={s.actionRow}>
        <TouchableOpacity onPress={onBack} style={s.actionBtn}>
          <Text style={s.actionBtnText}>← Edit</Text>
        </TouchableOpacity>
        {onRegen && (
          <TouchableOpacity
            onPress={onRegen}
            disabled={isLoading}
            style={[s.actionBtn, { opacity: isLoading ? 0.5 : 1 }]}
          >
            <Text style={[s.actionBtnText, { color: "#ff6b35" }]}>
              {isLoading ? "…" : "🔄 Regenerate"}
            </Text>
          </TouchableOpacity>
        )}
        {onSave && !isSaved ? (
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[s.actionBtnSave, { opacity: saving ? 0.7 : 1 }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.actionBtnSaveText}>💾 Save</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={s.savedBadge}>
            <Text style={s.savedBadgeText}>✓ Saved</Text>
          </View>
        )}
      </View>

      <View style={s.planHeaderCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.planHeaderEyebrow}>Your Plan</Text>
            <Text style={s.planHeaderTitle}>{plan.planTitle}</Text>
          </View>
          <View style={[s.diffBadge, { backgroundColor: difficultyBg(plan.difficulty) }]}>
            <Text style={[s.diffBadgeText, { color: difficultyColor(plan.difficulty) }]}>
              {plan.difficulty}
            </Text>
          </View>
        </View>
        <Text style={s.planSummary}>{plan.planSummary}</Text>
        <View style={s.weeklyVolBadge}>
          <Text style={s.weeklyVolText}>📅 {plan.weeklyVolume}</Text>
        </View>
      </View>

      <View style={s.tabBar}>
        {[["schedule", "📅 Schedule"], ["tips", "💡 Tips & Nutrition"]].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
          >
            <Text style={[s.tabBtnText, tab === key && s.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "schedule" && (
        <View style={{ gap: 8 }}>
          {plan.days?.map((day, i) => <DayCard key={i} day={day} index={i} />)}
        </View>
      )}

      {tab === "tips" && (
        <View style={{ gap: 10 }}>
          {plan.weeklyGoals?.length > 0 && (
            <View style={s.card}>
              <Text style={[s.tipSectionLabel, { color: "#ff6b35" }]}>🎯 Weekly goals</Text>
              {plan.weeklyGoals.map((g, i) => (
                <View key={i} style={s.tipRow}>
                  <View style={s.tipNum}><Text style={s.tipNumText}>{i + 1}</Text></View>
                  <Text style={s.tipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.progressionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={[s.tipSectionLabel, { color: "#6366f1" }]}>📈 Progression</Text>
              {plan.progressionTips.map((t, i) => (
                <View key={i} style={s.tipRow}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                  <Text style={s.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.nutritionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={[s.tipSectionLabel, { color: "#22c55e" }]}>🥗 Nutrition</Text>
              {plan.nutritionTips.map((t, i) => (
                <View key={i} style={s.tipRow}>
                  <Text style={{ fontSize: 14 }}>🌿</Text>
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
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <View style={[s.diffBadge, { backgroundColor: difficultyBg(saved.plan.difficulty) }]}>
              <Text style={[s.diffBadgeText, { color: difficultyColor(saved.plan.difficulty) }]}>
                {saved.plan.difficulty}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: "#bbb" }}>{fmtDate(saved.savedAt)}</Text>
          </View>
          <Text style={s.savedPlanTitle}>{saved.plan.planTitle}</Text>
          <Text style={{ fontSize: 11, color: "#aaa" }}>{saved.plan.weeklyVolume}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
        <TouchableOpacity onPress={() => onView(saved)} style={s.viewPlanBtn}>
          <Text style={s.viewPlanBtnText}>View Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRemove(saved._id)}
          disabled={removing}
          style={[s.removeBtn, { opacity: removing ? 0.5 : 1 }]}
        >
          <Text style={s.removeBtnText}>{removing ? "…" : "🗑 Remove"}</Text>
        </TouchableOpacity>
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
        ? `Hey! I'm your AI trainer. I can see you're ${intro.age ? `${intro.age} years old` : "getting started"} and your goal is ${intro.fitnessGoal || "to improve your fitness"}. What do you want to work on today?`
        : "Hey! I'm your AI personal trainer. Ask me anything about training, nutrition, recovery or technique - I'm here to help.",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", extra, messages: newMessages }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => [...prev, { role: "assistant", content: json.data.reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had a connection issue. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={120}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 12, gap: 10 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length <= 1 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.label}>Quick questions</Text>
            <View style={{ gap: 6 }}>
              {QUICK_PROMPTS.map((q, i) => (
                <TouchableOpacity key={i} onPress={() => send(q)} style={s.quickPromptBtn} activeOpacity={0.75}>
                  <Text style={s.quickPromptText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[s.msgRow, m.role === "user" && { justifyContent: "flex-end" }]}>
            {m.role === "assistant" && (
              <View style={s.botAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
            )}
            <View style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleBot]}>
              <Text style={[s.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.content}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={s.msgRow}>
            <View style={s.botAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
            <View style={s.bubbleBot}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {[0, 1, 2].map(i => <View key={i} style={s.typingDot} />)}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask your trainer anything…"
          placeholderTextColor="#bbb"
          multiline
          style={s.chatInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={() => send()}
          disabled={!input.trim() || loading}
          style={[s.sendBtn, input.trim() && !loading ? s.sendBtnActive : {}]}
        >
          <Text style={[s.sendBtnIcon, input.trim() ? { color: "#fff" } : {}]}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Profile Banner ───────────────────────────────────────────────────────────
function ProfileBanner({ intro, extra, onEditExtra }) {
  if (!intro) return null;
  const items = [
    intro.age             && `${intro.age}y`,
    intro.weight          && `${intro.weight}kg`,
    intro.height          && `${intro.height}cm`,
    intro.fitnessGoal     && intro.fitnessGoal,
    intro.experienceLevel && intro.experienceLevel,
    extra.equipment       && extra.equipment,
  ].filter(Boolean);

  return (
    <View style={s.profileBanner}>
      <View style={{ flex: 1 }}>
        <Text style={s.profileBannerLabel}>Your Profile</Text>
        <View style={s.profileTags}>
          {items.map((item, i) => (
            <View key={i} style={s.profileTag}>
              <Text style={s.profileTagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity onPress={onEditExtra} style={s.editBtn}>
        <Text style={s.editBtnText}>Edit ✏️</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Extra Form ───────────────────────────────────────────────────────────────
function ExtraForm({ extra, onChange, onClose }) {
  const [local, setLocal] = useState({ ...extra });

  function toggle(field, val) {
    setLocal(prev => ({ ...prev, [field]: prev[field] === val ? "" : val }));
  }
  function toggleMulti(field, val) {
    const arr  = local[field] ? local[field].split(",").map(s => s.trim()).filter(Boolean) : [];
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    setLocal(prev => ({ ...prev, [field]: next.join(", ") }));
  }
  function isMultiActive(field, val) {
    return (local[field] || "").split(",").map(s => s.trim()).includes(val);
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={s.sheetTitle}>Personalise your plan</Text>

          <View style={{ marginBottom: 16 }}>
            <Label>Equipment available</Label>
            <View style={s.chipWrap}>
              {EQUIPMENT_OPTIONS.map(eq => (
                <Chip key={eq} label={eq} active={local.equipment === eq} onPress={() => toggle("equipment", eq)} />
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Label>Focus areas (pick multiple)</Label>
            <View style={s.chipWrap}>
              {FOCUS_OPTIONS.map(f => (
                <Chip key={f} label={f} active={isMultiActive("focusAreas", f)} onPress={() => toggleMulti("focusAreas", f)} />
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Label>Session length</Label>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {SESSION_LENGTHS.map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => toggle("sessionLength", l)}
                  style={[s.sessBtn, local.sessionLength === l && s.sessBtnActive]}
                >
                  <Text style={[s.sessBtnText, local.sessionLength === l && { color: "#fff" }]}>{l}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Label>Injuries or limitations</Label>
            <TextInput
              value={local.injuries || ""}
              onChangeText={v => setLocal(p => ({ ...p, injuries: v }))}
              placeholder="e.g. bad knees, lower back pain…"
              placeholderTextColor="#bbb"
              style={s.injuryInput}
            />
          </View>

          <TouchableOpacity onPress={() => { onChange(local); onClose(); }} style={s.saveBtn}>
            <Text style={s.saveBtnText}>Save & apply</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AITrainerScreen() {
  const { session, status } = useAuth();
  const navigation = useNavigation();

  const [intro,        setIntro]        = useState(null);
  const [introLoad,    setIntroLoad]    = useState(true);
  const [extra,        setExtra]        = useState({ equipment: "", focusAreas: "", sessionLength: "45", injuries: "" });
  const [showExtra,    setShowExtra]    = useState(false);
  const [mainTab,      setMainTab]      = useState("plan");
  const [plan,         setPlan]         = useState(null);
  const [planLoad,     setPlanLoad]     = useState(false);
  const [planError,    setPlanError]    = useState(null);
  const [showPlan,     setShowPlan]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedId,      setSavedId]      = useState(null);
  const [savedPlans,   setSavedPlans]   = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [removingId,   setRemovingId]   = useState(null);
  const [viewingSaved, setViewingSaved] = useState(null);

  const token = session?.user?.token || "";

  // ── Auth guard ──────────────────────────────────────────────────────────── generatePlan
  // ✅ only redirects to login — intro check is handled by the fetch below
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      navigation.replace("login");
    }
  }, [status]);

  // ── Fetch user intro ──────────────────────────────────────────────────────
  // ✅ trusts the API not the stale AsyncStorage cache — if no intro found
  // in DB redirect to startersIntro, otherwise load it and continue
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`${BASE_URL}/api/user-intro`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setIntro(json.data);
        } 
      })
      .catch(e => console.error("intro fetch", e))
      .finally(() => setIntroLoad(false));
  }, [status]);

  // ── Fetch saved plans when saved tab opens ────────────────────────────────
  useEffect(() => {
    if (mainTab !== "saved") return;
    loadSavedPlans();
  }, [mainTab]);

  async function loadSavedPlans() {
    setSavedLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSavedPlans(json.data);
    } catch (e) {
      console.error("loadSavedPlans", e);
    } finally {
      setSavedLoading(false);
    }
  }

async function generatePlan(forceNew = false) {
  if (status !== "authenticated") return;
  if (!forceNew && plan) { setShowPlan(true); return; }
  setPlanLoad(true); setPlanError(null); setSavedId(null);
  try {
    const res = await fetch(`${BASE_URL}/api/ai-trainer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ type: "plan", extra }),
    });
    const json = await res.json();
    console.log("ai-trainer response:", JSON.stringify(json)); // ✅ debug
    if (!json.success) throw new Error(json.error || `Server returned ${res.status}`);
    setPlan(json.data);
    setShowPlan(true);
  } catch (e) {
    console.error("generatePlan error:", e.message);
    setPlanError(e.message);
  } finally {
    setPlanLoad(false);
  }
}

  async function savePlan() {
    if (!plan || saving) return;
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer/saved`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.success) setSavedId(json.data._id);
    } catch (e) {
      console.error("savePlan", e);
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(id) {
    setRemovingId(id);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer/saved/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSavedPlans(prev => prev.filter(sv => sv._id !== id));
        if (viewingSaved?._id === id) setViewingSaved(null);
        if (savedId === id) setSavedId(null);
      }
    } catch (e) {
      console.error("removePlan", e);
    } finally {
      setRemovingId(null);
    }
  }

  if (status === "loading" || introLoad) {
    return (
      <SafeAreaView style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </SafeAreaView>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "Athlete";
  const showTabs  = !showPlan && !viewingSaved;

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={s.greeting}>Good {getGreeting()}, {firstName}</Text>
            <Text style={s.headerTitle}>AI Trainer 🤖</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity onPress={() => setShowExtra(true)} style={s.settingsBtn}>
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("profile")} style={s.avatarPlaceholder}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showTabs && (
          <View style={s.tabsRow}>
            {[["plan", "📋 Plan"], ["saved", "🔖 Saved"], ["chat", "💬 Chat"]].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setMainTab(key)}
                style={s.mainTab}
                activeOpacity={0.75}
              >
                <Text style={[s.mainTabText, mainTab === key && s.mainTabTextActive]}>{label}</Text>
                <View style={[s.mainTabLine, mainTab === key && s.mainTabLineActive]} />
                {key === "saved" && savedPlans.length > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{savedPlans.length}</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Body */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {!introLoad && mainTab !== "chat" && (
          <ProfileBanner intro={intro} extra={extra} onEditExtra={() => setShowExtra(true)} />
        )}

        {/* PLAN TAB */}
        {mainTab === "plan" && !showPlan && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, gap: 14 }}>
            <View style={s.planLanding}>
              <Text style={{ fontSize: 40, marginBottom: 10, textAlign: "center" }}>🏋️</Text>
              <Text style={s.planLandingTitle}>Your personalised plan</Text>
              <Text style={s.planLandingDesc}>
                AI builds a full weekly programme based on your profile, goals and equipment. Tap ⚙️ above to customise further.
              </Text>
              {planError && <Text style={s.errorText}>⚠️ {planError}</Text>}
              <TouchableOpacity
                onPress={() => generatePlan(false)}
                disabled={planLoad}
                style={[s.generateBtn, { opacity: planLoad ? 0.7 : 1 }]}
              >
                {planLoad ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={s.generateBtnText}>Building your plan…</Text>
                  </View>
                ) : (
                  <Text style={s.generateBtnText}>
                    {plan ? "📋 View my plan" : "✨ Generate my weekly plan"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {planLoad ? (
              <View style={{ gap: 8 }}>
                {[140, 80, 80, 80, 80].map((h, i) => <Skeleton key={i} height={h} />)}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {[
                  { emoji: "📅", title: "Full 7-day schedule",  desc: "Training days + rest days tailored to your availability" },
                  { emoji: "🏋️", title: "Exercise breakdown",   desc: "Sets, reps, rest periods and tempo for every exercise" },
                  { emoji: "📈", title: "Progression system",   desc: "How to add weight and intensity over time" },
                  { emoji: "🥗", title: "Nutrition guidelines", desc: "What to eat to support your specific goal" },
                  { emoji: "🔥", title: "Warmup & cooldown",    desc: "Built into every training day - no skipping" },
                ].map((f, i) => (
                  <View key={i} style={[s.card, { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16 }]}>
                    <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
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

        {/* PLAN VIEW */}
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

        {/* SAVED TAB */}
        {mainTab === "saved" && !viewingSaved && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, gap: 10 }}>
            {savedLoading ? (
              <View style={{ gap: 8 }}>
                {[100, 100, 100].map((h, i) => <Skeleton key={i} height={h} />)}
              </View>
            ) : savedPlans.length === 0 ? (
              <View style={[s.card, { alignItems: "center", padding: 40 }]}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🔖</Text>
                <Text style={s.emptyTitle}>No saved plans yet</Text>
                <Text style={s.emptyDesc}>Generate a plan in the Plan tab and tap 💾 Save to keep it here.</Text>
              </View>
            ) : (
              savedPlans.map(sv => (
                <SavedPlanCard
                  key={sv._id}
                  saved={sv}
                  onView={item => setViewingSaved(item)}
                  onRemove={removePlan}
                  removing={removingId === sv._id}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* SAVED PLAN VIEWER */}
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

        {/* CHAT TAB */}
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
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: "#fafaf8" },
  loadingScreen: { flex: 1, backgroundColor: "#fafaf8", alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0,
    backgroundColor: "rgba(250,250,248,0.95)",
    borderBottomWidth: 1, borderBottomColor: "rgba(232,229,222,0.5)",
  },
  greeting:          { fontSize: 12, color: "#aaa", fontWeight: "400" },
  headerTitle:       { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1, lineHeight: 26 },
  settingsBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", alignItems: "center", justifyContent: "center" },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  tabsRow:           { flexDirection: "row", gap: 4, marginTop: 4 },
  mainTab:           { flex: 1, paddingVertical: 10, alignItems: "center", position: "relative" },
  mainTabText:       { fontSize: 13, fontWeight: "700", color: "#aaa" },
  mainTabTextActive: { color: "#1a1a1a" },
  mainTabLine:       { position: "absolute", bottom: 0, left: 8, right: 8, height: 2, borderRadius: 2, backgroundColor: "transparent" },
  mainTabLineActive: { backgroundColor: "#ff6b35" },
  badge:             { position: "absolute", top: 6, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#ff6b35", alignItems: "center", justifyContent: "center" },
  badgeText:         { fontSize: 9, fontWeight: "800", color: "#fff" },
  card:              { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  label:             { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 8 },
  chip:              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: "#e8e5de", backgroundColor: "#fff" },
  chipActive:        { backgroundColor: "#1a1a1a", borderWidth: 0 },
  chipText:          { fontSize: 12, fontWeight: "600", color: "#555" },
  chipTextActive:    { color: "#fff" },
  chipWrap:          { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skeletonBase:      { backgroundColor: "#e8e5de", borderRadius: 20 },
  profileBanner:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1a1a1a", borderRadius: 20, padding: 16, marginBottom: 10 },
  profileBannerLabel:{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  profileTags:       { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  profileTag:        { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  profileTagText:    { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  editBtn:           { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText:       { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  planLanding:       { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 20, padding: 28, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  planLandingTitle:  { fontSize: 19, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 8, textAlign: "center" },
  planLandingDesc:   { fontSize: 13, color: "#aaa", lineHeight: 20, marginBottom: 24, textAlign: "center" },
  errorText:         { fontSize: 12, color: "#e53e3e", fontWeight: "600", marginBottom: 12 },
  generateBtn:       { width: "100%", padding: 16, backgroundColor: "#1a1a1a", borderRadius: 14, alignItems: "center" },
  generateBtnText:   { fontSize: 15, fontWeight: "700", color: "#fafaf8" },
  featureTitle:      { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  featureDesc:       { fontSize: 12, color: "#aaa", marginTop: 2, lineHeight: 18 },
  exerciseCard:      { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 16, overflow: "hidden" },
  exerciseRow:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  exerciseIndex:     { width: 30, height: 30, borderRadius: 9, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  exerciseIndexOpen: { backgroundColor: "#1a1a1a" },
  exerciseIndexText: { fontSize: 12, fontWeight: "800", color: "#aaa" },
  exerciseName:      { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  exerciseMuscle:    { fontSize: 10, color: "#aaa", marginTop: 1 },
  exerciseSets:      { fontSize: 13, fontWeight: "800", color: "#1a1a1a" },
  exerciseRest:      { fontSize: 10, color: "#bbb" },
  dot:               { width: 8, height: 8, borderRadius: 4 },
  exerciseDetail:    { borderTopWidth: 1, borderTopColor: "#f0ede8", padding: 12, backgroundColor: "#fafaf8" },
  tempoLabel:        { fontSize: 10, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8 },
  tempoBadge:        { backgroundColor: "rgba(255,107,53,0.08)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tempoBadgeText:    { fontSize: 11, fontWeight: "700", color: "#ff6b35" },
  exerciseNotes:     { fontSize: 12, color: "#666", lineHeight: 20 },
  dayCard:           { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  dayCardHeader:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  dayIndexBox:       { width: 44, height: 44, borderRadius: 13, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dayIndexBoxOpen:   { backgroundColor: "#1a1a1a" },
  dayIndexLabel:     { fontSize: 7, fontWeight: "800", color: "#ccc", letterSpacing: 0.6 },
  dayIndexNum:       { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  dayLabel:          { fontSize: 14, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.3 },
  dayMeta:           { fontSize: 11, color: "#aaa", marginTop: 2 },
  focusBadge:        { backgroundColor: "rgba(255,107,53,0.08)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  focusBadgeText:    { fontSize: 11, fontWeight: "700", color: "#ff6b35" },
  chevron:           { fontSize: 18, color: "#ccc" },
  chevronOpen:       { transform: [{ rotate: "90deg" }] },
  dayCardBody:       { borderTopWidth: 1, borderTopColor: "#f0ede8", padding: 12 },
  warmupBox:         { backgroundColor: "rgba(255,107,53,0.05)", borderWidth: 1, borderColor: "rgba(255,107,53,0.12)", borderRadius: 12, padding: 10, marginBottom: 10 },
  warmupLabel:       { fontSize: 10, fontWeight: "700", color: "#ff6b35", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  warmupText:        { fontSize: 12, color: "#666", lineHeight: 18 },
  cooldownBox:       { backgroundColor: "rgba(99,102,241,0.05)", borderWidth: 1, borderColor: "rgba(99,102,241,0.12)", borderRadius: 12, padding: 10 },
  cooldownLabel:     { fontSize: 10, fontWeight: "700", color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  cooldownText:      { fontSize: 12, color: "#666", lineHeight: 18 },
  restDayCard:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 16 },
  restDayIcon:       { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dayCardTitle:      { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  dayCardSub:        { fontSize: 11, color: "#bbb" },
  actionRow:         { flexDirection: "row", gap: 8 },
  actionBtn:         { flex: 1, padding: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 12, alignItems: "center" },
  actionBtnText:     { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  actionBtnSave:     { flex: 1, padding: 12, backgroundColor: "#e55a25", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionBtnSaveText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  savedBadge:        { flex: 1, padding: 12, backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1, borderColor: "rgba(34,197,94,0.25)", borderRadius: 12, alignItems: "center" },
  savedBadgeText:    { fontSize: 13, fontWeight: "700", color: "#22c55e" },
  planHeaderCard:    { backgroundColor: "#1a1a1a", borderRadius: 20, padding: 20 },
  planHeaderEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  planHeaderTitle:   { fontSize: 19, fontWeight: "800", color: "#fff", letterSpacing: -0.5, lineHeight: 24 },
  planSummary:       { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 20, marginVertical: 10 },
  weeklyVolBadge:    { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  weeklyVolText:     { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  diffBadge:         { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  diffBadgeText:     { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  tabBar:            { flexDirection: "row", backgroundColor: "#f4f2ed", borderRadius: 14, padding: 4, gap: 4 },
  tabBtn:            { flex: 1, padding: 10, borderRadius: 10, alignItems: "center", backgroundColor: "transparent" },
  tabBtnActive:      { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabBtnText:        { fontSize: 12, fontWeight: "700", color: "#aaa" },
  tabBtnTextActive:  { color: "#1a1a1a" },
  tipSectionLabel:   { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  tipRow:            { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 8 },
  tipNum:            { width: 20, height: 20, borderRadius: 6, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  tipNumText:        { fontSize: 10, fontWeight: "800", color: "#aaa" },
  tipText:           { fontSize: 13, color: "#555", lineHeight: 20, flex: 1 },
  savedPlanTitle:    { fontSize: 14, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.3, marginBottom: 3 },
  viewPlanBtn:       { flex: 1, padding: 10, backgroundColor: "#1a1a1a", borderRadius: 11, alignItems: "center" },
  viewPlanBtnText:   { fontSize: 12, fontWeight: "700", color: "#fff" },
  removeBtn:         { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderRadius: 11, alignItems: "center" },
  removeBtnText:     { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  emptyTitle:        { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  emptyDesc:         { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center" },
  msgRow:            { flexDirection: "row", alignItems: "flex-start" },
  botAvatar:         { width: 28, height: 28, borderRadius: 9, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 2 },
  bubble:            { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  bubbleUser:        { backgroundColor: "#1a1a1a", borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleBot:         { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 18, borderBottomLeftRadius: 4 },
  bubbleText:        { fontSize: 13, lineHeight: 21, color: "#1a1a1a" },
  typingDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: "#bbb" },
  quickPromptBtn:    { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14 },
  quickPromptText:   { fontSize: 13, fontWeight: "500", color: "#1a1a1a", lineHeight: 20 },
  inputBar:          { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e8e5de", paddingBottom: Platform.OS === "ios" ? 4 : 8 },
  chatInput:         { flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14, fontSize: 16, color: "#1a1a1a", backgroundColor: "#fff", maxHeight: 100, lineHeight: 22 },
  sendBtn:           { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  sendBtnActive:     { backgroundColor: "#1a1a1a" },
  sendBtnIcon:       { fontSize: 16, transform: [{ rotate: "90deg" }], color: "#bbb" },
  modalOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  bottomSheet:       { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fafaf8", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, maxHeight: "85%", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 20 },
  sheetHandle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0ddd6", alignSelf: "center", marginBottom: 16 },
  sheetTitle:        { fontSize: 18, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 20 },
  sessBtn:           { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e8e5de", backgroundColor: "#fff", alignItems: "center" },
  sessBtnActive:     { backgroundColor: "#1a1a1a", borderWidth: 0 },
  sessBtnText:       { fontSize: 12, fontWeight: "700", color: "#aaa" },
  injuryInput:       { width: "100%", paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#e8e5de", borderRadius: 12, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fff" },
  saveBtn:           { width: "100%", paddingVertical: 16, backgroundColor: "#1a1a1a", borderRadius: 14, alignItems: "center" },
  saveBtnText:       { fontSize: 14, fontWeight: "700", color: "#fafaf8" },
});