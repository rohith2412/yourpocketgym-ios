import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://yourpocketgym.com";

// ─── Types ────────────────────────────────────────────────────────────────────
type GymProfile = {
  age: string;
  weight: string;
  weightUnit: "kg" | "lbs";
  height: string;
  heightUnit: "cm" | "ft";
  goal: string;
  experience: string;
  daysPerWeek: string;
  equipment: string;
  focusAreas: string;
  sessionLength: string;
  injuries: string;
};

const EMPTY_PROFILE: GymProfile = {
  age: "", weight: "", weightUnit: "kg",
  height: "", heightUnit: "cm",
  goal: "", experience: "",
  daysPerWeek: "4", equipment: "",
  focusAreas: "", sessionLength: "45", injuries: "",
};

const GOALS      = ["Build muscle", "Lose fat", "Improve strength", "General fitness", "Endurance"];
const EXPERIENCE = ["Beginner", "Intermediate", "Advanced"];
const DAYS_OPTS  = ["3", "4", "5", "6", "7"];
const SESSION_LENGTHS = ["30", "45", "60", "75", "90"];
const EQUIPMENT_OPTIONS = [
  "Full gym", "Dumbbells only", "Barbell & rack",
  "Resistance bands", "Bodyweight only", "Kettlebells", "Home gym",
];
const FOCUS_OPTIONS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Glutes", "Core", "Full body"];
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

const PROFILE_KEY    = "@gym_profile";
const PLAN_KEY       = "@ai_workout_plan";
const DONE_KEY       = (d: string) => `@workout_done/${d}`;
const DAY_NAMES      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_ABBRS      = ["M","T","W","T","F","S","S"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return toLocalISO(d);
  });
}
function getPlanDayForDate(plan: any, date: string) {
  if (!plan?.days) return null;
  const dow = new Date(date + "T12:00:00").getDay(); // 0=Sun
  const name = DAY_NAMES[dow === 0 ? 6 : dow - 1];
  return plan.days.find((d: any) => d.day?.toLowerCase() === name.toLowerCase()) ?? null;
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
function muscleColor(mg = "") {
  const map: Record<string,string> = {
    chest:"#7c3aed", back:"#6366f1", shoulders:"#f59e0b",
    arms:"#ec4899", legs:"#22c55e", core:"#14b8a6",
    glutes:"#8b5cf6", cardio:"#ef4444",
  };
  return map[(mg||"").toLowerCase().split(/[\s,&]/)[0]] || "#aaa";
}
function difficultyColor(d = "") {
  return ({ Beginner:"#22c55e", Intermediate:"#f59e0b", Advanced:"#ef4444" } as any)[d] || "#aaa";
}
function difficultyBg(d = "") {
  return ({ Beginner:"rgba(34,197,94,0.1)", Intermediate:"rgba(245,158,11,0.1)", Advanced:"rgba(239,68,68,0.1)" } as any)[d] || "rgba(0,0,0,0.06)";
}

// ─── Auth Hook ────────────────────────────────────────────────────────────────
function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady]     = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId]   = useState("");
  useEffect(() => {
    AsyncStorage.multiGet(["token","user"]).then(([[,t],[,raw]]) => {
      if (t && raw) try {
        const u = JSON.parse(raw);
        setSession({ user: { ...u, token: t } });
        setUserName(u.name?.split(" ")[0] ?? "");
        setUserId(u.sub || u.uid || u.id || u._id || "");
      } catch {}
      setReady(true);
    });
  }, []);
  return { session, ready, userName, userId };
}

