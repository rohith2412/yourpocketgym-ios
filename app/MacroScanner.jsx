import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PremiumGate from "@/components/PremiumGate";
import { useSubscription } from "@/src/hooks/useSubscription";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import Svg, { Circle, G } from "react-native-svg";

const AnimArc = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const BASE_URL = "https://yourpocketgym.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  return ({ breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snack:"Snack" }[type] ?? type);
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

const DEFAULT_GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70, fiber: 30 };
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch",     label: "Lunch"     },
  { key: "dinner",    label: "Dinner"    },
  { key: "snack",     label: "Snack"     },
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
    backgroundColor: "#fafaf8",
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
  const SIZE = 196, CX = 98, R = 80, SW = 16;
  const CIRC = 2 * Math.PI * R;

  const pct  = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over = pct >= 1;
  const warn = pct >= 0.9;

  const fillAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);

  useEffect(() => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, { toValue: pct, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);

  const dashOffset  = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const dotRotation = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 360] });
  const haloR       = pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [12, 18] });
  const arcColor    = over ? "#f87171" : warn ? "#fbbf24" : "#c8d0dc";
  const ARC_TRANSFORM = `rotate(-90, ${CX}, ${CX})`;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Circle cx={CX} cy={CX} r={R} fill="none" stroke="#1c1c1e" strokeWidth={SW} />
        {consumed > 0 && (
          <AnimArc
            cx={CX} cy={CX} r={R} fill="none"
            stroke={arcColor} strokeWidth={SW}
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform={ARC_TRANSFORM}
          />
        )}
        {consumed > 0 && (
          <AnimatedG rotation={dotRotation} origin={`${CX}, ${CX}`}>
            <AnimArc cx={CX} cy={CX - R} r={haloR} fill="rgba(255,255,255,0.12)" />
            <Circle  cx={CX} cy={CX - R} r={8}     fill="rgba(255,255,255,0.32)" />
            <Circle  cx={CX} cy={CX - R} r={4}     fill="#ffffff" />
          </AnimatedG>
        )}
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={arc.num}>{fmt(consumed)}</Text>
        <Text style={arc.unit}>KCAL</Text>
      </View>
    </View>
  );
}

