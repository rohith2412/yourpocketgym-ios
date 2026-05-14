import AvatarButton from "@/components/AvatarButton";
import PremiumGate from "@/components/PremiumGate";
import { useSubscription } from "@/src/hooks/useSubscription";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
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
import Svg, { Circle, G, Path, Rect, Line } from "react-native-svg";
//MACRO_DEMO_MODE = false;
const AnimArc = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const BASE_URL = "https://yourpocketgym.com";

function toLocalISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function todayISO() {
  return toLocalISO();
}
function sumMacros(logs) {
  const t = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  logs.forEach((l) => {
    t.calories += l.totals?.calories || 0;
    t.protein  += l.totals?.protein  || 0;
    t.carbs    += l.totals?.carbs    || 0;
    t.fat      += l.totals?.fat      || 0;
    t.fiber    += l.totals?.fiber    || 0;
  });
  return t;
}
function fmt(n)   { return Math.round(n ?? 0); }
function round1(n){ return Math.round((n ?? 0) * 10) / 10; }
function mealLabel(type) {
  return ({
    breakfast:    "Breakfast",
    
    lunch:        "Lunch",
    afternoon:    "Afternoon",
    dinner:       "Dinner",
    snack:        "Snack",
    dessert:      "Dessert",
    smoothie:     "Smoothie",
    preworkout:   "Pre-workout",
    postworkout:  "Post-workout",
    latenight:    "Late Night",
  }[type] ?? type);
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// true  → static pre-filled nutrition data for App Store screenshots
// false → live data from the server (normal user experience)
const MACRO_DEMO_MODE = false;

const DEMO_GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70, fiber: 30 };

const DEMO_MACRO_LOGS = [
  {
    _id: "dm1",
    mealType: "breakfast",
    localDate: todayISO(),
    date: new Date().toISOString(),
    totals: { calories: 385, protein: 29, carbs: 44, fat: 9, fiber: 5 },
    foods: [
      { name: "Greek Yogurt",    portion: "200g",  macros: { calories: 130, protein: 17, carbs: 9,  fat: 3 }, confidence: 0.96 },
      { name: "Rolled Oats",     portion: "60g",   macros: { calories: 210, protein: 7,  carbs: 35, fat: 4 }, confidence: 0.98 },
      { name: "Mixed Berries",   portion: "80g",   macros: { calories: 45,  protein: 1,  carbs: 11, fat: 0 }, confidence: 0.94 },
    ],
    aiNotes: "High protein breakfast — great way to start the day.",
  },
  {
    _id: "dm2",
    mealType: "lunch",
    localDate: todayISO(),
    date: new Date().toISOString(),
    totals: { calories: 570, protein: 46, carbs: 66, fat: 12, fiber: 7 },
    foods: [
      { name: "Grilled Chicken Breast", portion: "180g",  macros: { calories: 297, protein: 38, carbs: 0,  fat: 7  }, confidence: 0.97 },
      { name: "Brown Rice",             portion: "150g",  macros: { calories: 165, protein: 4,  carbs: 36, fat: 1  }, confidence: 0.95 },
      { name: "Steamed Broccoli",       portion: "100g",  macros: { calories: 34,  protein: 3,  carbs: 7,  fat: 0  }, confidence: 0.99 },
      { name: "Olive Oil drizzle",      portion: "5ml",   macros: { calories: 44,  protein: 0,  carbs: 0,  fat: 5  }, confidence: 0.88 },
    ],
    aiNotes: "Balanced macro bowl — solid protein and complex carbs.",
  },
  {
    _id: "dm3",
    mealType: "preworkout",
    localDate: todayISO(),
    date: new Date().toISOString(),
    totals: { calories: 195, protein: 20, carbs: 22, fat: 3, fiber: 2 },
    foods: [
      { name: "Banana",          portion: "1 medium", macros: { calories: 89,  protein: 1,  carbs: 23, fat: 0 }, confidence: 0.99 },
      { name: "Whey Protein",    portion: "30g scoop",macros: { calories: 120, protein: 24, carbs: 4,  fat: 2 }, confidence: 0.96 },
    ],
    aiNotes: "Quick pre-workout fuel — fast carbs + protein.",
  },
  {
    _id: "dm4",
    mealType: "postworkout",
    localDate: todayISO(),
    date: new Date().toISOString(),
    totals: { calories: 430, protein: 40, carbs: 50, fat: 6, fiber: 5 },
    foods: [
      { name: "Grilled Salmon",  portion: "150g",  macros: { calories: 250, protein: 34, carbs: 0,  fat: 12 }, confidence: 0.95 },
      { name: "Sweet Potato",    portion: "200g",  macros: { calories: 172, protein: 3,  carbs: 40, fat: 0  }, confidence: 0.97 },
      { name: "Asparagus",       portion: "80g",   macros: { calories: 18,  protein: 2,  carbs: 3,  fat: 0  }, confidence: 0.93 },
    ],
    aiNotes: "Excellent post-workout recovery meal.",
  },
];

