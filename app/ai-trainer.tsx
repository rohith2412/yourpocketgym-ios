import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import React, { useCallback, useEffect, useRef, useState } from "react";
import exerciseImageCache from "../src/data/exerciseImageCache.json";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
const EX_KEY         = (d: string, uid: string) => `@ex_done/${d}/${uid}`;
// Sun-indexed to match the calendar display (Sun on left)
const DAY_NAMES      = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_ABBRS      = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function getWeekDates() {
  const today = new Date();
  const sun = new Date(today);
  sun.setDate(today.getDate() - today.getDay()); // back to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun); d.setDate(sun.getDate() + i); return toLocalISO(d);
  });
}
function getPlanDayForDate(plan: any, date: string) {
  if (!plan?.days) return null;
  const dow  = new Date(date + "T12:00:00").getDay();
  const name = DAY_NAMES[dow].toLowerCase();
  return plan.days.find((d: any) => {
    const n = d.day?.toLowerCase() ?? "";
    return n === name || name.startsWith(n) || n.startsWith(name.slice(0, 3));
  }) ?? null;
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
function muscleColor(mg = "") {
  const map: Record<string,string> = {
    chest:"#e8380d", back:"#e8380d", shoulders:"#f59e0b",
    arms:"#ec4899", legs:"#22c55e", core:"#14b8a6",
    glutes:"#e8380d", cardio:"#ef4444",
  };
  return map[(mg||"").toLowerCase().split(/[\s,&]/)[0]] || "#aaa";
}
// ── Exercise image pool ───────────────────────────────────────────────────────
// ── Exercise image system ─────────────────────────────────────────────────────
// 1. Static cache  (exerciseImageCache.json — 90 exercises pre-fetched at build time)
// 2. AsyncStorage  (exercises the AI generates that aren't in the static cache)
// 3. Pexels live   (fetches + stores for any unknown exercise)
// 4. Unsplash pool (offline / guaranteed fallback)

const PEXELS_KEY = "9wKlnJZqB3zs3UCuJ3Ky8Xl8asoyQZSwC4Waab2M52VqYI7uEFkTGo96";
const STATIC_EX_CACHE = exerciseImageCache as Record<string, string>;
const MEM_EX_CACHE: Record<string, string> = {};

// Unsplash pool (verified real gym photos — same IDs as ProfileIntro goal cards)
const GYM_POOL: Record<string, string[]> = {
  chest:     ["1571019614242-c5c5dee9f50b","1583454110551-21f2fa2afe61","1526506118085-60ce8714f8c5"],
  back:      ["1526506118085-60ce8714f8c5","1583454110551-21f2fa2afe61","1571019614242-c5c5dee9f50b"],
  shoulders: ["1583454110551-21f2fa2afe61","1526506118085-60ce8714f8c5","1571019614242-c5c5dee9f50b"],
  arms:      ["1583454110551-21f2fa2afe61","1571019614242-c5c5dee9f50b","1526506118085-60ce8714f8c5"],
  legs:      ["1526506118085-60ce8714f8c5","1571019614242-c5c5dee9f50b","1583454110551-21f2fa2afe61"],
  glutes:    ["1571019614242-c5c5dee9f50b","1583454110551-21f2fa2afe61","1526506118085-60ce8714f8c5"],
  core:      ["1571019613454-1cb2f99b2d8b","1571019614242-c5c5dee9f50b","1583454110551-21f2fa2afe61"],
  cardio:    ["1476480862126-209bfaa8edc8","1571019613454-1cb2f99b2d8b","1571019614242-c5c5dee9f50b"],
};
const GYM_POOL_DEFAULT = [
  "1583454110551-21f2fa2afe61","1526506118085-60ce8714f8c5",
  "1571019614242-c5c5dee9f50b","1571019613454-1cb2f99b2d8b",
  "1476480862126-209bfaa8edc8",
];
function gymPoolFallback(mg: string, name: string): string {
  const g    = mg.toLowerCase();
  const pool = g.includes("chest") ? GYM_POOL.chest
    : g.includes("back")     ? GYM_POOL.back
    : g.includes("shoulder") ? GYM_POOL.shoulders
    : g.includes("arm") || g.includes("bicep") || g.includes("tricep") ? GYM_POOL.arms
    : g.includes("leg") || g.includes("quad") || g.includes("hamstring") || g.includes("calf") ? GYM_POOL.legs
    : g.includes("glute")  ? GYM_POOL.glutes
    : g.includes("core") || g.includes("ab") ? GYM_POOL.core
    : g.includes("cardio") ? GYM_POOL.cardio
    : GYM_POOL_DEFAULT;
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `https://images.unsplash.com/photo-${pool[seed % pool.length]}?auto=format&fit=crop&w=400&q=80`;
}

async function resolveExerciseImage(name: string, mg: string): Promise<string> {
  const key = name.toLowerCase().trim();
  // 1. Memory cache
  if (MEM_EX_CACHE[key]) return MEM_EX_CACHE[key];
  // 2. Static pre-fetched cache (90 common exercises)
  if (STATIC_EX_CACHE[key]) { MEM_EX_CACHE[key] = STATIC_EX_CACHE[key]; return STATIC_EX_CACHE[key]; }
  // 3. AsyncStorage (previously fetched unknowns)
  try {
    const stored = await AsyncStorage.getItem(`exImg_${key}`);
    if (stored) { MEM_EX_CACHE[key] = stored; return stored; }
  } catch {}
  // 4. Pexels live search
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(name + " exercise gym workout")}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (res.ok) {
      const json = await res.json();
      const url  = json?.photos?.[0]?.src?.large;
      if (url) {
        MEM_EX_CACHE[key] = url;
        AsyncStorage.setItem(`exImg_${key}`, url).catch(() => {});
        return url;
      }
    }
  } catch {}
  // 5. Unsplash pool fallback
  return gymPoolFallback(mg, name);
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
const PI_W = Dimensions.get("window").width;
const PI_CARD_W = (PI_W - 52) / 2;