const arc = StyleSheet.create({
  num:  { fontSize: 32, fontWeight: "900", color: "#ffffff", letterSpacing: -1.5, lineHeight: 36 },
  unit: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "700", letterSpacing: 1.4, marginTop: 3 },
});

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, delay = 0, dark = false }) {
  const rawPct = goal > 0 ? value / goal : 0;
  const pct    = Math.min(rawPct, 1);
  const over   = rawPct >= 1;

  const animW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animW, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
  }, [pct]);

  const widthPct = animW.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const barColor = over ? "#f87171" : dark ? "#c8d0dc" : "#9ca3af";
  const labelCol = dark ? "rgba(255,255,255,0.45)" : "#555";
  const valCol   = over ? "#f87171" : dark ? "#ffffff" : "#1a1a1a";
  const goalCol  = dark ? "rgba(255,255,255,0.2)" : "#aaa";
  const trackCol = dark ? "rgba(255,255,255,0.07)" : "#f0ede6";

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: barColor }} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: labelCol }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 11, color: goalCol }}>
          <Text style={{ fontWeight: "800", color: valCol }}>{round1(value)}</Text>
          <Text>/{goal}g</Text>
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: trackCol, borderRadius: 99, overflow: "hidden" }}>
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
    backgroundColor: "#fafaf8",
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

  function save() {
    setSaving(true);
    try {
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

// ─── Log Sheet ────────────────────────────────────────────────────────────────
function LogSheet({ visible, onClose, onSuccess, token }) {
  const [imageUri, setImageUri] = useState(null);
  const [base64, setBase64]     = useState(null);
  const [mealType, setMealType] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (visible) { setImageUri(null); setBase64(null); setMealType(null); setError(null); }
  }, [visible]);

  async function pickImage() {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.7, base64: true });
      if (!r.canceled && r.assets[0]) { setImageUri(r.assets[0].uri); setBase64(`data:image/jpeg;base64,${r.assets[0].base64}`); }
    } catch (e) { Alert.alert("Error", e.message); }
  }

  async function takePhoto() {
    try {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) { Alert.alert("Permission needed", "Please allow camera access in Settings."); return; }
      const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
      if (!r.canceled && r.assets[0]) { setImageUri(r.assets[0].uri); setBase64(`data:image/jpeg;base64,${r.assets[0].base64}`); }
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
    if (!base64 || !mealType) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/meal-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: base64, mealType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");
      onSuccess(json.data);
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
            <Pressable onPress={() => { setImageUri(null); setBase64(null); }} style={lf.removeBtn}>
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
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {MEAL_TYPES.map((t) => (
          <Pressable key={t.key} onPress={() => setMealType(t.key)} style={[lf.mealBtn, mealType === t.key && lf.mealBtnActive]}>
            <Text style={[lf.mealBtnText, mealType === t.key && { color: "#fff" }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={lf.err}>{error}</Text>}
      <Pressable onPress={submit} disabled={!base64 || !mealType || loading} style={[g.saveBtn, { opacity: !base64 || !mealType || loading ? 0.35 : 1 }]}>
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
  mealBtn:     { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fff", alignItems: "center" },
  mealBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mealBtnText: { fontSize: 11, fontWeight: "700", color: "#888" },
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
  const menuAnim = useRef(new Animated.Value(0)).current;

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
        <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 14 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <Text style={mc.type}>{mealLabel(log.mealType)}</Text>
              {index === 0 && <View style={mc.latestBadge}><Text style={mc.latestText}>Latest</Text></View>}
            </View>
            <Text style={mc.foods} numberOfLines={1}>{log.foods.map((f) => f.name).join(", ")}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={mc.cal}>{fmt(totals?.calories ?? 0)}<Text style={mc.calUnit}> cal</Text></Text>
              <Text style={mc.prot}>{fmt(totals?.protein ?? 0)}g protein</Text>
            </View>
            <Pressable onPress={openMenu} style={mc.dotBtn} hitSlop={8}>
              <View style={mc.dot} /><View style={mc.dot} /><View style={mc.dot} />
            </Pressable>
          </View>
        </View>
      </View>

      {menuVisible && (
        <Modal transparent animationType="none" onRequestClose={closeMenu}>
          <Pressable style={mc.menuOverlay} onPress={closeMenu}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View style={[mc.menuPopup, { opacity: menuAnim, transform: [{ scale: menuScale }] }]}>
                <Pressable onPress={handleEdit} style={mc.menuItem}>
                  <Text style={mc.menuItemIcon}>✎</Text>
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
                    <Text style={[mc.menuItemIcon, { color: "#f43f5e" }]}>✕</Text>
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
  card:              { flexDirection: "column", backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#e8e5de", overflow: "hidden", marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  type:              { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  latestBadge:       { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  latestText:        { fontSize: 9, fontWeight: "700", color: "#666" },
  foods:             { fontSize: 12, color: "#aaa" },
  cal:               { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
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

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const { token, userName } = useAuth();
  const { isPremium } = useSubscription();

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
      }
    } catch (e) { console.error("fetchLogs error:", e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchLogs(selDate); }, [token, selDate, fetchLogs]);

  function handleSuccess(newLog) {
    setShowLog(false);
    setResult(newLog);
    setShowResult(true);
    if (toLocalISO(new Date(newLog.date)) === selDate)
      setLogs((prev) => [newLog, ...prev]);
  }

  // ── Delete meal log ──
  async function handleDelete(id) {
    setLogs((prev) => prev.filter((l) => String(l._id) !== id));
    if (token) {
      try {
        await fetch(`${BASE_URL}/api/meal-log/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) { console.warn("Server delete failed:", e); }
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

  const totals  = sumMacros(logs);
  const isToday = selDate === todayISO();
  const busy    = loading || goalsLoad;
  const calPct  = goals.calories > 0 ? Math.min(totals.calories / goals.calories, 1) : 0;
  const calStatus =
    calPct >= 0.9 ? { text: "Near limit",  color: "#f87171",               bg: "rgba(248,113,113,0.12)"  } :
    calPct >= 0.6 ? { text: "On track",    color: "#a78bfa",               bg: "rgba(167,139,250,0.12)"  } :
                    { text: "Keep eating", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.06)" };

  return (
    <PremiumGate isUserPremium={isPremium} featureName="Macro Scanner">
      <SafeAreaView style={n.screen} edges={["top"]}>
        <View style={n.header}>
        <View>
          <Text style={n.greeting}>Good {getGreeting()}{userName ? `, ${userName}` : ""}</Text>
          <Text style={n.title}>Nutrition</Text>
        </View>
        <View style={n.avatar}><AvatarButton /></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Date nav */}
        <View style={n.dateNav}>
          <Pressable onPress={() => shiftDate(-1)} style={n.dateBtn}><Text style={n.dateBtnText}>‹</Text></Pressable>
          <Text style={n.dateLabel}>{dateLabel()}</Text>
          <Pressable onPress={() => shiftDate(1)} disabled={isToday} style={[n.dateBtn, isToday && { opacity: 0.25 }]}>
            <Text style={n.dateBtnText}>›</Text>
          </Pressable>
        </View>

        {busy ? (
          <><Skeleton height={300} /><Skeleton height={80} /><Skeleton height={80} /></>
        ) : (
          <>
            {/* Hero card */}
            <View style={n.heroCard}>
              <View style={n.heroCardTop}>
                <View>
                  <Text style={n.heroEyebrow}>{isToday ? "Today's intake" : dateLabel()}</Text>
                  <View style={[n.statusPill, { backgroundColor: calStatus.bg }]}>
                    <View style={[n.statusDot, { backgroundColor: calStatus.color }]} />
                    <Text style={[n.statusText, { color: calStatus.color }]}>{calStatus.text}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowGoals(true)} style={n.editGoalsBtn}>
                  <Text style={n.editGoalsBtnText}>{hasCustom ? "Custom goals" : "Edit goals"}</Text>
                </Pressable>
              </View>
              <View style={n.heroBody}>
                <CalorieArc consumed={totals.calories} goal={goals.calories} />
                <View style={{ flex: 1 }}>
                  <MacroBar label="Protein" value={round1(totals.protein)} goal={goals.protein} delay={100} dark />
                  <MacroBar label="Carbs"   value={round1(totals.carbs)}   goal={goals.carbs}   delay={200} dark />
                  <MacroBar label="Fat"     value={round1(totals.fat)}     goal={goals.fat}     delay={300} dark />
                  <MacroBar label="Fiber"   value={round1(totals.fiber)}   goal={goals.fiber}   delay={400} dark />
                </View>
              </View>
            </View>

            {/* Meals */}
            {logs.length > 0 && (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={n.sectionLabel}>Meals logged</Text>
                  <Text style={n.sectionCount}>{logs.length} meal{logs.length !== 1 ? "s" : ""}</Text>
                </View>
                {logs.map((log, i) => (
                  <MealCard key={log._id} log={log} index={i} onDelete={handleDelete} onEdit={handleEdit} token={token} />
                ))}
              </>
            )}

            {/* Empty state */}
            {logs.length === 0 && (
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
          <Pressable onPress={() => setShowLog(true)} style={n.logBtn}>
            <Text style={n.logBtnText}>+ Scan your food</Text>
          </Pressable>
        </View>
      )}

      <LogSheet visible={showLog} onClose={() => setShowLog(false)} onSuccess={handleSuccess} token={token} />
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const n = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: "#fafaf8" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)", backgroundColor: "transparent" },
  greeting:         { fontSize: 12, color: "#323131", fontWeight: "400", marginBottom: 2 },
  title:            { fontSize: 26, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 },
  avatar:           { flexDirection: "row", alignItems: "center", gap: 10 },
  dateNav:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", alignItems: "center", justifyContent: "center" },
  dateBtnText:      { fontSize: 20, color: "#1a1a1a" },
  dateLabel:        { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  heroCard:         { backgroundColor: "#111111", borderRadius: 22, borderWidth: 1, borderColor: "#222222", padding: 18, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  heroCardTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  heroEyebrow:      { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 },
  statusPill:       { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontSize: 11, fontWeight: "700" },
  editGoalsBtn:     { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  editGoalsBtnText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.45)" },
  heroBody:         { flexDirection: "row", alignItems: "center", gap: 14 },
  stickyBar:        { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, backgroundColor: "#fafaf8", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  logBtn:           { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  logBtnText:       { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.1 },
  sectionLabel:     { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa" },
  sectionCount:     { fontSize: 11, fontWeight: "600", color: "#ccc" },
  emptyCard:        { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e8e5de", padding: 36, alignItems: "center" },
  emptyTitle:       { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 6, textAlign: "center" },
  emptyDesc:        { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center" },
});