const DEFAULT_GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70, fiber: 30 };
const MEAL_TYPES = [
  { key: "breakfast",   label: "Breakfast"    },
  { key: "lunch",       label: "Lunch"        },
  { key: "smoothie",    label: "Smoothie"     },
  { key: "afternoon",   label: "Afternoon"    },
  { key: "dinner",      label: "Dinner"       },
  { key: "snack",       label: "Snack"        },
  { key: "dessert",     label: "Dessert"      },
  { key: "preworkout",  label: "Pre-workout"  },
  { key: "postworkout", label: "Post-workout" },
  { key: "latenight",   label: "Late Night"   },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────
function useAuth() {
  const [token, setToken]       = useState(null);
  const [userName, setUserName] = useState("");
  const [initial, setInitial]   = useState("A");
  useEffect(() => {
    AsyncStorage.multiGet(["token", "user"]).then(([[, t], [, raw]]) => {
      if (t) setToken(t);
      if (raw)
        try {
          const u = JSON.parse(raw);
          setUserName(u.name?.split(" ")[0] ?? "");
          setInitial((u.name?.[0] ?? "A").toUpperCase());
        } catch {}
    });
  }, []);
  return { token, userName, initial };
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function BottomSheet({ visible, onClose, children }) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim,    { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim,    { toValue: 500, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[sh.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={sh.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 14,
    maxHeight: "90%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: {
    width: 36, height: 4, backgroundColor: "#e0ddd6",
    borderRadius: 99, alignSelf: "center", marginBottom: 20,
  },
});

// ─── Calorie Arc ──────────────────────────────────────────────────────────────
function CalorieArc({ consumed, goal }) {
  const SIZE = 140, CX = 70, R = 56, SW = 13;
  const CIRC = 2 * Math.PI * R;

  const pct  = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over = pct >= 1;
  const warn = pct >= 0.9;

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, { toValue: pct, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);

  const dashOffset = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const arcColor   = over ? "#f87171" : warn ? "#fbbf24" : "#e8380d";

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Circle cx={CX} cy={CX} r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={SW} />
        {consumed > 0 && (
          <AnimArc
            cx={CX} cy={CX} r={R} fill="none"
            stroke={arcColor} strokeWidth={SW}
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform={`rotate(-90, 70, 70)`}
          />
        )}
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={arc.num}>{fmt(consumed)}</Text>
        <Text style={arc.unit}>cal</Text>
      </View>
    </View>
  );
}

const arc = StyleSheet.create({
  num:  { fontSize: 24, fontWeight: "900", color: "#1a1a1a", letterSpacing: -1, lineHeight: 28 },
  unit: { fontSize: 9, color: "rgba(0,0,0,0.3)", fontWeight: "700", letterSpacing: 1.4, marginTop: 2 },
});

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, delay = 0 }) {
  const rawPct = goal > 0 ? value / goal : 0;
  const pct    = Math.min(rawPct, 1);
  const over   = rawPct >= 1;

  const animW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animW, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
  }, [pct]);

  const widthPct = animW.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const barColor = over ? "#f87171" : "#e8380d";

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: barColor }} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.45)" }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 11, color: "#aaa" }}>
          <Text style={{ fontWeight: "800", color: over ? "#f87171" : "#1a1a1a" }}>{round1(value)}</Text>
          <Text>/{goal}g</Text>
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <Animated.View style={{ height: "100%", width: widthPct, backgroundColor: barColor, borderRadius: 99 }} />
      </View>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ height = 80 }) {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ height, borderRadius: 20, backgroundColor: "#ece9e3", marginBottom: 10, opacity: anim }} />;
}