// ─── Profile Hook ─────────────────────────────────────────────────────────────
function useGymProfile(userId: string) {
  const [profile, setProfileState] = useState<GymProfile | null>(null);
  const [loaded, setLoaded]        = useState(false);

  const profileKey = userId ? `${PROFILE_KEY}/${userId}` : null;

  useEffect(() => {
    if (!profileKey) return;
    setLoaded(false);
    setProfileState(null);
    AsyncStorage.getItem(profileKey).then((raw) => {
      if (raw) try { setProfileState(JSON.parse(raw)); } catch {}
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [profileKey]);

  async function saveProfile(p: GymProfile) {
    if (!profileKey) return;
    setProfileState(p);
    await AsyncStorage.setItem(profileKey, JSON.stringify(p)).catch(() => {});
  }

  async function clearProfile() {
    if (!profileKey) return;
    setProfileState(null);
    await AsyncStorage.removeItem(profileKey).catch(() => {});
  }

  return { profile, loaded, saveProfile, clearProfile };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ height = 80, radius = 16 }) {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ height, borderRadius: radius, backgroundColor: "#ece9e3", opacity: anim, marginBottom: 8 }} />;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={[p.chip, active && p.chipActive]}>
      <Text style={[p.chipText, active && p.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─── Profile Intro (step-by-step wizard) ─────────────────────────────────────
const TOTAL_STEPS = 8;
const STEP_PROGRESS = [12, 25, 37, 50, 62, 75, 87, 100];

const GOAL_OPTIONS = [
  { val: "Build muscle",      sub: "Build mass and size"         },
  { val: "Lose fat",          sub: "Burn calories, slim down"    },
  { val: "Improve strength",  sub: "Lift heavier, get stronger"  },
  { val: "General fitness",   sub: "Stay active and healthy"     },
  { val: "Endurance",         sub: "Cardio and stamina"          },
];
const EXP_OPTIONS = [
  { val: "Beginner",     sub: "Under 1 year"  },
  { val: "Intermediate", sub: "1–3 years"     },
  { val: "Advanced",     sub: "3+ years"      },
];
const EQUIP_OPTIONS = [
  { val: "Full gym",         sub: "All machines & free weights" },
  { val: "Dumbbells only",   sub: "Dumbbells at home or gym"    },
  { val: "Barbell & rack",   sub: "Squat rack + barbell"        },
  { val: "Bodyweight only",  sub: "No equipment needed"         },
  { val: "Resistance bands", sub: "Bands and bodyweight"        },
  { val: "Home gym",         sub: "Mixed home setup"            },
];

function ProfileIntro({ visible, initial, onSave, onClose, isEdit = false }: any) {
  const [step, setStep]   = useState(1);
  const [local, setLocal] = useState<GymProfile>({ ...EMPTY_PROFILE, ...initial });

  useEffect(() => {
    if (visible) { setStep(1); setLocal({ ...EMPTY_PROFILE, ...initial }); }
  }, [visible, initial]);

  const set = (key: keyof GymProfile, val: any) => setLocal(prev => ({ ...prev, [key]: val }));
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => { if (step === 1 && isEdit) onClose?.(); else setStep(s => Math.max(s - 1, 1)); };

  const toggleFocus = (val: string) => {
    const arr = local.focusAreas.split(",").map(s => s.trim()).filter(Boolean);
    const upd = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    set("focusAreas", upd.join(", "));
  };
  const hasFocus = (val: string) => local.focusAreas.split(",").map(s => s.trim()).includes(val);

  const DAY_LABELS = ["M","T","W","T","F","S","S"];
  const [selDays, setSelDays] = useState<number[]>([]);
  const toggleDay = (i: number) => {
    const upd = selDays.includes(i) ? selDays.filter(d => d !== i) : [...selDays, i];
    setSelDays(upd);
    set("daysPerWeek", String(upd.length));
  };

  function finish() {
    onSave({ ...local, daysPerWeek: local.daysPerWeek || String(selDays.length) });
    onClose?.();
  }

  if (!visible) return null;

  const progressWidth = `${STEP_PROGRESS[step - 1]}%`;

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={isEdit ? onClose : undefined}>
      <StatusBar barStyle="dark-content" />
      <View style={pi.root}>
        <LinearGradient
          colors={["rgba(232,56,13,0.45)","rgba(232,56,13,0.18)","rgba(232,56,13,0.05)","transparent"]}
          start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.5 }}
          style={pi.glow} pointerEvents="none"
        />
        <ScrollView contentContainerStyle={pi.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={pi.card}>
            {/* Progress bar */}
            <View style={pi.progressTrack}>
              <View style={[pi.progressFill, { width: progressWidth }]} />
            </View>

            {/* Step 1 — Goal */}
            {step === 1 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 1 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>What's your main goal?</Text>
                <View style={pi.optionGrid}>
                  {GOAL_OPTIONS.map(o => (
                    <Pressable key={o.val} onPress={() => set("goal", o.val)} style={[pi.optionBtn, local.goal === o.val && pi.optionSelected]}>
                      <Text style={[pi.optionLabel, local.goal === o.val && pi.optionLabelSel]}>{o.val}</Text>
                      <Text style={pi.optionSub}>{o.sub}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  {isEdit
                    ? <Pressable onPress={onClose} style={pi.btnBack}><Text style={pi.btnBackText}>Cancel</Text></Pressable>
                    : <View />}
                  <Pressable onPress={next} disabled={!local.goal} style={[pi.btnNext, !local.goal && pi.btnDisabled]}>
                    <Text style={pi.btnNextText}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 2 — Experience */}
            {step === 2 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 2 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>What's your experience level?</Text>
                <View style={pi.optionGrid}>
                  {EXP_OPTIONS.map(o => (
                    <Pressable key={o.val} onPress={() => set("experience", o.val)} style={[pi.optionBtn, local.experience === o.val && pi.optionSelected]}>
                      <Text style={[pi.optionLabel, local.experience === o.val && pi.optionLabelSel]}>{o.val}</Text>
                      <Text style={pi.optionSub}>{o.sub}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} disabled={!local.experience} style={[pi.btnNext, !local.experience && pi.btnDisabled]}>
                    <Text style={pi.btnNextText}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 3 — Age */}
            {step === 3 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 3 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>How old are you?</Text>
                <View style={pi.numRow}>
                  <View>
                    <Text style={pi.bigNum}>{local.age || "25"}</Text>
                    <Text style={pi.numUnit}>years old</Text>
                  </View>
                  <View style={pi.stepperCol}>
                    <Pressable onPress={() => set("age", String(Math.min(80, Number(local.age || 25) + 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>+</Text></Pressable>
                    <Pressable onPress={() => set("age", String(Math.max(13, Number(local.age || 25) - 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>−</Text></Pressable>
                  </View>
                </View>
                <View style={pi.presetsRow}>
                  {[18,22,25,30,35,40,45,50].map(a => (
                    <Pressable key={a} onPress={() => set("age", String(a))} style={[pi.presetBtn, local.age === String(a) && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, local.age === String(a) && pi.presetBtnTextActive]}>{a}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} style={pi.btnNext}><Text style={pi.btnNextText}>Continue</Text></Pressable>
                </View>
              </View>
            )}

            {/* Step 4 — Weight */}
            {step === 4 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 4 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>What's your current weight?</Text>
                <View style={pi.numRow}>
                  <View>
                    <Text style={pi.bigNum}>{local.weight || "75"}</Text>
                    <Text style={pi.numUnit}>{local.weightUnit}</Text>
                  </View>
                  <View style={pi.stepperCol}>
                    <Pressable onPress={() => set("weight", String(Math.min(300, Number(local.weight || 75) + 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>+</Text></Pressable>
                    <Pressable onPress={() => set("weight", String(Math.max(30, Number(local.weight || 75) - 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>−</Text></Pressable>
                  </View>
                </View>
                <View style={pi.presetsRow}>
                  {["kg","lbs"].map(u => (
                    <Pressable key={u} onPress={() => set("weightUnit", u)} style={[pi.presetBtn, local.weightUnit === u && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, local.weightUnit === u && pi.presetBtnTextActive]}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.presetsRow}>
                  {(local.weightUnit === "kg" ? [50,60,70,80,90,100,110] : [110,130,150,170,190,220]).map(w => (
                    <Pressable key={w} onPress={() => set("weight", String(w))} style={[pi.presetBtn, local.weight === String(w) && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, local.weight === String(w) && pi.presetBtnTextActive]}>{w}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} style={pi.btnNext}><Text style={pi.btnNextText}>Continue</Text></Pressable>
                </View>
              </View>
            )}

            {/* Step 5 — Height */}
            {step === 5 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 5 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>How tall are you?</Text>
                <View style={pi.numRow}>
                  <View>
                    <Text style={pi.bigNum}>{local.height || "175"}</Text>
                    <Text style={pi.numUnit}>{local.heightUnit}</Text>
                  </View>
                  <View style={pi.stepperCol}>
                    <Pressable onPress={() => set("height", String(Math.min(250, Number(local.height || 175) + 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>+</Text></Pressable>
                    <Pressable onPress={() => set("height", String(Math.max(100, Number(local.height || 175) - 1)))} style={pi.stepperBtn}><Text style={pi.stepperBtnText}>−</Text></Pressable>
                  </View>
                </View>
                <View style={pi.presetsRow}>
                  {["cm","ft"].map(u => (
                    <Pressable key={u} onPress={() => set("heightUnit", u)} style={[pi.presetBtn, local.heightUnit === u && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, local.heightUnit === u && pi.presetBtnTextActive]}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.presetsRow}>
                  {(local.heightUnit === "cm" ? [155,160,165,170,175,180,185,190] : [55,57,510,511,60,62,64]).map(h => (
                    <Pressable key={h} onPress={() => set("height", String(h))} style={[pi.presetBtn, local.height === String(h) && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, local.height === String(h) && pi.presetBtnTextActive]}>{h}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} style={pi.btnNext}><Text style={pi.btnNextText}>Continue</Text></Pressable>
                </View>
              </View>
            )}

            {/* Step 6 — Equipment */}
            {step === 6 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 6 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>What equipment do you have?</Text>
                <View style={pi.optionGrid}>
                  {EQUIP_OPTIONS.map(o => (
                    <Pressable key={o.val} onPress={() => set("equipment", o.val)} style={[pi.optionBtn, local.equipment === o.val && pi.optionSelected]}>
                      <Text style={[pi.optionLabel, local.equipment === o.val && pi.optionLabelSel]}>{o.val}</Text>
                      <Text style={pi.optionSub}>{o.sub}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} disabled={!local.equipment} style={[pi.btnNext, !local.equipment && pi.btnDisabled]}>
                    <Text style={pi.btnNextText}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 7 — Training days */}
            {step === 7 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 7 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>How many days per week can you train?</Text>
                <View style={pi.daysGrid}>
                  {DAY_LABELS.map((d, i) => (
                    <Pressable key={i} onPress={() => toggleDay(i)} style={[pi.dayBtn, selDays.includes(i) && pi.daySelected]}>
                      <Text style={[pi.dayBtnText, selDays.includes(i) && pi.dayBtnTextSel]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={pi.daysHint}>
                  {selDays.length > 0 ? `${selDays.length} day${selDays.length > 1 ? "s" : ""} selected` : "Tap to select your training days"}
                </Text>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={next} disabled={selDays.length === 0} style={[pi.btnNext, selDays.length === 0 && pi.btnDisabled]}>
                    <Text style={pi.btnNextText}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 8 — Session length + focus (last step) */}
            {step === 8 && (
              <View style={pi.stepWrap}>
                <Text style={pi.stepLabel}>Step 8 of {TOTAL_STEPS}</Text>
                <Text style={pi.question}>How long are your sessions?</Text>
                <View style={pi.optionGrid}>
                  {SESSION_LENGTHS.map(l => (
                    <Pressable key={l} onPress={() => set("sessionLength", l)} style={[pi.optionBtn, local.sessionLength === l && pi.optionSelected]}>
                      <Text style={[pi.optionLabel, local.sessionLength === l && pi.optionLabelSel]}>{l} min</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[pi.stepLabel, { marginBottom: 10 }]}>Focus areas (optional)</Text>
                <View style={pi.presetsRow}>
                  {FOCUS_OPTIONS.map(f => (
                    <Pressable key={f} onPress={() => toggleFocus(f)} style={[pi.presetBtn, hasFocus(f) && pi.presetBtnActive]}>
                      <Text style={[pi.presetBtnText, hasFocus(f) && pi.presetBtnTextActive]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={pi.navRow}>
                  <Pressable onPress={back} style={pi.btnBack}><Text style={pi.btnBackText}>Back</Text></Pressable>
                  <Pressable onPress={finish} style={pi.btnNext}>
                    <Text style={pi.btnNextText}>Let's go →</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({ profile, onEdit }: { profile: GymProfile; onEdit: () => void }) {
  const tags = [
    profile.age && `${profile.age} yrs`,
    profile.weight && `${profile.weight} ${profile.weightUnit}`,
    profile.height && `${profile.height} ${profile.heightUnit}`,
  ].filter(Boolean);

  const planTags = [
    profile.equipment,
    profile.daysPerWeek && `${profile.daysPerWeek} days/wk`,
    profile.sessionLength && `${profile.sessionLength} min`,
  ].filter(Boolean);

  const focusTags = profile.focusAreas.split(",").map(s => s.trim()).filter(Boolean);

  return (
    <View style={pc.card}>
      <View style={pc.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={pc.eyebrow}>YOUR PROFILE</Text>
          <Text style={pc.goal}>{profile.goal || "No goal set"}</Text>
          <View style={pc.expBadge}>
            <Text style={pc.expText}>{profile.experience}</Text>
          </View>
        </View>
        <Pressable onPress={onEdit} style={pc.editBtn}>
          <Text style={pc.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      {tags.length > 0 && (
        <View style={pc.tagRow}>
          {tags.map((t, i) => (
            <View key={i} style={pc.tag}><Text style={pc.tagText}>{t}</Text></View>
          ))}
        </View>
      )}

      <View style={[pc.tagRow, { marginTop: 6 }]}>
        {planTags.map((t, i) => (
          <View key={i} style={[pc.tag, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <Text style={pc.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      {focusTags.length > 0 && (
        <View style={[pc.tagRow, { marginTop: 6 }]}>
          <Text style={pc.focusLabel}>Focus: </Text>
          <Text style={pc.focusText}>{focusTags.join(" · ")}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Week Calendar ────────────────────────────────────────────────────────────
function WeekCalendar({ selDate, onSelect, completions, planDays }: any) {
  const dates   = getWeekDates();
  const todayISO = toLocalISO();

  return (
    <View style={wc.card}>
      <View style={wc.row}>
        {dates.map((date, i) => {
          const isSel    = date === selDate;
          const isToday  = date === todayISO;
          const done     = completions[date];
          const planDay  = planDays?.find((d: any) => d.day?.toLowerCase() === DAY_NAMES[i]?.toLowerCase());
          const hasWork  = planDay && !planDay.restDay;
          const isRest   = planDay?.restDay;

          let dotColor = "#e0ddd6";
          if (hasWork)  dotColor = done ? "#22c55e" : "#e8380d";
          else if (isRest) dotColor = "#e0ddd6";

          return (
            <Pressable key={date} onPress={() => onSelect(date)} style={wc.dayCol}>
              <View style={[wc.bubble, isSel && wc.bubbleSel, isToday && !isSel && wc.bubbleToday]}>
                <Text style={[wc.abbr, isSel && wc.abbrSel, isToday && !isSel && wc.abbrToday]}>
                  {DAY_ABBRS[i]}
                </Text>
              </View>
              <View style={[wc.dot, { backgroundColor: dotColor }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, index }: any) {
  const [open, setOpen] = useState(false);
  const color = muscleColor(ex.muscleGroup);
  return (
    <Pressable onPress={() => setOpen(o => !o)} style={s.exerciseCard}>
      <View style={s.exerciseRow}>
        <View style={[s.exNum, open && s.exNumOpen]}>
          <Text style={[s.exNumText, open && { color: "#fff" }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
          <Text style={s.exMuscle}>{ex.muscleGroup}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.exSets}>{ex.sets} × {ex.reps}</Text>
          <Text style={s.exRest}>rest {ex.rest}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: color }]} />
      </View>
      {open && (
        <View style={s.exDetail}>
          {ex.tempo && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "center" }}>
              <Text style={s.tempoLabel}>Tempo</Text>
              <View style={s.tempoBadge}><Text style={s.tempoBadgeText}>{ex.tempo}</Text></View>
            </View>
          )}
          {ex.notes && <Text style={s.exNotes}>{ex.notes}</Text>}
        </View>
      )}
    </Pressable>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen);

  if (day.restDay) {
    return (
      <View style={[s.card, { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }]}>
        <Text style={{ fontSize: 28 }}>🛌</Text>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>Rest Day</Text>
          <Text style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>Recovery is part of the programme.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.dayCard}>
      <Pressable onPress={() => setOpen(o => !o)} style={s.dayCardHeader}>
        <View style={[s.dayBox, open && s.dayBoxOpen]}>
          <Text style={[s.dayBoxLabel, open && { color: "rgba(255,255,255,0.5)" }]}>
            {day.day?.slice(0, 3).toUpperCase()}
          </Text>
          <Text style={[s.dayBoxNum, open && { color: "#fff" }]}>{day.exercises?.length ?? 0}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.dayLabel}>{day.label}</Text>
          <Text style={s.dayMeta}>{day.exercises?.length} exercises · {day.estimatedTime}min</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={s.focusBadge}><Text style={s.focusBadgeText}>{day.focus}</Text></View>
          <Text style={[s.chevron, open && { transform: [{ rotate: "90deg" }] }]}>›</Text>
        </View>
      </Pressable>
      {open && (
        <View style={s.dayBody}>
          {day.warmup && (
            <View style={s.warmupBox}>
              <Text style={s.warmupLabel}>Warmup</Text>
              <Text style={s.warmupText}>{day.warmup}</Text>
            </View>
          )}
          <View style={{ gap: 6, marginBottom: 10 }}>
            {day.exercises?.map((ex: any, i: number) => (
              <ExerciseCard key={i} ex={ex} index={i} />
            ))}
          </View>
          {day.cooldown && (
            <View style={s.cooldownBox}>
              <Text style={s.cooldownLabel}>Cooldown</Text>
              <Text style={s.cooldownText}>{day.cooldown}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Plan Header Card ─────────────────────────────────────────────────────────
function PlanHeaderCard({ plan, onViewFull, onRegen, isLoading }: any) {
  return (
    <View style={s.planHeader}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={s.planEyebrow}>CURRENT PLAN</Text>
          <Text style={s.planTitle}>{plan.planTitle}</Text>
        </View>
        <View style={[s.diffBadge, { backgroundColor: difficultyBg(plan.difficulty) }]}>
          <Text style={[s.diffBadgeText, { color: difficultyColor(plan.difficulty) }]}>{plan.difficulty}</Text>
        </View>
      </View>
      <Text style={s.planSummary} numberOfLines={2}>{plan.planSummary}</Text>
      <View style={s.volBadge}>
        <Text style={s.volBadgeText}>{plan.weeklyVolume}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <Pressable onPress={onViewFull} style={s.planActionBtn}>
          <Text style={s.planActionBtnText}>Full plan</Text>
        </Pressable>
        <Pressable onPress={onRegen} disabled={isLoading} style={[s.planActionBtn, { opacity: isLoading ? 0.5 : 1 }]}>
          {isLoading
            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            : <Text style={s.planActionBtnText}>Regenerate</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Full Plan View ───────────────────────────────────────────────────────────
function PlanView({ plan, onBack, onRegen, onSave, isSaved, saving, isLoading }: any) {
  const [tab, setTab] = useState("schedule");
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <View style={s.actionRow}>
        <Pressable onPress={onBack} style={s.actionBtn}>
          <Text style={s.actionBtnText}>← Back</Text>
        </Pressable>
        <Pressable onPress={onRegen} disabled={isLoading} style={[s.actionBtn, { opacity: isLoading ? 0.4 : 1 }]}>
          <Text style={s.actionBtnText}>{isLoading ? "Generating…" : "Regenerate"}</Text>
        </Pressable>
        {!isSaved ? (
          <Pressable onPress={onSave} disabled={saving} style={[s.actionBtnPrimary, { opacity: saving ? 0.6 : 1 }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.actionBtnPrimaryText}>Save plan</Text>}
          </Pressable>
        ) : (
          <View style={s.savedBadge}><Text style={s.savedBadgeText}>Saved ✓</Text></View>
        )}
      </View>

      <View style={s.planHeader}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.planEyebrow}>YOUR PLAN</Text>
            <Text style={s.planTitle}>{plan.planTitle}</Text>
          </View>
          <View style={[s.diffBadge, { backgroundColor: difficultyBg(plan.difficulty) }]}>
            <Text style={[s.diffBadgeText, { color: difficultyColor(plan.difficulty) }]}>{plan.difficulty}</Text>
          </View>
        </View>
        <Text style={s.planSummary}>{plan.planSummary}</Text>
        <View style={s.volBadge}><Text style={s.volBadgeText}>{plan.weeklyVolume}</Text></View>
      </View>

      <View style={s.segControl}>
        {[["schedule","Schedule"],["tips","Tips & Nutrition"]].map(([k,l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.segBtn, tab===k && s.segBtnActive]}>
            <Text style={[s.segBtnText, tab===k && s.segBtnTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "schedule" && (
        <View style={{ gap: 8 }}>
          {plan.days?.map((day: any, i: number) => <DayCard key={i} day={day} />)}
        </View>
      )}

      {tab === "tips" && (
        <View style={{ gap: 10 }}>
          {plan.weeklyGoals?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Weekly goals</Text>
              {plan.weeklyGoals.map((g: string, i: number) => (
                <View key={i} style={s.tipRow}>
                  <View style={s.tipNum}><Text style={s.tipNumText}>{i+1}</Text></View>
                  <Text style={s.tipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.nutritionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Nutrition</Text>
              {plan.nutritionTips.map((t: string, i: number) => (
                <View key={i} style={s.tipRow}>
                  <View style={[s.tipNum, { backgroundColor: "rgba(34,197,94,0.1)" }]}><Text style={[s.tipNumText, { color: "#22c55e" }]}>{i+1}</Text></View>
                  <Text style={s.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          {plan.progressionTips?.length > 0 && (
            <View style={s.card}>
              <Text style={s.tipSectionTitle}>Progression</Text>
              {plan.progressionTips.map((t: string, i: number) => (
                <View key={i} style={s.tipRow}>
                  <View style={[s.tipNum, { backgroundColor: "rgba(99,102,241,0.1)" }]}><Text style={[s.tipNumText, { color: "#6366f1" }]}>{i+1}</Text></View>
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

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({ profile, token }: any) {
  const intro = profile ? `Goal: ${profile.goal}, ${profile.experience}, ${profile.equipment}` : null;
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: intro
      ? `Good ${getGreeting()}. I can see you're training for ${profile.goal}. What do you want to work on?`
      : "Good. Ask me anything about training, nutrition or recovery.",
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);
  const scrollRef           = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoad(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "chat", messages: next, extra: { profile } }),
      });
      const json = await res.json();
      if (json.success) setMessages(p => [...p, { role: "assistant", content: json.data.reply }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error. Try again." }]);
    } finally { setLoad(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={110}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
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
          <View key={i} style={[s.msgRow, m.role === "user" && { justifyContent: "flex-end" }]}>
            {m.role === "assistant" && <View style={s.botDot} />}
            <View style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleBot]}>
              <Text style={[s.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.content}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={s.msgRow}>
            <View style={s.botDot} />
            <View style={[s.bubbleBot, { paddingHorizontal: 16, paddingVertical: 14 }]}>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {[0,1,2].map(i => <View key={i} style={s.typingDot} />)}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={s.inputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask anything…" placeholderTextColor="#bbb" multiline style={s.chatInput} returnKeyType="send" blurOnSubmit onSubmitEditing={() => send()} />
        <Pressable onPress={() => send()} disabled={!input.trim() || loading} style={[s.sendBtn, input.trim() && !loading && s.sendBtnActive]}>
          <Text style={[s.sendBtnIcon, input.trim() && !loading && { color: "#fff" }]}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AITrainerScreen() {
  const router = useRouter();
  const { session, ready, userName, userId } = useAuth();
  const { profile, loaded: profileLoaded, saveProfile } = useGymProfile(userId);

  const planKey  = userId ? `${PLAN_KEY}/${userId}` : null;
  const doneKey  = (d: string) => userId ? `${DONE_KEY(d)}/${userId}` : null;

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [mainTab,   setMainTab]   = useState("plan");
  const [plan,      setPlan]      = useState<any>(null);
  const [planLoad,  setPlanLoad]  = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showPlan,  setShowPlan]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [savedId,   setSavedId]   = useState<string | null>(null);
  const [selDate,   setSelDate]   = useState(toLocalISO());
  const [completions, setCompletions] = useState<Record<string, boolean>>({});

  const token = session?.user?.token || "";

  // Always land on calendar tracker when tapping tab
  useFocusEffect(useCallback(() => {
    setShowPlan(false);
  }, []));

  // Auth guard
  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready]);

  // Load cached plan — re-run when userId changes (account switch)
  useEffect(() => {
    if (!planKey) { setPlan(null); return; }
    AsyncStorage.getItem(planKey).then(raw => {
      if (raw) try { setPlan(JSON.parse(raw)); } catch { setPlan(null); }
      else setPlan(null);
    }).catch(() => setPlan(null));
  }, [planKey]);

  // Load weekly completions — re-run when userId changes
  useEffect(() => {
    if (!userId) { setCompletions({}); return; }
    const dates = getWeekDates();
    AsyncStorage.multiGet(dates.map(d => `${DONE_KEY(d)}/${userId}`)).then(pairs => {
      const map: Record<string, boolean> = {};
      pairs.forEach(([k, v]) => {
        if (v) {
          const date = k.replace(`@workout_done/`, "").replace(`/${userId}`, "");
          map[date] = true;
        }
      });
      setCompletions(map);
    }).catch(() => setCompletions({}));
  }, [userId]);

  async function generatePlan() {
    if (!session || !profile) return;
    setPlanLoad(true);
    setPlanError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "plan",
          extra: {
            equipment: profile.equipment,
            focusAreas: profile.focusAreas,
            sessionLength: profile.sessionLength,
            injuries: profile.injuries,
            goal: profile.goal,
            experience: profile.experience,
            daysPerWeek: profile.daysPerWeek,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setPlan(json.data);
      if (planKey) await AsyncStorage.setItem(planKey, JSON.stringify(json.data)).catch(() => {});
    } catch (e: any) {
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
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.success) setSavedId(json.data._id);
    } catch {} finally { setSaving(false); }
  }

  async function toggleComplete(date: string) {
    const key    = doneKey(date);
    const isDone = completions[date];
    if (!key) return;
    if (isDone) {
      await AsyncStorage.removeItem(key).catch(() => {});
      setCompletions(p => { const n = { ...p }; delete n[date]; return n; });
    } else {
      await AsyncStorage.setItem(key, "1").catch(() => {});
      setCompletions(p => ({ ...p, [date]: true }));
    }
  }

  if (!ready || (userId && !profileLoaded)) return null;
  if (ready && !session) return null;

  const firstName  = userName || session?.user?.name?.split(" ")[0] || "Athlete";
  const planDay    = plan ? getPlanDayForDate(plan, selDate) : null;
  const isToday    = selDate === toLocalISO();
  const isDone     = completions[selDate];

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Good {getGreeting()}, {firstName}</Text>
            <Text style={s.headerTitle}>AI Trainer</Text>
          </View>
          <AvatarButton />
        </View>
        <View style={s.tabRow}>
          {[["plan","Plan"],["chat","Chat"]].map(([key, label]) => (
            <Pressable key={key} onPress={() => setMainTab(key)} style={s.tabItem}>
              <Text style={[s.tabText, mainTab===key && s.tabTextActive]}>{label}</Text>
              <View style={[s.tabLine, mainTab===key && s.tabLineActive]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Body */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* ── PLAN TAB ── */}
        {mainTab === "plan" && !showPlan && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 12 }}>

            {/* Profile card or setup CTA */}
            {profile ? (
              <ProfileCard profile={profile} onEdit={() => setShowProfileEdit(true)} />
            ) : (
              <Pressable onPress={() => setShowProfileEdit(true)} style={s.setupCard}>
                <Text style={s.setupTitle}>Set up your gym profile</Text>
                <Text style={s.setupDesc}>Tell us your goal, experience and equipment to get a personalised plan.</Text>
                <View style={s.setupBtn}><Text style={s.setupBtnText}>Get started →</Text></View>
              </Pressable>
            )}

            {/* Week calendar - only if we have a plan */}
            {plan && (
              <WeekCalendar
                selDate={selDate}
                onSelect={setSelDate}
                completions={completions}
                planDays={plan.days}
              />
            )}

            {/* Plan header card */}
            {plan && !planLoad && (
              <PlanHeaderCard
                plan={plan}
                onViewFull={() => setShowPlan(true)}
                onRegen={generatePlan}
                isLoading={planLoad}
              />
            )}

            {/* Error */}
            {planError && (
              <View style={s.errorBox}><Text style={s.errorText}>{planError}</Text></View>
            )}

            {/* Generating skeleton */}
            {planLoad && (
              <View style={{ gap: 8 }}>
                <Skeleton height={100} /><Skeleton height={72} /><Skeleton height={72} />
              </View>
            )}

            {/* Selected day workout */}
            {plan && !planLoad && (
              <View style={{ gap: 10 }}>
                <Text style={s.sectionLabel}>
                  {isToday ? "Today's workout" : new Date(selDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                </Text>
                {planDay ? (
                  <>
                    <DayCard day={planDay} defaultOpen={!planDay.restDay} />
                    {isToday && !planDay.restDay && (
                      <Pressable
                        onPress={() => toggleComplete(selDate)}
                        style={[s.completeBtn, isDone && s.completeBtnDone]}
                      >
                        <Text style={s.completeBtnText}>{isDone ? "✓ Workout completed" : "Mark as complete"}</Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <View style={[s.card, { alignItems: "center", padding: 24 }]}>
                    <Text style={s.emptyTitle}>No workout for this day</Text>
                  </View>
                )}
              </View>
            )}

            {/* Generate plan CTA */}
            {!plan && profile && !planLoad && (
              <Pressable onPress={generatePlan} disabled={planLoad} style={s.generateBtn}>
                <Text style={s.generateBtnText}>Generate my workout plan</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {/* Full plan view */}
        {mainTab === "plan" && showPlan && plan && (
          <PlanView
            plan={plan}
            onBack={() => setShowPlan(false)}
            onRegen={generatePlan}
            onSave={savePlan}
            isSaved={!!savedId}
            saving={saving}
            isLoading={planLoad}
          />
        )}

        {/* ── CHAT TAB ── */}
        {mainTab === "chat" && (
          <ChatView profile={profile} token={token} />
        )}
      </View>

      {/* Profile setup / edit wizard */}
      <ProfileIntro
        visible={showProfileEdit || (profileLoaded && !profile && mainTab === "plan")}
        initial={profile || EMPTY_PROFILE}
        isEdit={!!profile}
        onSave={saveProfile}
        onClose={() => setShowProfileEdit(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: "#fafaf8" },
  header:      { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: "rgba(232,229,222,0.6)" },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  greeting:    { fontSize: 12, color: "#323131", fontWeight: "400", marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 },
  tabRow:      { flexDirection: "row" },
  tabItem:     { flex: 1, paddingVertical: 10, alignItems: "center", position: "relative" },
  tabText:     { fontSize: 14, fontWeight: "600", color: "#bbb" },
  tabTextActive: { color: "#1a1a1a", fontWeight: "700" },
  tabLine:     { position: "absolute", bottom: 0, left: 12, right: 12, height: 2, borderRadius: 2, backgroundColor: "transparent" },
  tabLineActive: { backgroundColor: "#1a1a1a" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa" },
  setupCard:   { backgroundColor: "#1a1a1a", borderRadius: 22, padding: 24, alignItems: "center" },
  setupTitle:  { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 8, textAlign: "center" },
  setupDesc:   { fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 22, marginBottom: 20, textAlign: "center" },
  setupBtn:    { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  setupBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  generateBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  completeBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  completeBtnDone: { backgroundColor: "#22c55e" },
  completeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  errorBox:    { backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  errorText:   { fontSize: 13, color: "#ef4444", fontWeight: "600" },
  card:        { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#e8e5de", padding: 18 },
  emptyTitle:  { fontSize: 15, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  // Plan
  planHeader:   { backgroundColor: "#1a1a1a", borderRadius: 20, padding: 20 },
  planEyebrow:  { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  planTitle:    { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.5, lineHeight: 26 },
  planSummary:  { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 20, marginVertical: 8 },
  volBadge:     { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  volBadgeText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  diffBadge:    { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  diffBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  planActionBtn: { flex: 1, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, alignItems: "center" },
  planActionBtnText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  actionRow:    { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn:    { flex: 1, paddingVertical: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 12, alignItems: "center" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  actionBtnPrimary: { flex: 1, paddingVertical: 12, backgroundColor: "#1a1a1a", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  savedBadge:   { flex: 1, paddingVertical: 12, backgroundColor: "rgba(34,197,94,0.08)", borderWidth: 1, borderColor: "rgba(34,197,94,0.2)", borderRadius: 12, alignItems: "center" },
  savedBadgeText: { fontSize: 13, fontWeight: "700", color: "#22c55e" },
  segControl:   { flexDirection: "row", backgroundColor: "#f0ede8", borderRadius: 12, padding: 4, gap: 4 },
  segBtn:       { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  segBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  segBtnText:   { fontSize: 13, fontWeight: "600", color: "#aaa" },
  segBtnTextActive: { color: "#1a1a1a", fontWeight: "700" },
  // Day card
  dayCard:      { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#e8e5de", overflow: "hidden" },
  dayCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  dayBox:       { width: 46, height: 46, borderRadius: 13, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dayBoxOpen:   { backgroundColor: "#1a1a1a" },
  dayBoxLabel:  { fontSize: 8, fontWeight: "800", color: "#bbb", letterSpacing: 0.5 },
  dayBoxNum:    { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  dayLabel:     { fontSize: 15, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.3 },
  dayMeta:      { fontSize: 12, color: "#aaa", marginTop: 2 },
  focusBadge:   { backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  focusBadgeText: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },
  chevron:      { fontSize: 20, color: "#ccc" },
  dayBody:      { borderTopWidth: 1, borderTopColor: "#f0ede8", padding: 14 },
  warmupBox:    { backgroundColor: "#fafaf8", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ece9e3" },
  warmupLabel:  { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed", marginBottom: 4 },
  warmupText:   { fontSize: 13, color: "#666", lineHeight: 19 },
  cooldownBox:  { backgroundColor: "#fafaf8", borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1, borderColor: "#ece9e3" },
  cooldownLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: "#6366f1", marginBottom: 4 },
  cooldownText: { fontSize: 13, color: "#666", lineHeight: 19 },
  // Exercise card
  exerciseCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14, overflow: "hidden" },
  exerciseRow:  { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  exNum:        { width: 32, height: 32, borderRadius: 9, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  exNumOpen:    { backgroundColor: "#1a1a1a" },
  exNumText:    { fontSize: 13, fontWeight: "800", color: "#aaa" },
  exName:       { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  exMuscle:     { fontSize: 11, color: "#aaa", marginTop: 1 },
  exSets:       { fontSize: 13, fontWeight: "800", color: "#1a1a1a" },
  exRest:       { fontSize: 11, color: "#bbb" },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  exDetail:     { borderTopWidth: 1, borderTopColor: "#f4f2ed", padding: 12, backgroundColor: "#fafaf8" },
  tempoLabel:   { fontSize: 10, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8 },
  tempoBadge:   { backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tempoBadgeText: { fontSize: 12, fontWeight: "700", color: "#7c3aed" },
  exNotes:      { fontSize: 13, color: "#666", lineHeight: 20 },
  // Tips
  tipSectionTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  tipRow:       { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  tipNum:       { width: 22, height: 22, borderRadius: 6, backgroundColor: "rgba(124,58,237,0.08)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tipNumText:   { fontSize: 11, fontWeight: "800", color: "#7c3aed" },
  tipText:      { fontSize: 14, color: "#555", lineHeight: 21, flex: 1 },
  eyebrow:      { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#bbb", marginBottom: 10 },
  // Chat
  promptBtn:    { paddingHorizontal: 16, paddingVertical: 13, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14 },
  promptText:   { fontSize: 14, fontWeight: "500", color: "#1a1a1a", lineHeight: 20 },
  msgRow:       { flexDirection: "row", alignItems: "flex-end" },
  botDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1a1a1a", marginRight: 10, marginBottom: 6, flexShrink: 0 },
  bubble:       { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:   { backgroundColor: "#1a1a1a", borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleBot:    { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", borderRadius: 18, borderBottomLeftRadius: 4 },
  bubbleText:   { fontSize: 14, lineHeight: 22, color: "#1a1a1a" },
  typingDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ccc" },
  inputRow:     { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 6 : 10, borderTopWidth: 1, borderTopColor: "#e8e5de" },
  chatInput:    { flex: 1, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1.5, borderColor: "#e8e5de", borderRadius: 14, fontSize: 15, color: "#1a1a1a", backgroundColor: "#fff", maxHeight: 100 },
  sendBtn:      { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f0ede8", alignItems: "center", justifyContent: "center" },
  sendBtnActive: { backgroundColor: "#1a1a1a" },
  sendBtnIcon:  { fontSize: 18, color: "#ccc", fontWeight: "700" },
});

// ─── Profile Card Styles ──────────────────────────────────────────────────────
const pc = StyleSheet.create({
  card:        { backgroundColor: "#1a1a1a", borderRadius: 22, padding: 20 },
  topRow:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  eyebrow:     { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  goal:        { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
  expBadge:    { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  expText:     { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  editBtn:     { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  tagRow:      { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:         { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:     { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  focusLabel:  { fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600" },
  focusText:   { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
});

// ─── Week Calendar Styles ─────────────────────────────────────────────────────
const wc = StyleSheet.create({
  card:       { backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: "#e8e5de", overflow: "hidden" },
  row:        { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, paddingHorizontal: 8 },
  dayCol:     { alignItems: "center", gap: 6 },
  bubble:     { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bubbleSel:  { backgroundColor: "#1a1a1a" },
  bubbleToday: { backgroundColor: "#f4f2ed" },
  abbr:       { fontSize: 13, fontWeight: "700", color: "#aaa" },
  abbrSel:    { color: "#fff" },
  abbrToday:  { color: "#1a1a1a" },
  dot:        { width: 6, height: 6, borderRadius: 3 },
});

// ─── Chip Styles ──────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff" },
  chipActive:  { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText:    { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#fff" },
});

// ─── Profile Intro Wizard Styles (matches startersIntro.jsx) ─────────────────
const pi = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#fafaf8" },
  glow:             { position: "absolute", top: -120, right: -120, width: 600, height: 600, borderRadius: 300 },
  scroll:           { flexGrow: 1, justifyContent: "center", padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 20 },
  card:             { backgroundColor: "#fff", borderRadius: 24, padding: 28, minHeight: 520, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 24, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  progressTrack:    { height: 2, backgroundColor: "#e8e6e0", borderRadius: 99, marginBottom: 32 },
  progressFill:     { height: 2, backgroundColor: "#e8380d", borderRadius: 99 },
  stepWrap:         { flex: 1, gap: 4 },
  stepLabel:        { fontSize: 11, fontWeight: "500", letterSpacing: 1, textTransform: "uppercase", color: "#999", marginBottom: 8 },
  question:         { fontSize: 26, fontWeight: "700", color: "#1a1a1a", lineHeight: 32, letterSpacing: -0.5, marginBottom: 24 },
  optionGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  optionBtn:        { flex: 1, minWidth: "28%", backgroundColor: "#f7f6f2", borderWidth: 1.5, borderColor: "#e8e6e0", borderRadius: 14, padding: 14, gap: 5 },
  optionSelected:   { borderColor: "#e8380d", backgroundColor: "#fff", shadowColor: "#e8380d", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  optionLabel:      { fontSize: 13, fontWeight: "500", color: "#1a1a1a" },
  optionLabelSel:   { fontWeight: "700" },
  optionSub:        { fontSize: 11, color: "#999" },
  numRow:           { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  bigNum:           { fontSize: 64, fontWeight: "800", color: "#1a1a1a", letterSpacing: -2, lineHeight: 72 },
  numUnit:          { fontSize: 14, color: "#999", marginTop: 4 },
  stepperCol:       { gap: 8 },
  stepperBtn:       { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#e8e6e0", backgroundColor: "#f7f6f2", alignItems: "center", justifyContent: "center" },
  stepperBtnText:   { fontSize: 20, color: "#1a1a1a", fontWeight: "300", lineHeight: 24 },
  presetsRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  presetBtn:        { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "#e8e6e0", backgroundColor: "#f7f6f2" },
  presetBtnActive:  { backgroundColor: "#e8380d", borderColor: "#e8380d" },
  presetBtnText:    { fontSize: 13, color: "#999", fontWeight: "500" },
  presetBtnTextActive: { color: "#fff" },
  daysGrid:         { flexDirection: "row", gap: 6, marginBottom: 12 },
  dayBtn:           { flex: 1, borderWidth: 1.5, borderColor: "#e8e6e0", backgroundColor: "#f7f6f2", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  daySelected:      { backgroundColor: "#e8380d", borderColor: "#e8380d" },
  dayBtnText:       { fontSize: 13, fontWeight: "500", color: "#999" },
  dayBtnTextSel:    { color: "#fff" },
  daysHint:         { fontSize: 13, color: "#aaa", marginBottom: 8 },
  navRow:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, gap: 10 },
  btnBack:          { borderWidth: 1.5, borderColor: "#e8e6e0", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18 },
  btnBackText:      { fontSize: 14, color: "#999" },
  btnNext:          { flex: 1, maxWidth: 200, backgroundColor: "#e8380d", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnDisabled:      { opacity: 0.3 },
  btnNextText:      { fontSize: 14, fontWeight: "600", color: "#fff" },
});