const GOAL_OPTIONS = [
  { val: "Build muscle",     sub: "Build mass and size",        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80" },
  { val: "Lose fat",         sub: "Burn calories, slim down",   image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80" },
  { val: "Improve strength", sub: "Lift heavier, get stronger", image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80" },
  { val: "General fitness",  sub: "Stay active and healthy",    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80" },
  { val: "Endurance",        sub: "Cardio and stamina",         image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80" },
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

function PiDots({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[pi.dot, i < step && pi.dotActive]} />
      ))}
    </View>
  );
}

function ProfileIntro({ visible, initial, onSave, onClose, isEdit = false }: any) {
  const [step, setStep]   = useState(1);
  const [local, setLocal] = useState<GymProfile>({ ...EMPTY_PROFILE, ...initial });
  const fadeAnim          = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) { setStep(1); setLocal({ ...EMPTY_PROFILE, ...initial }); }
  }, [visible, initial]);

  const set = (key: keyof GymProfile, val: any) => setLocal(prev => ({ ...prev, [key]: val }));

  const animateStep = (fn: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(fn, 100);
  };

  const next = () => animateStep(() => setStep(s => Math.min(s + 1, TOTAL_STEPS)));
  const back = () => {
    if (step === 1) { if (isEdit) onClose?.(); }
    else animateStep(() => setStep(s => Math.max(s - 1, 1)));
  };

  const toggleFocus = (val: string) => {
    const arr = local.focusAreas.split(",").map(s => s.trim()).filter(Boolean);
    const upd = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    set("focusAreas", upd.join(", "));
  };
  const hasFocus = (val: string) => local.focusAreas.split(",").map(s => s.trim()).includes(val);

  const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
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

  const canNext = step === 1 ? !!local.goal
    : step === 2 ? !!local.experience
    : step === 6 ? !!local.equipment
    : step === 7 ? selDays.length > 0
    : true;

  const STEP_TITLES: [string, string][] = [
    ["What's your main", "goal?"],
    ["Your experience", "level?"],
    ["How old", "are you?"],
    ["Your current", "weight?"],
    ["How", "tall are you?"],
    ["What equipment", "do you have?"],
    ["Training days", "per week?"],
    ["Session", "length?"],
  ];
  const STEP_SUBS = [
    "Your plan adapts completely to what you're working towards.",
    "We'll calibrate the difficulty and progression for you.",
    "Age helps us tailor your recovery and rep ranges.",
    "We use this to set your baseline fitness metrics.",
    "Height rounds out your body composition profile.",
    "Your plan uses only the gear you have access to.",
    "Pick the days that work best for your schedule.",
    "We'll keep every workout within your time limit.",
  ];
  const [titleLine1, titleLine2] = STEP_TITLES[step - 1];
  const stepSub = STEP_SUBS[step - 1];

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={isEdit ? onClose : undefined}>
      <StatusBar barStyle="dark-content" />
      <View style={pi.root}>

        {/* ── Nav bar ── */}
        <View style={pi.nav}>
          {(step > 1 || isEdit) ? (
            <Pressable onPress={back} style={pi.navBack}>
              <Text style={pi.navBackText}>{step === 1 && isEdit ? "✕" : "←"}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <PiDots step={step} />
          <Pressable onPress={isEdit ? onClose : () => { onSave(local); onClose?.(); }} style={pi.navSkip}>
            <Text style={pi.navSkipText}>{isEdit ? "Cancel" : "Skip"}</Text>
          </Pressable>
        </View>

        {/* ── Animated content ── */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

          {/* Step 1: Goal — image cards */}
          {step === 1 && (
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <View style={pi.headWrap}>
                <Text style={pi.eyebrow}>STEP 1 OF {TOTAL_STEPS}</Text>
                <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
                <Text style={pi.bigSub}>{stepSub}</Text>
              </View>
              <ScrollView contentContainerStyle={pi.goalGrid} showsVerticalScrollIndicator={false}>
                {GOAL_OPTIONS.map(g => {
                  const active = local.goal === g.val;
                  return (
                    <Pressable key={g.val} onPress={() => set("goal", g.val)} style={[pi.goalCard, active && pi.goalCardActive]}>
                      <Image source={g.image} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300} />
                      <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
                      {active && (
                        <View style={pi.goalCheck}>
                          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>✓</Text>
                        </View>
                      )}
                      <View style={pi.goalCardContent}>
                        <Text style={pi.goalLabel}>{g.val}</Text>
                        <Text style={pi.goalSub}>{g.sub}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Step 2: Experience — chip cards */}
          {step === 2 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 2 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
              <View style={pi.bigCardGrid}>
                {EXP_OPTIONS.map(o => {
                  const active = local.experience === o.val;
                  return (
                    <Pressable key={o.val} onPress={() => set("experience", o.val)} style={[pi.bigChipCard, active && pi.bigChipCardActive]}>
                      <Text style={[pi.bigChipLabel, active && pi.bigChipLabelActive]}>{o.val}</Text>
                      <Text style={pi.bigChipSub}>{o.sub}</Text>
                      {active && (
                        <View style={pi.bigChipCheck}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Step 3: Age */}
          {step === 3 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 3 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
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
            </ScrollView>
          )}

          {/* Step 4: Weight */}
          {step === 4 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 4 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
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
            </ScrollView>
          )}

          {/* Step 5: Height */}
          {step === 5 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 5 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
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
            </ScrollView>
          )}

          {/* Step 6: Equipment — chip cards */}
          {step === 6 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 6 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
              <View style={pi.bigCardGrid}>
                {EQUIP_OPTIONS.map(o => {
                  const active = local.equipment === o.val;
                  return (
                    <Pressable key={o.val} onPress={() => set("equipment", o.val)} style={[pi.bigChipCard, active && pi.bigChipCardActive]}>
                      <Text style={[pi.bigChipLabel, active && pi.bigChipLabelActive]}>{o.val}</Text>
                      <Text style={pi.bigChipSub}>{o.sub}</Text>
                      {active && (
                        <View style={pi.bigChipCheck}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Step 7: Training days */}
          {step === 7 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false}>
              <Text style={pi.eyebrow}>STEP 7 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
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
            </ScrollView>
          )}

          {/* Step 8: Session length + focus areas */}
          {step === 8 && (
            <ScrollView contentContainerStyle={pi.scrollStep} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={pi.eyebrow}>STEP 8 OF {TOTAL_STEPS}</Text>
              <Text style={pi.bigTitle}>{titleLine1}{"\n"}<Text style={pi.accent}>{titleLine2}</Text></Text>
              <Text style={pi.bigSub}>{stepSub}</Text>
              <View style={pi.bigCardGrid}>
                {SESSION_LENGTHS.map(l => {
                  const active = local.sessionLength === l;
                  return (
                    <Pressable key={l} onPress={() => set("sessionLength", l)} style={[pi.bigChipCard, active && pi.bigChipCardActive]}>
                      <Text style={[pi.bigChipLabel, active && pi.bigChipLabelActive]}>{l} min</Text>
                      {active && (
                        <View style={pi.bigChipCheck}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={pi.sectionLabel}>FOCUS AREAS (OPTIONAL)</Text>
              <View style={pi.focusRow}>
                {FOCUS_OPTIONS.map(f => (
                  <Pressable key={f} onPress={() => toggleFocus(f)} style={[pi.focusChip, hasFocus(f) && pi.focusChipActive]}>
                    <Text style={[pi.focusChipText, hasFocus(f) && pi.focusChipTextActive]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

        </Animated.View>

        {/* ── Footer CTA ── */}
        <View style={pi.footer}>
          <Pressable
            onPress={step === TOTAL_STEPS ? finish : next}
            disabled={!canNext}
            style={({ pressed }) => [pi.nextBtn, !canNext && { opacity: 0.3 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={pi.nextBtnText}>
              {step === TOTAL_STEPS ? "Build My Plan →" : "Continue"}
            </Text>
          </Pressable>
        </View>

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
function ProgressRing({ progress, size = 36, color = "#e8380d" }: { progress: number; size?: number; color?: string }) {
  const sw = 3, r = (size - sw) / 2, circ = 2 * Math.PI * r, cx = size / 2;
  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle cx={cx} cy={cx} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={sw} fill="none" />
      <Circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(Math.max(progress, 0), 1))}
        strokeLinecap="round" rotation={-90} origin={`${cx},${cx}`} />
    </Svg>
  );
}

function WeekCalendar({ selDate, onSelect, completions, exProgress, planDays }: any) {
  const dates    = getWeekDates();
  const todayISO = toLocalISO();
  const selIdx   = dates.indexOf(selDate);

  const [colWidth, setColWidth] = useState(0);
  const pillX    = useRef(new Animated.Value(0)).current;
  const pillOpac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (colWidth === 0) return;
    Animated.parallel([
      Animated.spring(pillX, { toValue: selIdx * colWidth, useNativeDriver: true, damping: 18, stiffness: 260, mass: 0.75 }),
      Animated.timing(pillOpac, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [selIdx, colWidth]);

  return (
    <View style={wc.container}
      onLayout={(e) => {
        const cw = e.nativeEvent.layout.width / 7;
        setColWidth(cw);
        pillX.setValue(selIdx * cw);
        pillOpac.setValue(1);
      }}>

      {/* Sliding orange pill */}
      {colWidth > 0 && (
        <Animated.View pointerEvents="none"
          style={[wc.pill, { width: colWidth - 6, opacity: pillOpac, transform: [{ translateX: Animated.add(pillX, 3) }] }]} />
      )}

      {dates.map((date, i) => {
        const isSel   = date === selDate;
        const isToday = date === todayISO;
        const done    = !!completions[date];
        const dayName = DAY_NAMES[i].toLowerCase();
        const planDay = planDays?.find((d: any) => {
          const n = d.day?.toLowerCase() ?? "";
          return n === dayName || dayName.startsWith(n) || n.startsWith(dayName.slice(0, 3));
        });
        const hasWork  = planDay && !planDay.restDay;
        const num      = new Date(date + "T12:00:00").getDate();
        const exProg   = (exProgress?.[date] || 0) as number;
        const fullyDone = done || exProg >= 1;

        return (
          <Pressable key={date} onPress={() => onSelect(date)} style={wc.col}>
            <Text style={[wc.abbr, isSel && wc.abbrSel]}>{DAY_ABBRS[i]}</Text>
            <View style={wc.circleWrap}>
              {/* Partial progress ring — grows as exercises are ticked */}
              {hasWork && exProg > 0 && !fullyDone && (
                <ProgressRing
                  progress={exProg}
                  size={36}
                  color={isSel ? "rgba(255,255,255,0.85)" : "#e8380d"}
                />
              )}
              <View style={[wc.circle, hasWork && fullyDone && !isSel && wc.circleDone]}>
                <Text style={[wc.num, isSel && wc.numSel, hasWork && fullyDone && wc.numDone]}>
                  {hasWork && fullyDone ? "✓" : num}
                </Text>
              </View>
              {/* Planned workout dot — only when no progress and not selected */}
              {hasWork && !fullyDone && exProg === 0 && !isSel && <View style={wc.workoutDot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Exercise Checkbox (animated, matches MealPlanView) ───────────────────────
function ExCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: checked ? 1 : 0, useNativeDriver: false, damping: 12, mass: 0.6, stiffness: 220 }).start();
  }, [checked]);
  const scale  = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.25, 1] });
  const bg     = anim.interpolate({ inputRange: [0, 1], outputRange: ["#ffffff", "#e8380d"] });
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(0,0,0,0.18)", "#e8380d"] });
  return (
    <Pressable onPress={onToggle} hitSlop={10}>
      <Animated.View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: bg, borderColor: border }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Svg width={13} height={13} viewBox="0 0 14 14">
            <Path d="M2.5 7 L5.5 10 L11.5 4" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, index, checked, onToggle }: any) {
  const color = muscleColor(ex.muscleGroup);
  // Show pool fallback instantly, upgrade to Pexels/cache once resolved
  const [imgSrc, setImgSrc] = useState<string>(
    STATIC_EX_CACHE[ex.name?.toLowerCase().trim()] ??
    MEM_EX_CACHE[ex.name?.toLowerCase().trim()] ??
    gymPoolFallback(ex.muscleGroup || "", ex.name || "")
  );

  useEffect(() => {
    let alive = true;
    resolveExerciseImage(ex.name || "", ex.muscleGroup || "").then(url => {
      if (alive && url !== imgSrc) setImgSrc(url);
    });
    return () => { alive = false; };
  }, [ex.name, ex.muscleGroup]);

  return (
    <Pressable onPress={onToggle} style={[ec.card, checked && ec.cardDone]}>
      {/* Thumbnail */}
      <View style={ec.thumbWrap}>
        <Image source={imgSrc} style={ec.thumb} contentFit="cover" cachePolicy="memory-disk" transition={300} />
        {checked && <View style={ec.thumbDim} />}
      </View>

      <View style={ec.inner}>
        {/* Top row: muscle badge + checkbox */}
        <View style={ec.topRow}>
          <View style={[ec.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[ec.badgeText, { color }]}>{(ex.muscleGroup || "").toUpperCase()}</Text>
          </View>
          <ExCheckbox checked={checked} onToggle={onToggle} />
        </View>

        {/* Exercise name */}
        <Text style={[ec.name, checked && ec.nameDone]} numberOfLines={2}>{ex.name}</Text>

        {/* Sets / reps pills */}
        <View style={ec.macroRow}>
          <View style={ec.setPillAccent}>
            <Text style={ec.setValAccent}>{ex.sets}</Text>
            <Text style={ec.macroLbl}>sets</Text>
          </View>
          <View style={ec.repPill}>
            <Text style={ec.repVal}>{ex.reps}</Text>
            <Text style={ec.macroLbl}>reps</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, checkedArr, onToggleEx }: any) {
  if (day.restDay) {
    return (
      <View style={[s.dayCard, { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }]}>
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
      <View style={s.dayCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.dayLabel}>{day.label}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <Text style={s.dayMeta}>{day.exercises?.length} moves · {day.estimatedTime}min</Text>
            <View style={s.focusBadge}><Text style={s.focusBadgeText}>{day.focus}</Text></View>
          </View>
        </View>
        <View style={s.dayBoxOpen}>
          <Text style={s.dayBoxLabel}>{day.day?.slice(0, 3).toUpperCase()}</Text>
          <Text style={s.dayBoxNum}>{day.exercises?.length ?? 0}</Text>
        </View>
      </View>
      <View style={s.dayBody}>
        <View style={{ gap: 12 }}>
          {day.exercises?.map((ex: any, i: number) => (
            <ExerciseCard
              key={i}
              ex={ex}
              index={i}
              checked={checkedArr?.[i] || false}
              onToggle={() => onToggleEx?.(i)}
            />
          ))}
        </View>
      </View>
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
                  <View style={[s.tipNum, { backgroundColor: "rgba(232,56,13,0.1)" }]}><Text style={[s.tipNumText, { color: "#e8380d" }]}>{i+1}</Text></View>
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

// ─── Edit Preferences Sheet ───────────────────────────────────────────────────
function EditPrefsSheet({ visible, initial, onSave, onClose }: any) {
  const [local, setLocal] = useState<GymProfile>({ ...EMPTY_PROFILE, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setLocal({ ...EMPTY_PROFILE, ...initial });
  }, [visible]);

  const set = (key: keyof GymProfile, val: any) => setLocal(prev => ({ ...prev, [key]: val }));

  const toggleFocus = (val: string) => {
    const arr = local.focusAreas.split(",").map((s: string) => s.trim()).filter(Boolean);
    const upd = arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val];
    set("focusAreas", upd.join(", "));
  };
  const hasFocus = (val: string) => local.focusAreas.split(",").map((s: string) => s.trim()).includes(val);

  async function save() {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" />

      {/* Nav bar */}
      <View style={ep.navBar}>
        <TouchableOpacity onPress={onClose} style={ep.navSide}>
          <Text style={ep.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={ep.navTitle}>Training Preferences</Text>
        <TouchableOpacity onPress={save} disabled={saving} style={ep.navSide}>
          <Text style={[ep.navSave, saving && { opacity: 0.4 }]}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={ep.scroll} contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Goal */}
        <Text style={ep.sectionLabel}>GOAL</Text>
        <View style={ep.card}>
          {GOAL_OPTIONS.map(({ val, sub }, i) => (
            <TouchableOpacity key={val} onPress={() => set("goal", val)}
              style={[ep.row, i < GOAL_OPTIONS.length - 1 && ep.rowDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={ep.rowTitle}>{val}</Text>
                {sub ? <Text style={ep.rowSub}>{sub}</Text> : null}
              </View>
              {local.goal === val && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience */}
        <Text style={ep.sectionLabel}>EXPERIENCE</Text>
        <View style={ep.card}>
          {EXP_OPTIONS.map(({ val, sub }, i) => (
            <TouchableOpacity key={val} onPress={() => set("experience", val)}
              style={[ep.row, i < EXP_OPTIONS.length - 1 && ep.rowDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={ep.rowTitle}>{val}</Text>
                {sub ? <Text style={ep.rowSub}>{sub}</Text> : null}
              </View>
              {local.experience === val && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment */}
        <Text style={ep.sectionLabel}>EQUIPMENT</Text>
        <View style={ep.card}>
          {EQUIP_OPTIONS.map(({ val, sub }, i) => (
            <TouchableOpacity key={val} onPress={() => set("equipment", val)}
              style={[ep.row, i < EQUIP_OPTIONS.length - 1 && ep.rowDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={ep.rowTitle}>{val}</Text>
                {sub ? <Text style={ep.rowSub}>{sub}</Text> : null}
              </View>
              {local.equipment === val && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Days per week */}
        <Text style={ep.sectionLabel}>DAYS PER WEEK</Text>
        <View style={ep.card}>
          {DAYS_OPTS.map((d, i) => (
            <TouchableOpacity key={d} onPress={() => set("daysPerWeek", d)}
              style={[ep.row, i < DAYS_OPTS.length - 1 && ep.rowDivider]}>
              <Text style={ep.rowTitle}>{d} days</Text>
              {local.daysPerWeek === d && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Session length */}
        <Text style={ep.sectionLabel}>SESSION LENGTH</Text>
        <View style={ep.card}>
          {SESSION_LENGTHS.map((l, i) => (
            <TouchableOpacity key={l} onPress={() => set("sessionLength", l)}
              style={[ep.row, i < SESSION_LENGTHS.length - 1 && ep.rowDivider]}>
              <Text style={ep.rowTitle}>{l} min</Text>
              {local.sessionLength === l && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Focus areas (multi-select) */}
        <Text style={ep.sectionLabel}>FOCUS AREAS</Text>
        <View style={ep.card}>
          {FOCUS_OPTIONS.map((f, i) => (
            <TouchableOpacity key={f} onPress={() => toggleFocus(f)}
              style={[ep.row, i < FOCUS_OPTIONS.length - 1 && ep.rowDivider]}>
              <Text style={ep.rowTitle}>{f}</Text>
              {hasFocus(f) && <Text style={ep.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Injuries */}
        <Text style={ep.sectionLabel}>INJURIES OR LIMITATIONS</Text>
        <View style={ep.card}>
          <TextInput
            value={local.injuries}
            onChangeText={v => set("injuries", v)}
            placeholder="e.g. bad knees, lower back pain…"
            placeholderTextColor="#c7c7cc"
            multiline
            style={ep.textInput}
          />
        </View>

      </ScrollView>
    </Modal>
  );
}

const ep = StyleSheet.create({
  navBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 58 : 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#c6c6c8" },
  navSide:    { minWidth: 72 },
  navCancel:  { fontSize: 17, color: "#8e8e93" },
  navTitle:   { fontSize: 17, fontWeight: "700", color: "#000", letterSpacing: -0.3 },
  navSave:    { fontSize: 17, fontWeight: "600", color: "#e8380d", textAlign: "right" },
  scroll:     { flex: 1, backgroundColor: "#f2f2f7" },
  sectionLabel: { fontSize: 13, color: "#6c6c70", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 28, marginBottom: 8, marginHorizontal: 20 },
  card:       { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 12, overflow: "hidden" },
  row:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, minHeight: 54 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#c6c6c8" },
  rowTitle:   { fontSize: 17, color: "#000", flex: 1 },
  rowSub:     { fontSize: 13, color: "#8e8e93", marginTop: 2 },
  check:      { fontSize: 18, color: "#e8380d", fontWeight: "700", marginLeft: 8 },
  textInput:  { paddingHorizontal: 16, paddingVertical: 14, fontSize: 17, color: "#000", minHeight: 100, textAlignVertical: "top" },
});

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
  const [completions,  setCompletions]  = useState<Record<string, boolean>>({});
  const [exChecked,    setExChecked]    = useState<Record<string, boolean[]>>({});

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

  // Load per-exercise checks for the whole week
  useEffect(() => {
    if (!userId) { setExChecked({}); return; }
    const dates = getWeekDates();
    AsyncStorage.multiGet(dates.map(d => EX_KEY(d, userId))).then(pairs => {
      const map: Record<string, boolean[]> = {};
      pairs.forEach(([k, v]) => {
        if (v) {
          const date = k.replace(`@ex_done/`, "").replace(`/${userId}`, "");
          try { map[date] = JSON.parse(v); } catch {}
        }
      });
      setExChecked(map);
    }).catch(() => setExChecked({}));
  }, [userId]);

  async function generatePlan(profileOverride?: any) {
    const p = profileOverride || profile;
    if (!session || !p) return;
    setPlanLoad(true);
    setPlanError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/ai-trainer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "plan",
          extra: {
            equipment: p.equipment,
            focusAreas: p.focusAreas,
            sessionLength: p.sessionLength,
            injuries: p.injuries,
            goal: p.goal,
            experience: p.experience,
            daysPerWeek: p.daysPerWeek,
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

  async function handleProfileSave(data: any) {
    await saveProfile(data);
    generatePlan(data); // fire in background — main screen shows skeleton
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

  async function toggleExercise(date: string, idx: number) {
    if (!userId) return;
    const total   = planDay?.exercises?.length || 0;
    const current = exChecked[date] || Array(total).fill(false);
    const updated = [...current];
    updated[idx]  = !updated[idx];
    await AsyncStorage.setItem(EX_KEY(date, userId), JSON.stringify(updated)).catch(() => {});
    setExChecked(p => ({ ...p, [date]: updated }));
  }

  if (!ready || (userId && !profileLoaded)) return null;
  if (ready && !session) return null;

  const firstName  = userName || session?.user?.name?.split(" ")[0] || "Athlete";
  const planDay    = plan ? getPlanDayForDate(plan, selDate) : null;
  const isToday    = selDate === toLocalISO();
  const isDone     = completions[selDate];

  // Compute exercise progress ratio (0–1) for each date in the week
  const exProgress: Record<string, number> = {};
  if (plan) {
    getWeekDates().forEach(date => {
      const pd = getPlanDayForDate(plan, date);
      if (pd && !pd.restDay && pd.exercises?.length > 0) {
        const checks = exChecked[date] || [];
        exProgress[date] = checks.filter(Boolean).length / pd.exercises.length;
      }
    });
  }

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
      <View style={{ flex: 1, paddingHorizontal: 12 }}>

        {/* ── PLAN TAB ── */}
        {mainTab === "plan" && !showPlan && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 12 }}>

            {/* Week calendar - only if we have a plan */}
            {plan && (
              <WeekCalendar
                selDate={selDate}
                onSelect={setSelDate}
                completions={completions}
                exProgress={exProgress}
                planDays={plan.days}
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
                  <DayCard
                    day={planDay}
                    isDone={isDone}
                    onToggle={() => toggleComplete(selDate)}
                    checkedArr={exChecked[selDate] || []}
                    onToggleEx={(i: number) => toggleExercise(selDate, i)}
                  />
                ) : (
                  <View style={[s.dayCard, { alignItems: "center", padding: 24 }]}>
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

            {/* Mark complete + Edit prefs — same level, same width */}
            {plan && !planLoad && planDay && !planDay.restDay && (
              <Pressable onPress={() => toggleComplete(selDate)} style={[s.completeBtn, isDone && s.completeBtnDone]}>
                <Text style={s.completeBtnText}>{isDone ? "✓  Done!" : "Mark as Complete"}</Text>
              </Pressable>
            )}

            {profile && !planLoad && (
              <Pressable onPress={() => setShowProfileEdit(true)} style={s.editPrefsBtn}>
                <Text style={s.editPrefsBtnText}>Edit preferences</Text>
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

      {/* First-time profile wizard */}
      <ProfileIntro
        visible={profileLoaded && !profile && mainTab === "plan"}
        initial={EMPTY_PROFILE}
        isEdit={false}
        onSave={handleProfileSave}
        onClose={() => {}}
      />

      {/* Edit preferences bottom sheet */}
      <EditPrefsSheet
        visible={showProfileEdit}
        initial={profile || EMPTY_PROFILE}
        onSave={handleProfileSave}
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
  editPrefsBtn: { borderWidth: 1.5, borderColor: "#e8e5de", borderRadius: 20, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  editPrefsBtnText: { fontSize: 14, fontWeight: "600", color: "#888" },
  completeBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingVertical: 16, alignItems: "center" },
  completeBtnDone: { backgroundColor: "#e8380d" },
  completeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
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
  dayCard:      { backgroundColor: "#fff", borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 4, overflow: "hidden" },
  dayCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" },
  dayBox:       { width: 42, height: 42, borderRadius: 13, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dayBoxOpen:   { width: 42, height: 42, borderRadius: 13, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  dayBoxLabel:  { fontSize: 8, fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: 0.8 },
  dayBoxNum:    { fontSize: 16, fontWeight: "800", color: "#fff" },
  dayLabel:     { fontSize: 15, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.3 },
  dayMeta:      { fontSize: 11, color: "#aaa", fontWeight: "500" },
  focusBadge:   { backgroundColor: "rgba(232,56,13,0.08)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  focusBadgeText: { fontSize: 10, fontWeight: "700", color: "#e8380d" },
  chevron:      { fontSize: 20, color: "#ccc" },
  dayBody:      { backgroundColor: "#f7f6f3", padding: 10, gap: 0 },
  warmupBox:    { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#ece9e3" },
  warmupLabel:  { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: "#e8380d", marginBottom: 4 },
  warmupText:   { fontSize: 13, color: "#666", lineHeight: 19 },
  cooldownBox:  { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginTop: 4, borderWidth: 1, borderColor: "#ece9e3" },
  cooldownLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: "#e8380d", marginBottom: 4 },
  cooldownText: { fontSize: 13, color: "#666", lineHeight: 19 },
  // Exercise card
  dot:          { width: 7, height: 7, borderRadius: 4 },
  exDetail:     { borderTopWidth: 1, borderTopColor: "#f4f2ed", padding: 12, backgroundColor: "#fafaf8" },
  tempoLabel:   { fontSize: 10, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8 },
  tempoBadge:   { backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tempoBadgeText: { fontSize: 12, fontWeight: "700", color: "#e8380d" },
  exNotes:      { fontSize: 13, color: "#666", lineHeight: 20 },
  // Tips
  tipSectionTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  tipRow:       { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  tipNum:       { width: 22, height: 22, borderRadius: 6, backgroundColor: "rgba(124,58,237,0.08)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tipNumText:   { fontSize: 11, fontWeight: "800", color: "#e8380d" },
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

// ─── Exercise Card Styles (matches MealPlanView MealCard) ────────────────────
const ORANGE = "#e8380d";
const ec = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 28,
    paddingRight: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: "hidden",
  },
  cardDone:   { backgroundColor: "#fafaf8", borderColor: "rgba(0,0,0,0.03)" },
  thumbWrap:  { width: 88, height: 96, alignSelf: "center", borderRadius: 20, overflow: "hidden", marginLeft: 14 },
  thumb:      { width: 88, height: 96 },
  thumbDim:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.45)" },
  inner:      { flex: 1, paddingLeft: 14, gap: 6 },
  topRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:  { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  name:       { fontSize: 16, fontWeight: "700", color: "#0e0e0e", lineHeight: 21, letterSpacing: -0.3 },
  nameDone:   { color: "rgba(0,0,0,0.28)", textDecorationLine: "line-through" },
  macroRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  setPillAccent: { flexDirection: "row", alignItems: "baseline", gap: 2, backgroundColor: `${ORANGE}18`, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  setValAccent:  { fontSize: 11, fontWeight: "800", color: ORANGE },
  repPill:    { flexDirection: "row", alignItems: "baseline", gap: 2, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  repVal:     { fontSize: 11, fontWeight: "700", color: "#0e0e0e" },
  macroLbl:   { fontSize: 9, fontWeight: "500", color: "rgba(0,0,0,0.32)" },
});

// ─── Week Calendar Styles ─────────────────────────────────────────────────────
const wc = StyleSheet.create({
  container:  { flexDirection: "row", backgroundColor: "#fff", borderRadius: 28, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: "hidden" },
  pill:       { position: "absolute", top: 7, bottom: 7, borderRadius: 20, backgroundColor: "#e8380d" },
  col:        { flex: 1, alignItems: "center", gap: 6, paddingVertical: 2, zIndex: 1 },
  abbr:       { fontSize: 11, fontWeight: "600", color: "rgba(0,0,0,0.3)", letterSpacing: 0.2 },
  abbrSel:    { color: "#fff", fontWeight: "800" },
  circleWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  circle:     { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  num:        { fontSize: 13, fontWeight: "700", color: "#0e0e0e" },
  numSel:     { color: "#fff" },
  circleDone: { backgroundColor: "#e8380d" },
  numDone:    { fontSize: 14, fontWeight: "900", color: "#fff" },
  workoutDot: { position: "absolute", bottom: -1, width: 6, height: 6, borderRadius: 3, backgroundColor: "#e8380d" },
  todayDot:   { position: "absolute", bottom: -1, width: 5, height: 5, borderRadius: 3, backgroundColor: "#e8380d" },
});

// ─── Chip Styles ──────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff" },
  chipActive:  { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText:    { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#fff" },
});

// ─── Profile Intro Wizard Styles (matches MealPlanOnboarding) ────────────────
const pi = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },

  // Nav
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  navBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navBackText: { fontSize: 22, color: "#0e0e0e" },
  navSkip: { paddingVertical: 8, paddingHorizontal: 4 },
  navSkipText: { fontSize: 14, color: "rgba(0,0,0,0.3)", fontWeight: "500" },

  // Progress dots
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: "#e8e5de" },
  dotActive: { backgroundColor: "#0e0e0e" },

  // Typography
  eyebrow: { fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 },
  bigTitle: { fontSize: 46, fontWeight: "900", color: "#0e0e0e", letterSpacing: -2, lineHeight: 50, marginBottom: 12 },
  accent: { color: "#e8380d" },
  bigSub: { fontSize: 15, color: "rgba(0,0,0,0.38)", lineHeight: 22, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 28, marginBottom: 12 },

  headWrap: { paddingTop: 4 },
  scrollStep: { paddingHorizontal: 20, paddingBottom: 40 },

  // Goal image cards (step 1)
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 4, paddingBottom: 20 },
  goalCard: { width: PI_CARD_W, height: 185, borderRadius: 20, overflow: "hidden", justifyContent: "flex-end", borderWidth: 2, borderColor: "transparent" },
  goalCardActive: { borderColor: "#0e0e0e" },
  goalCheck: { position: "absolute", top: 12, right: 12, width: 26, height: 26, borderRadius: 13, backgroundColor: "#0e0e0e", alignItems: "center", justifyContent: "center" },
  goalCardContent: { padding: 14 },
  goalLabel: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  goalSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  // Chip cards (experience, equipment, session length)
  bigCardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  bigChipCard: { width: PI_CARD_W, backgroundColor: "#f7f7f5", borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: "transparent", gap: 4 },
  bigChipCardActive: { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  bigChipLabel: { fontSize: 16, fontWeight: "700", color: "rgba(0,0,0,0.5)" },
  bigChipLabelActive: { color: "#0e0e0e" },
  bigChipSub: { fontSize: 12, color: "rgba(0,0,0,0.3)" },
  bigChipCheck: { position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: "#0e0e0e", alignItems: "center", justifyContent: "center" },

  // Numeric stepper (age, weight, height)
  numRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  bigNum: { fontSize: 64, fontWeight: "800", color: "#0e0e0e", letterSpacing: -2, lineHeight: 72 },
  numUnit: { fontSize: 14, color: "rgba(0,0,0,0.3)", marginTop: 4 },
  stepperCol: { gap: 8 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#f7f7f5", alignItems: "center", justifyContent: "center" },
  stepperBtnText: { fontSize: 22, color: "#0e0e0e", fontWeight: "300", lineHeight: 26 },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  presetBtn: { borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#f7f7f5" },
  presetBtnActive: { backgroundColor: "#0e0e0e", borderColor: "#0e0e0e" },
  presetBtnText: { fontSize: 13, color: "rgba(0,0,0,0.4)", fontWeight: "600" },
  presetBtnTextActive: { color: "#fff" },

  // Day selector (step 7)
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  dayBtn: { flex: 1, minWidth: 42, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#f7f7f5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  daySelected: { backgroundColor: "#0e0e0e", borderColor: "#0e0e0e" },
  dayBtnText: { fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.4)" },
  dayBtnTextSel: { color: "#fff" },
  daysHint: { fontSize: 14, color: "rgba(0,0,0,0.3)", marginBottom: 8 },

  // Focus area chips (step 8)
  focusRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  focusChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24, backgroundColor: "#f4f4f2", borderWidth: 1.5, borderColor: "transparent" },
  focusChipActive: { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  focusChipText: { fontSize: 14, fontWeight: "600", color: "rgba(0,0,0,0.5)" },
  focusChipTextActive: { color: "#0e0e0e" },

  // Footer CTA
  footer: { padding: 20, paddingBottom: 44 },
  nextBtn: { backgroundColor: "#0e0e0e", borderRadius: 18, paddingVertical: 20, alignItems: "center" },
  nextBtnText: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
});