// ─── Goals Sheet ──────────────────────────────────────────────────────────────
function GoalsSheet({ visible, goals, calculated, hasCustom, token, onClose, onSaved }) {
  const [local, setLocal]         = useState({ ...goals });
  const [saving, setSaving]       = useState(false);
  const [resetting, setResetting] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(500)).current;

  useEffect(() => { setLocal({ ...goals }); }, [goals]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim,    { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim,    { toValue: 500, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const FIELDS = [
    { key: "calories", label: "Calories", unit: "cal" },
    { key: "protein",  label: "Protein",  unit: "g"   },
    { key: "carbs",    label: "Carbs",    unit: "g"   },
    { key: "fat",      label: "Fat",      unit: "g"   },
    { key: "fiber",    label: "Fiber",    unit: "g"   },
  ];

  async function save() {
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/nutrition-goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(local),
      });
      const json = await res.json();
      if (json.success) { onSaved(local, true); onClose(); }
      else Alert.alert("Error", json.error);
    } catch { Alert.alert("Error", "Network error"); }
    finally { setSaving(false); }
  }

  async function reset() {
    setResetting(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/nutrition-goals`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && calculated) { onSaved(calculated, false); onClose(); }
    } catch {} finally { setResetting(false); }
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropAnim }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <Animated.View style={[gs.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={gs.handle} />
          <View style={g.row}>
            <Text style={g.title}>Daily goals</Text>
            <Pressable onPress={onClose}><Text style={g.cancel}>Cancel</Text></Pressable>
          </View>
          {calculated && hasCustom && (
            <Pressable onPress={reset} disabled={resetting} style={[g.resetRow, resetting && { opacity: 0.5 }]}>
              <Text style={g.resetText}>{resetting ? "Resetting…" : "Reset to calculated defaults"}</Text>
            </Pressable>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
            <View style={{ marginBottom: 20 }}>
              {FIELDS.map(({ key, label, unit }, i) => (
                <View key={key} style={[g.inputRow, i < FIELDS.length - 1 && g.inputRowBorder]}>
                  <Text style={g.inputLabel}>{label}</Text>
                  <TextInput
                    value={String(local[key])}
                    onChangeText={(v) => setLocal((p) => ({ ...p, [key]: Number(v.replace(/[^0-9]/g, "")) || 0 }))}
                    keyboardType="number-pad" returnKeyType="done"
                    style={g.inputField} selectTextOnFocus
                  />
                  <Text style={g.inputUnit}>{unit}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={save} disabled={saving} style={[g.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={g.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
          </Pressable>
          <View style={{ height: Platform.OS === "ios" ? 36 : 20 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const gs = StyleSheet.create({
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 36, height: 4, backgroundColor: "#e0ddd6", borderRadius: 99, alignSelf: "center", marginBottom: 20 },
});

const g = StyleSheet.create({
  row:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title:          { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  eyebrow:        { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#bbb", marginBottom: 2 },
  cancel:         { fontSize: 14, color: "#bbb", fontWeight: "600" },
  resetRow:       { marginBottom: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f4f2ed", alignItems: "center" },
  resetText:      { fontSize: 13, fontWeight: "600", color: "#999" },
  inputRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, gap: 10 },
  inputRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0ede6" },
  inputLabel:     { flex: 1, fontSize: 15, fontWeight: "500", color: "#333" },
  inputField:     { fontSize: 18, fontWeight: "700", color: "#1a1a1a", textAlign: "right", minWidth: 64 },
  inputUnit:      { fontSize: 13, color: "#bbb", fontWeight: "400", width: 32, textAlign: "right" },
  saveBtn:        { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  dot:            { width: 8, height: 8, borderRadius: 4 },
});

// ─── Edit Macros Sheet ────────────────────────────────────────────────────────
function EditMacrosSheet({ visible, log, onClose, onSave, token }) {
  const [macros, setMacros] = useState({
    calories: log?.totals?.calories ?? 0,
    protein:  log?.totals?.protein  ?? 0,
    carbs:    log?.totals?.carbs    ?? 0,
    fat:      log?.totals?.fat      ?? 0,
    fiber:    log?.totals?.fiber    ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim,    { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim,    { toValue: 500, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    setMacros({
      calories: log?.totals?.calories ?? 0,
      protein:  log?.totals?.protein  ?? 0,
      carbs:    log?.totals?.carbs    ?? 0,
      fat:      log?.totals?.fat      ?? 0,
      fiber:    log?.totals?.fiber    ?? 0,
    });
  }, [log]);

  if (!visible) return null;

  const FIELDS = [
    { key: "calories", label: "Calories", unit: "cal" },
    { key: "protein",  label: "Protein",  unit: "g"   },
    { key: "carbs",    label: "Carbs",    unit: "g"   },
    { key: "fat",      label: "Fat",      unit: "g"   },
    { key: "fiber",    label: "Fiber",    unit: "g"   },
  ];

  async function save() {
    setSaving(true);
    try {
      // Save to backend
      await fetch(`${BASE_URL}/api/meal-log?id=${log._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totals: macros }),
      });
      onSave(macros);
      onClose();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropAnim }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <Animated.View style={[gs.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={gs.handle} />
          <View style={g.row}>
            <View>
              <Text style={g.eyebrow}>{mealLabel(log?.mealType)}</Text>
              <Text style={g.title}>Edit macros</Text>
            </View>
            <Pressable onPress={onClose}><Text style={g.cancel}>Cancel</Text></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {FIELDS.map(({ key, label, unit }) => (
                <View key={key} style={g.inputRow}>
                  <Text style={g.inputLabel}>{label}</Text>
                  <TextInput
                    value={String(macros[key])}
                    onChangeText={(v) => setMacros((p) => ({ ...p, [key]: parseFloat(v) || 0 }))}
                    keyboardType="decimal-pad" returnKeyType="done"
                    style={g.inputField} selectTextOnFocus
                  />
                  <Text style={g.inputUnit}>{unit}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={save} disabled={saving} style={[g.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={g.saveBtnText}>{saving ? "Saving…" : "Save changes"}</Text>
          </Pressable>
          <View style={{ height: Platform.OS === "ios" ? 36 : 20 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Manual Log Sheet ─────────────────────────────────────────────────────────
function ManualLogSheet({ visible, onClose, onSuccess, token }) {
  const [foodName,  setFoodName]  = useState("");
  const [mealType,  setMealType]  = useState("snack");
  const [calories,  setCalories]  = useState("");
  const [protein,   setProtein]   = useState("");
  const [carbs,     setCarbs]     = useState("");
  const [fat,       setFat]       = useState("");
  const [fiber,     setFiber]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim,    { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim,    { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  function reset() {
    setFoodName(""); setMealType("snack");
    setCalories(""); setProtein(""); setCarbs(""); setFat(""); setFiber("");
    setError(null);
  }

  function handleClose() { reset(); onClose(); }

  async function submit() {
    if (!foodName.trim()) { setError("Enter a food name."); return; }
    if (!calories)        { setError("Calories is required."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/meal-log`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mealType,
          note: foodName.trim(),
          localDate: toLocalISO(),
          manualMacros: {
            calories: parseFloat(calories) || 0,
            protein:  parseFloat(protein)  || 0,
            carbs:    parseFloat(carbs)    || 0,
            fat:      parseFloat(fat)      || 0,
            fiber:    parseFloat(fiber)    || 0,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      onSuccess(json.data);
      handleClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropAnim }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Animated.View style={[gs.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={gs.handle} />
          <View style={g.row}>
            <Text style={g.title}>Add food manually</Text>
            <Pressable onPress={handleClose}><Text style={g.cancel}>Cancel</Text></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 480 }}>
            {/* Food name */}
            <Text style={ml.fieldLabel}>Food name</Text>
            <TextInput
              style={ml.input}
              placeholder="e.g. Grilled chicken breast"
              placeholderTextColor="#bbb"
              value={foodName}
              onChangeText={setFoodName}
            />

            {/* Meal type */}
            <Text style={ml.fieldLabel}>Meal type</Text>
            <View style={ml.mealRow}>
              {MEAL_TYPES.map(({ key, label }) => (
                <Pressable key={key} onPress={() => setMealType(key)}
                  style={[ml.mealBtn, mealType === key && ml.mealBtnActive]}>
                  <Text style={[ml.mealBtnText, mealType === key && { color: "#fff" }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Macros */}
            <Text style={ml.fieldLabel}>Macros</Text>
            <View style={ml.macroGrid}>
              {[
                { label: "Calories",    state: calories, set: setCalories, required: true },
                { label: "Protein (g)", state: protein,  set: setProtein  },
                { label: "Carbs (g)",   state: carbs,    set: setCarbs    },
                { label: "Fat (g)",     state: fat,      set: setFat      },
                { label: "Fiber (g)",   state: fiber,    set: setFiber    },
              ].map(({ label, state, set, required }) => (
                <View key={label} style={ml.macroField}>
                  <Text style={ml.macroLabel}>{label}{required ? " *" : ""}</Text>
                  <TextInput
                    style={ml.macroInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#bbb"
                    value={state}
                    onChangeText={set}
                  />
                </View>
              ))}
            </View>

            {error ? <Text style={ml.errorText}>{error}</Text> : null}
            <View style={{ height: 12 }} />
          </ScrollView>

          <Pressable onPress={submit} disabled={loading}
            style={[g.saveBtn, { opacity: loading ? 0.5 : 1, marginTop: 12 }]}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={g.saveBtnText}>Save meal</Text>}
          </Pressable>
          <View style={{ height: Platform.OS === "ios" ? 36 : 20 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEAL PHOTO STORAGE
// All photos live in <documentDirectory>/meal_photos/<mealId>.jpg
// documentDirectory is private to the app, persists across restarts on iOS.
// ═══════════════════════════════════════════════════════════════════════════════

const PHOTOS_DIR = `${FileSystem.documentDirectory}meal_photos/`;
const PHOTO_KEY  = (id) => `@mealPhoto/${id}`;

// Ensure the photos directory exists (creates it if not).
async function _ensureDir() {
  const { exists } = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!exists) await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}

/**
 * Save a base64 data URI as a JPEG in documentDirectory.
 * Returns the file:// path on success, null on failure.
 * Using writeAsStringAsync(encoding:"base64") — works for ANY picker URI type
 * (ph://, file://, etc.) because we operate on the base64 payload, not the URI.
 */
async function saveMealPhoto(b64DataUri, mealId) {
  if (!b64DataUri || !mealId) return null;
  try {
    const raw = b64DataUri.replace(/^data:image\/\w+;base64,/, "");
    if (raw.length < 200) return null;                    // guard against empty/broken data
    await _ensureDir();
    const path = `${PHOTOS_DIR}${mealId}.jpg`;
    await FileSystem.writeAsStringAsync(path, raw, { encoding: "base64" });
    const { exists, size } = await FileSystem.getInfoAsync(path);
    if (!exists || size === 0) return null;               // verify it actually landed
    await AsyncStorage.setItem(PHOTO_KEY(mealId), path);
    return path;
  } catch {
    return null;
  }
}

/**
 * Load the persisted photo path for a meal.
 * Returns the file:// path if the file exists on disk, null otherwise.
 * Cleans up stale AsyncStorage entries automatically.
 */
async function loadMealPhoto(mealId) {
  if (!mealId) return null;
  try {
    const path = await AsyncStorage.getItem(PHOTO_KEY(mealId));
    if (!path) return null;
    const { exists } = await FileSystem.getInfoAsync(path);
    if (!exists) {
      await AsyncStorage.removeItem(PHOTO_KEY(mealId));  // stale key — remove it
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

// Module-level — holds the raw base64 data URI from the last picker session.
// Lives OUTSIDE all components so it's immune to re-renders and stale closures.
let _pendingB64 = null;

// ─── Log Sheet ────────────────────────────────────────────────────────────────
function LogSheet({ visible, onClose, onSuccess, token }) {
  const [imageUri, setImageUri] = useState(null);
  const [mealType, setMealType] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Reset state every time the sheet opens
  useEffect(() => {
    if (visible) {
      setImageUri(null); setMealType(null); setError(null);
      _pendingB64 = null;
    }
  }, [visible]);

  async function pickImage() {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, quality: 0.75, base64: true,
      });
      if (!r.canceled && r.assets?.[0]) {
        _pendingB64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
        setImageUri(r.assets[0].uri);
      }
    } catch (e) { Alert.alert("Error", e.message); }
  }

  async function takePhoto() {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert("Permission needed", "Allow camera access in Settings."); return; }
      const r = await ImagePicker.launchCameraAsync({
        allowsEditing: true, quality: 0.75, base64: true,
      });
      if (!r.canceled && r.assets?.[0]) {
        _pendingB64 = `data:image/jpeg;base64,${r.assets[0].base64}`;
        setImageUri(r.assets[0].uri);
      }
    } catch (e) { Alert.alert("Error", e.message); }
  }

  function showOptions() {
    Alert.alert("Add photo", "Choose source", [
      { text: "Camera",  onPress: takePhoto },
      { text: "Library", onPress: pickImage },
      { text: "Cancel",  style: "cancel"   },
    ]);
  }

  async function submit() {
    if (!_pendingB64 || !mealType) return;
    setLoading(true); setError(null);
    const b64 = _pendingB64;                             // snapshot before any await
    try {
      // 1. Send to server
      const res  = await fetch(`${BASE_URL}/api/meal-log`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ image: b64, mealType, localDate: toLocalISO() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");

      // 2. Save photo to documentDirectory (awaited — so we have the real path)
      const mealId   = String(json.data._id);
      const photoPath = await saveMealPhoto(b64, mealId);

      // 3. Pass permanent path on the log object → MealCard shows it immediately
      //    AND it survives app restarts via AsyncStorage
      onSuccess({ ...json.data, _localPhotoUri: photoPath });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={g.row}>
        <Text style={g.title}>What did you eat?</Text>
        <Pressable onPress={onClose}><Text style={g.cancel}>Cancel</Text></Pressable>
      </View>
      <Pressable onPress={showOptions} style={lf.picker}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={lf.preview} />
            <Pressable onPress={() => { setImageUri(null); _pendingB64 = null; }} style={lf.removeBtn}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✕</Text>
            </Pressable>
          </>
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <View style={lf.camBox}><Text style={{ fontSize: 22, color: "#bbb" }}>+</Text></View>
            <Text style={lf.pickerLabel}>Tap to add a photo</Text>
            <Text style={lf.pickerSub}>Camera or library</Text>
          </View>
        )}
      </Pressable>
      <Text style={lf.fieldLabel}>Meal type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {MEAL_TYPES.map(({ key, label }) => (
          <Pressable key={key} onPress={() => setMealType(key)} style={[lf.mealBtn, mealType === key && lf.mealBtnActive]}>
            <Text style={[lf.mealBtnText, mealType === key && { color: "#fff" }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={lf.err}>{error}</Text>}
      <Pressable onPress={submit} disabled={!imageUri || !mealType || loading} style={[g.saveBtn, { opacity: !imageUri || !mealType || loading ? 0.35 : 1 }]}>
        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={g.saveBtnText}>Analysing with AI…</Text>
          </View>
        ) : (
          <Text style={g.saveBtnText}>Analyse & log</Text>
        )}
      </Pressable>
      <View style={{ height: Platform.OS === "ios" ? 36 : 20 }} />
    </BottomSheet>
  );
}

const lf = StyleSheet.create({
  picker:      { height: 148, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#e0ddd6", backgroundColor: "#f8f6f2", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 },
  preview:     { width: "100%", height: "100%" },
  removeBtn:   { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 99, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  camBox:      { width: 48, height: 48, borderRadius: 14, backgroundColor: "#ece9e2", alignItems: "center", justifyContent: "center" },
  pickerLabel: { fontSize: 14, fontWeight: "600", color: "#bbb" },
  pickerSub:   { fontSize: 12, color: "#ccc" },
  fieldLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#bbb", marginBottom: 10 },
  mealBtn:      { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff", alignItems: "center" },
  mealBtnActive:{ backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mealBtnText:  { fontSize: 12, fontWeight: "600", color: "#888" },
  err:         { fontSize: 13, color: "#ef4444", fontWeight: "600", marginBottom: 12 },
});

// ─── Result Sheet ─────────────────────────────────────────────────────────────
function ResultSheet({ visible, log, onClose }) {
  if (!log) return null;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <View>
          <Text style={g.eyebrow}>{mealLabel(log.mealType)}</Text>
          <Text style={{ fontSize: 30, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1.5 }}>
            {fmt(log.totals?.calories ?? 0)}
            <Text style={{ fontSize: 14, fontWeight: "400", color: "#bbb" }}> cal</Text>
          </Text>
        </View>
        <View style={rf.badge}><Text style={rf.badgeText}>Logged</Text></View>
      </View>
      <View style={rf.macroRow}>
        {[
          { label: "Protein", value: log.totals?.protein, color: "#7c3aed" },
          { label: "Carbs",   value: log.totals?.carbs,   color: "#6366f1" },
          { label: "Fat",     value: log.totals?.fat,     color: "#888"    },
        ].map((m) => (
          <View key={m.label} style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: m.color }}>
              {fmt(m.value ?? 0)}<Text style={{ fontSize: 10, color: "#bbb" }}>g</Text>
            </Text>
            <Text style={rf.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[g.eyebrow, { marginBottom: 10 }]}>Detected foods</Text>
      <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
        {log.foods.map((f, i) => (
          <View key={i} style={rf.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={rf.foodName}>{f.name}</Text>
              <Text style={rf.foodPortion}>{f.portion}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={rf.foodCal}>{fmt(f.macros?.calories ?? 0)}</Text>
              <Text style={rf.foodCalUnit}>cal</Text>
            </View>
            {f.confidence < 0.7 && <View style={rf.estBadge}><Text style={rf.estText}>est</Text></View>}
          </View>
        ))}
      </ScrollView>
      {log.aiNotes && <Text style={rf.notes}>{log.aiNotes}</Text>}
      <Pressable onPress={onClose} style={[g.saveBtn, { marginTop: 16 }]}>
        <Text style={g.saveBtnText}>Done</Text>
      </Pressable>
      <View style={{ height: Platform.OS === "ios" ? 36 : 20 }} />
    </BottomSheet>
  );
}

const rf = StyleSheet.create({
  badge:      { backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText:  { fontSize: 12, fontWeight: "700", color: "#22c55e" },
  macroRow:   { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#f4f2ed", borderRadius: 18, paddingVertical: 18, marginBottom: 20 },
  macroLabel: { fontSize: 10, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3 },
  foodRow:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e8e5de", padding: 12, marginBottom: 7, gap: 10 },
  foodName:   { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  foodPortion:{ fontSize: 11, color: "#bbb", marginTop: 2 },
  foodCal:    { fontSize: 14, fontWeight: "800", color: "#1a1a1a" },
  foodCalUnit:{ fontSize: 10, color: "#bbb" },
  estBadge:   { backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  estText:    { fontSize: 9, fontWeight: "700", color: "#f59e0b" },
  notes:      { fontSize: 12, color: "#aaa", lineHeight: 20, marginTop: 12, fontStyle: "italic" },
});

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ log, index, onDelete, onEdit, token }) {
  const [menuVisible,   setMenuVisible]   = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [totals,        setTotals]        = useState(log.totals);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Resolve photo on mount and when log changes.
  // Priority: _localPhotoUri on the log object (just logged this session)
  //        → AsyncStorage + file-existence check (persisted across restarts)
  useEffect(() => {
    const id = String(log._id);
    async function resolve() {
      // Fast path: photo was just logged and path is already on the object
      if (log._localPhotoUri) {
        const { exists } = await FileSystem.getInfoAsync(log._localPhotoUri)
          .catch(() => ({ exists: false }));
        if (exists) { setPhotoUri(log._localPhotoUri); return; }
      }
      // Slow path: load from persisted storage (after app restart)
      const path = await loadMealPhoto(id);
      if (path) setPhotoUri(path);
    }
    resolve();
  }, [log._id, log._localPhotoUri]);

  function openMenu() {
    setMenuVisible(true);
    Animated.spring(menuAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  }

  function closeMenu() {
    setConfirmDelete(false);
    Animated.timing(menuAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setMenuVisible(false));
  }

  function handleEdit() {
    closeMenu();
    setTimeout(() => setEditOpen(true), 200);
  }

  // ── FIX: stringify _id so it always matches the tombstone string ──
  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    closeMenu();
    setTimeout(() => onDelete(String(log._id)), 200);
  }

  const menuScale = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });

  return (
    <>
      <View style={mc.card}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, gap: 12 }}>
          {/* Food photo thumbnail */}
          <View style={mc.foodIconWrap}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={mc.foodPhoto} />
              : null}
          </View>

          {/* Food info — names primary, type secondary */}
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text style={mc.foods} numberOfLines={1}>{log.foods.map((f) => f.name).join(", ")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={mc.typeTag}>
                <Text style={mc.typeTagText}>{mealLabel(log.mealType)}</Text>
              </View>
              {index === 0 && <View style={mc.latestBadge}><Text style={mc.latestText}>Latest</Text></View>}
            </View>
          </View>

          {/* Calories + protein */}
          <View style={{ alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
            <Text style={mc.cal}>{fmt(totals?.calories ?? 0)}<Text style={mc.calUnit}> cal</Text></Text>
            <Text style={mc.prot}>{fmt(totals?.protein ?? 0)}g protein</Text>
          </View>

          <Pressable onPress={openMenu} style={mc.dotBtn} hitSlop={8}>
            <View style={mc.dot} /><View style={mc.dot} /><View style={mc.dot} />
          </Pressable>
        </View>
      </View>

      {menuVisible && (
        <Modal transparent animationType="none" onRequestClose={closeMenu}>
          <Pressable style={mc.menuOverlay} onPress={closeMenu}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View style={[mc.menuPopup, { opacity: menuAnim, transform: [{ scale: menuScale }] }]}>
                <Pressable onPress={handleEdit} style={mc.menuItem}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                  <Text style={mc.menuItemText}>Edit macros</Text>
                </Pressable>
                <View style={mc.menuDivider} />
                {confirmDelete ? (
                  <View style={mc.confirmBlock}>
                    <Text style={mc.confirmTitle}>Delete this meal?</Text>
                    <Text style={mc.confirmSub}>This can't be undone.</Text>
                    <View style={mc.confirmRow}>
                      <Pressable onPress={() => setConfirmDelete(false)} style={mc.confirmCancelBtn}>
                        <Text style={mc.confirmCancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleDelete} style={mc.confirmDeleteBtn}>
                        <Text style={mc.confirmDeleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={handleDelete} style={mc.menuItem}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                    <Text style={[mc.menuItemText, { color: "#f43f5e" }]}>Delete meal</Text>
                  </Pressable>
                )}
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <EditMacrosSheet
        visible={editOpen}
        log={{ ...log, totals }}
        onClose={() => setEditOpen(false)}
        onSave={(m) => { setTotals(m); onEdit?.(log._id, m); }}
        token={token}
      />
    </>
  );
}

const mc = StyleSheet.create({
  card:              { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  foodIconWrap:      { width: 54, height: 54, borderRadius: 15, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  foodPhoto:         { width: 54, height: 54 },
  foods:             { fontSize: 15, fontWeight: "700", color: "#0e0e0e", letterSpacing: -0.2 },
  typeTag:           { backgroundColor: "#f4f2ed", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText:       { fontSize: 11, fontWeight: "600", color: "#888" },
  latestBadge:       { backgroundColor: "rgba(232,56,13,0.1)", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 },
  latestText:        { fontSize: 9, fontWeight: "700", color: "#e8380d" },
  cal:               { fontSize: 15, fontWeight: "800", color: "#0e0e0e" },
  calUnit:           { fontSize: 11, fontWeight: "400", color: "#bbb" },
  prot:              { fontSize: 12, color: "#888", fontWeight: "700" },
  dotBtn:            { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center", gap: 3 },
  dot:               { width: 3.5, height: 3.5, borderRadius: 99, backgroundColor: "#888" },
  menuOverlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  menuPopup:         { backgroundColor: "#fff", borderRadius: 16, width: 220, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 16, overflow: "hidden" },
  menuItem:          { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 18 },
  menuDivider:       { height: 1, backgroundColor: "#f0ede6", marginHorizontal: 12 },
  menuItemIcon:      { fontSize: 16, color: "#1a1a1a", width: 20, textAlign: "center" },
  menuItemText:      { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  confirmBlock:      { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, gap: 4 },
  confirmTitle:      { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  confirmSub:        { fontSize: 12, color: "#aaa", marginBottom: 12 },
  confirmRow:        { flexDirection: "row", gap: 8 },
  confirmCancelBtn:  { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f4f2ed", alignItems: "center" },
  confirmCancelText: { fontSize: 13, fontWeight: "600", color: "#555" },
  confirmDeleteBtn:  { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(244,63,94,0.1)", alignItems: "center" },
  confirmDeleteText: { fontSize: 13, fontWeight: "700", color: "#f43f5e" },
});

// ─── Week Strip ───────────────────────────────────────────────────────────────
const DAY_ABBR  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function MacroWeekStrip({ selDate, onSelect, weekCalories = {}, calorieGoal = 2000 }) {
  const colRefs  = useRef({});

  // Build Mon–Sun of the current week
  const days = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMon = dow === 0 ? 6 : dow - 1;
    const mon = new Date(today);
    mon.setDate(today.getDate() - diffToMon);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i); return toLocalISO(d);
    });
  }, []);

  const R = 18; // radius of progress ring
  const CIRC = 2 * Math.PI * R;

  return (
    <View style={ws.container}>
      {days.map((date) => {
        const d       = new Date(date + "T12:00:00");
        const abbr    = DAY_ABBR[d.getDay()];
        const num     = d.getDate();
        const isSel   = date === selDate;
        const isToday = date === todayISO();
        const cal     = weekCalories[date] ?? 0;
        const pct     = calorieGoal > 0 ? Math.min(cal / calorieGoal, 1) : 0;
        const dash    = pct * CIRC;
        const ringColor = isSel ? "rgba(255,255,255,0.7)" : "#e8380d";
        const trackColor = isSel ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)";

        return (
          <Pressable key={date} style={ws.col} onLayout={(e) => { colRefs.current[date] = e.nativeEvent.layout; }} onPress={() => onSelect(date)}>
            <Text style={[ws.abbr, isSel && ws.abbrSel]}>{abbr}</Text>
            <View style={ws.circleWrap}>
              {/* Calorie ring SVG */}
              <Svg width={40} height={40} style={{ position: "absolute" }}>
                <Circle cx={20} cy={20} r={R} stroke={trackColor} strokeWidth={2.5} fill="none" />
                {pct > 0 && (
                  <Circle
                    cx={20} cy={20} r={R}
                    stroke={ringColor}
                    strokeWidth={2.5}
                    fill="none"
                    strokeDasharray={`${dash} ${CIRC - dash}`}
                    strokeDashoffset={CIRC / 4}
                    strokeLinecap="round"
                  />
                )}
              </Svg>
              <View style={[ws.dayBubble, isSel && ws.dayBubbleSel]}>
                <Text style={[ws.num, isSel && ws.numSel]}>{num}</Text>
              </View>
              {isToday && !isSel && cal === 0 && <View style={ws.dot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const ws = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  col:        { flex: 1, alignItems: "center", gap: 5, paddingVertical: 2 },
  abbr:       { fontSize: 11, fontWeight: "600", color: "rgba(0,0,0,0.3)", letterSpacing: 0.2 },
  abbrSel:    { color: "#e8380d", fontWeight: "800" },
  circleWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  dayBubble:  { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dayBubbleSel: { backgroundColor: "#e8380d" },
  num:        { fontSize: 13, fontWeight: "700", color: "#0e0e0e" },
  numSel:     { color: "#fff" },
  dot:        { position: "absolute", bottom: -1, width: 5, height: 5, borderRadius: 3, backgroundColor: "#e8380d" },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const { token, userName } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();

  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showLog,    setShowLog]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [selDate,    setSelDate]    = useState(todayISO());
  const [goals,      setGoals]      = useState(DEFAULT_GOALS);
  const [calculated, setCalculated] = useState(null);
  const [hasCustom,  setHasCustom]  = useState(false);
  const [goalsLoad,  setGoalsLoad]  = useState(true);
  const [showGoals,  setShowGoals]  = useState(false);
  const [showManual,    setShowManual]    = useState(false);
  const [weekCalories,  setWeekCalories]  = useState({});

  // Fetch nutrition goals
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/nutrition-goals`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setGoals(json.data.goals);
          setCalculated(json.data.calculated);
          setHasCustom(json.data.hasCustom);
        }
      })
      .catch(() => {})
      .finally(() => setGoalsLoad(false));
  }, [token]);

  // ── Fetch meal logs from server ──
  const fetchLogs = useCallback(async (date) => {
    setLoading(true);

    if (!token) { setLoading(false); return; }
    try {
      const res  = await fetch(`${BASE_URL}/api/meal-log?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data);
        // Track calories per date for week strip rings
        const cal = json.data.reduce((s, l) => s + (l.totals?.calories ?? 0), 0);
        setWeekCalories((prev) => ({ ...prev, [date]: cal }));
      }
    } catch (e) { console.error("fetchLogs error:", e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchLogs(selDate); }, [token, selDate, fetchLogs]);

  // Pre-fetch calorie totals for all 7 days so week rings show without clicking
  useEffect(() => {
    if (!token) return;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(toLocalISO(d));
    }
    days.forEach((date) => {
      fetch(`${BASE_URL}/api/meal-log?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            const cal = json.data.reduce((s, l) => s + (l.totals?.calories ?? 0), 0);
            setWeekCalories((prev) => ({ ...prev, [date]: cal }));
          }
        })
        .catch(() => {});
    });
  }, [token]);

  function handleSuccess(newLog) {
    setShowLog(false);
    setResult(newLog);
    setShowResult(true);
    const logDate = newLog.localDate || toLocalISO(new Date(newLog.date));
    if (logDate === selDate) {
      setLogs((prev) => {
        const next = [newLog, ...prev];
        const cal  = next.reduce((s, l) => s + (l.totals?.calories ?? 0), 0);
        setWeekCalories((w) => ({ ...w, [logDate]: cal }));
        return next;
      });
    }
  }

  // ── Delete meal log ──
  async function handleDelete(id) {
    // Optimistically remove from UI
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => String(l._id) !== id));
    if (token) {
      try {
        const res = await fetch(`${BASE_URL}/api/meal-log?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Backend failed — restore the item
          setLogs(snapshot);
          Alert.alert("Error", "Could not delete meal. Please try again.");
        }
      } catch (e) {
        // Network error — restore the item
        setLogs(snapshot);
        Alert.alert("Error", "Could not delete meal. Please try again.");
      }
    }
  }

  function handleEdit(id, newMacros) {
    setLogs((prev) => prev.map((l) => (l._id === id ? { ...l, totals: newMacros } : l)));
  }

  function shiftDate(days) {
    const [y, m, d] = selDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const iso = toLocalISO(date);
    if (iso <= todayISO()) setSelDate(iso);
  }

  function dateLabel() {
    if (selDate === todayISO()) return "Today";
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (selDate === toLocalISO(yest)) return "Yesterday";
    return new Date(selDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
//today's i
  // DEMO_MODE overrides — flip MACRO_DEMO_MODE to false for live usage
  const displayLogs  = MACRO_DEMO_MODE ? DEMO_MACRO_LOGS : logs;
  const displayGoals = MACRO_DEMO_MODE ? DEMO_GOALS      : goals;

  const totals  = sumMacros(displayLogs);
  const isToday = selDate === todayISO();
  const busy    = MACRO_DEMO_MODE ? false : (loading || goalsLoad);
  const calPct  = goals.calories > 0 ? Math.min(totals.calories / goals.calories, 1) : 0;
  const calStatus =
    calPct >= 0.9 ? { text: "Near limit",  color: "#f87171",               bg: "rgba(248,113,113,0.12)"  } :
    calPct >= 0.6 ? { text: "On track",    color: "#a78bfa",               bg: "rgba(167,139,250,0.12)"  } :
                    { text: "Keep eating", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.06)" };

  return (
    <PremiumGate isUserPremium={isPremium} subChecking={subLoading} featureName="Macro Scanner">
      <SafeAreaView style={n.screen} edges={["top"]}>
        <View style={n.header}>
        <View>
          <Text style={n.greeting}>Good {getGreeting()}{userName ? `, ${userName}` : ""}</Text>
          <Text style={n.title}>Nutrition</Text>
        </View>
        <View style={n.avatar}><AvatarButton /></View>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: "#ffffff" }} contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 18, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Week strip — always visible */}
        <MacroWeekStrip selDate={selDate} onSelect={setSelDate} weekCalories={weekCalories} calorieGoal={displayGoals.calories} />

        {busy ? (
          <>
            {/* Hero card skeleton */}
            <View style={n.heroCard}>
              <View style={n.dateNav}>
                <View style={{ width: 90, height: 13, borderRadius: 7, backgroundColor: "rgba(0,0,0,0.07)" }} />
                <View style={{ width: 60, height: 26, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.05)" }} />
              </View>
              <View style={n.heroBody}>
                <CalorieArc consumed={0} goal={displayGoals.calories || DEFAULT_GOALS.calories} />
                <View style={{ flex: 1, gap: 10 }}>
                  {["Protein","Carbs","Fat","Fiber"].map((label) => (
                    <View key={label}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <View style={{ width: 44, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.07)" }} />
                        <View style={{ width: 28, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.05)" }} />
                      </View>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.05)" }} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
            {/* meal card placeholders */}
            <Skeleton height={72} />
            <Skeleton height={72} />
          </>
        ) : (
          <>
            {/* Hero card */}
            <View style={n.heroCard}>

              {/* Date label + Goals button */}
              <View style={n.dateNav}>
                <Text style={n.dateLabel}>{dateLabel()}</Text>
                <Pressable onPress={() => setShowGoals(true)} style={n.editGoalsBtn}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#888" strokeWidth={2}/>
                      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#888" strokeWidth={2}/>
                    </Svg>
                    <Text style={n.editGoalsBtnText}>{hasCustom ? "Custom" : "Goals"}</Text>
                  </View>
                </Pressable>
              </View>

              {/* Calorie arc + macro bars */}
              <View style={n.heroBody}>
                <CalorieArc consumed={totals.calories} goal={displayGoals.calories} />
                <View style={{ flex: 1 }}>
                  <MacroBar label="Protein" value={round1(totals.protein)} goal={displayGoals.protein} delay={100} />
                  <MacroBar label="Carbs"   value={round1(totals.carbs)}   goal={displayGoals.carbs}   delay={200} />
                  <MacroBar label="Fat"     value={round1(totals.fat)}     goal={displayGoals.fat}     delay={300} />
                  <MacroBar label="Fiber"   value={round1(totals.fiber)}   goal={displayGoals.fiber}   delay={400} />
                </View>
              </View>

            </View>

            {/* Meals */}
            {displayLogs.length > 0 && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
                  <Text style={n.sectionLabel}>Meals logged</Text>
                  <Text style={n.sectionCount}>{displayLogs.length} meal{displayLogs.length !== 1 ? "s" : ""}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {displayLogs.map((log, i) => (
                    <MealCard key={log._id} log={log} index={i} onDelete={handleDelete} onEdit={handleEdit} token={token} />
                  ))}
                </View>
              </View>
            )}

            {/* Empty state */}
            {displayLogs.length === 0 && (
              <View style={n.emptyCard}>
                <Text style={n.emptyTitle}>{isToday ? "Nothing logged yet" : "No meals this day"}</Text>
                <Text style={n.emptyDesc}>
                  {isToday ? "Photograph your meal and AI will calculate the macros." : "Nothing was tracked on this date."}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {isToday && (
        <View style={n.stickyBar}>
          <Pressable onPress={() => setShowManual(true)} style={n.manualBtn}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text style={n.manualBtnText}>Add manually</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setShowLog(true)} style={n.logBtn}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              {/* scanner viewfinder with apple inside */}
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                {/* corner brackets */}
                <Path d="M3 9V5a2 2 0 0 1 2-2h4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                <Path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                <Path d="M3 15v4a2 2 0 0 0 2 2h4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                <Path d="M21 15v4a2 2 0 0 1-2 2h-4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                {/* apple stem */}
                <Path d="M12 7 C12 7 12.5 5.5 14 5.5" stroke="#fff" strokeWidth={1.3} strokeLinecap="round"/>
                {/* apple leaf */}
                <Path d="M12.5 6 C13 5 15 4.5 15 6 C14 6.2 12.5 6 12.5 6 Z" fill="#fff" opacity="0.9"/>
                {/* apple body — classic two-lobe shape */}
                <Path d="M9 10 C7.5 10 7 11.5 7 13 C7 15.5 8.5 18.5 10 18.5 C10.8 18.5 11 18 12 18 C13 18 13.2 18.5 14 18.5 C15.5 18.5 17 15.5 17 13 C17 11.5 16.5 10 15 10 C14.2 10 13.5 10.5 12 10.5 C10.5 10.5 9.8 10 9 10 Z" fill="#fff" opacity="0.95"/>
              </Svg>
              <Text style={n.logBtnText}>Scan your food</Text>
            </View>
          </Pressable>
        </View>
      )}

      <LogSheet visible={showLog} onClose={() => setShowLog(false)} onSuccess={handleSuccess} token={token} />
      <ManualLogSheet visible={showManual} onClose={() => setShowManual(false)} onSuccess={handleSuccess} token={token} />
      <ResultSheet visible={showResult} log={result} onClose={() => { setShowResult(false); setResult(null); }} />
      <GoalsSheet
        visible={showGoals} goals={goals} calculated={calculated} hasCustom={hasCustom} token={token}
        onClose={() => setShowGoals(false)}
        onSaved={(newGoals, custom) => { setGoals(newGoals); setHasCustom(custom); }}
      />
      </SafeAreaView>
    </PremiumGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────. View style={mc.foodIconWrap
const n = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: "#ffffff" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)", backgroundColor: "transparent" },
  greeting:         { fontSize: 12, color: "#888", fontWeight: "500", marginBottom: 2 },
  title:            { fontSize: 26, fontWeight: "800", color: "#0e0e0e", letterSpacing: -1 },
  avatar:           { flexDirection: "row", alignItems: "center", gap: 10 },
  dateNav:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  dateLabel:        { fontSize: 15, fontWeight: "700", color: "#0e0e0e" },
  heroCard:         { backgroundColor: "#ffffff", borderRadius: 28, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", padding: 18, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  editGoalsBtn:     { backgroundColor: "#f4f2ed", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  editGoalsBtnText: { fontSize: 11, fontWeight: "700", color: "#888" },
  heroBody:         { flexDirection: "row", alignItems: "center", gap: 12 },
  stickyBar:        { flexDirection: "row", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, backgroundColor: "#ffffff", gap: 10 },
  logBtn:           { flex: 1, backgroundColor: "#e8380d", borderRadius: 22, paddingVertical: 16, alignItems: "center", justifyContent: "center", shadowColor: "#e8380d", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  logBtnText:       { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.1 },
  manualBtn:        { flex: 1, borderRadius: 22, paddingVertical: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "#fff" },
  manualBtnText:    { fontSize: 15, fontWeight: "600", color: "#0e0e0e", letterSpacing: 0.1 },
  sectionLabel:     { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa" },
  sectionCount:     { fontSize: 11, fontWeight: "600", color: "#ccc" },
  emptyCard:        { backgroundColor: "#fff", borderRadius: 28, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", padding: 36, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  emptyTitle:       { fontSize: 16, fontWeight: "700", color: "#0e0e0e", marginBottom: 6, textAlign: "center" },
  emptyDesc:        { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center" },
});

const ml = StyleSheet.create({
  fieldLabel:   { fontSize: 12, fontWeight: "700", color: "#888", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input:        { backgroundColor: "#f4f2ed", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: "#1a1a1a", borderWidth: 1, borderColor: "#e8e5de" },
  mealRow:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealBtn:      { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff", alignItems: "center" },
  mealBtnActive:{ backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mealBtnText:  { fontSize: 12, fontWeight: "600", color: "#888" },
  macroGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  macroField:   { width: "47%", gap: 6 },
  macroLabel:   { fontSize: 11, fontWeight: "600", color: "#999" },
  macroInput:   { backgroundColor: "#f4f2ed", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: "#1a1a1a", borderWidth: 1, borderColor: "#e8e5de" },
  errorText:    { fontSize: 13, color: "#f43f5e", fontWeight: "500", marginTop: 12, textAlign: "center" },
});