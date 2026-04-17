// NutritionScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

const BASE_URL = "https://yourpocketgym.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function todayISO() { return toLocalISO(); }

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

function mealEmoji(type) {
  return { breakfast: "🥞", lunch: "🥗", dinner: "🍜", snack: "🫐" }[type] ?? "🍽️";
}
function mealTypeLabel(type) {
  return { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" }[type] ?? type;
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const MACRO_GOALS = { calories: 2200, protein: 160, carbs: 250, fat: 70 };
const MEAL_TYPES  = [
  { key: "breakfast", label: "Breakfast", emoji: "🥞" },
  { key: "lunch",     label: "Lunch",     emoji: "🥗" },
  { key: "dinner",    label: "Dinner",    emoji: "🍜" },
  { key: "snack",     label: "Snack",     emoji: "🫐" },
];

// ─── Auth Hook ────────────────────────────────────────────────────────────────
function useAuth() {
  const [token,   setToken]   = useState(null);
  const [session, setSession] = useState(null);
  useEffect(() => {
    async function load() {
      const t       = await AsyncStorage.getItem("token");
      const userRaw = await AsyncStorage.getItem("user");
      if (t && userRaw) {
        const user = JSON.parse(userRaw);
        setToken(t);
        setSession({ user: { ...user, token: t } });
      }
    }
    load();
  }, []);
  return { token, session };
}

// ─── Macro Ring ───────────────────────────────────────────────────────────────
function MacroRing({ value, max, color, label, size = 68 }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "#f0ede6",
        alignItems: "center", justifyContent: "center",
        borderWidth: 6, borderColor: "#f0ede6",
        overflow: "hidden",
      }}>
        {/* Progress arc using border trick */}
        <View style={{
          position: "absolute", inset: 0,
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 6,
          borderColor: color,
          borderTopColor: pct > 0.25  ? color : "#f0ede6",
          borderRightColor: pct > 0.5  ? color : "#f0ede6",
          borderBottomColor: pct > 0.75 ? color : "#f0ede6",
          borderLeftColor:  pct > 0    ? color : "#f0ede6",
        }} />
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#1a1a1a" }}>
          {fmt(value)}
        </Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: "700", color: "#bbb", letterSpacing: 0.8, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ height = 90 }) {
  return (
    <View style={[s.card, { height, backgroundColor: "#f0ede6" }]} />
  );
}

// ─── Edit Macros Sheet ────────────────────────────────────────────────────────
function EditMacrosSheet({ log, onClose, onSave, token }) {
  const [macros, setMacros] = useState({
    calories: log.totals?.calories ?? 0,
    protein:  log.totals?.protein  ?? 0,
    carbs:    log.totals?.carbs    ?? 0,
    fat:      log.totals?.fat      ?? 0,
    fiber:    log.totals?.fiber    ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/api/meal-log?id=${log._id}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
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

  const FIELDS = [
    { key: "calories", label: "Cal",  unit: "kcal", color: "#1a1a1a" },
    { key: "protein",  label: "Prot", unit: "g",    color: "#ff6b35" },
    { key: "carbs",    label: "Carb", unit: "g",    color: "#1a1a1a" },
    { key: "fat",      label: "Fat",  unit: "g",    color: "#888"    },
    { key: "fiber",    label: "Fib",  unit: "g",    color: "#4ade80" },
  ];

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 22 }}>{mealEmoji(log.mealType)}</Text>
            <View>
              <Text style={{ fontSize: 11, color: "#bbb", fontWeight: "500" }}>{mealTypeLabel(log.mealType)}</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#1a1a1a" }}>Edit macros</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 12, color: "#bbb", fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Macro tiles */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
          {FIELDS.map(({ key, label, unit, color }) => (
            <View key={key} style={{
              flex: 1, backgroundColor: "#f4f2ed", borderRadius: 12,
              padding: 8, alignItems: "center",
              borderWidth: 1, borderColor: "#e8e5de",
            }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                {label}
              </Text>
              <TextInput
                value={String(macros[key])}
                onChangeText={v => setMacros(p => ({ ...p, [key]: parseFloat(v) || 0 }))}
                keyboardType="decimal-pad"
                style={{ fontSize: 15, fontWeight: "800", color, fontFamily: "System", textAlign: "center", width: "100%" }}
              />
              <Text style={{ fontSize: 8, color: "#ccc", marginTop: 2 }}>{unit}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={save}
          disabled={saving}
          style={[s.ctaBtn, { opacity: saving ? 0.5 : 1 }]}
        >
          <Text style={s.ctaBtnText}>{saving ? "Saving…" : "Save changes"}</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

// ─── Log Sheet ────────────────────────────────────────────────────────────────
function LogSheet({ onClose, onSuccess, token }) {
  const [imageUri,  setImageUri]  = useState(null);
  const [base64,    setBase64]    = useState(null);
  const [mealType,  setMealType]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Camera access is required."); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  function showImageOptions() {
    Alert.alert("Add photo", "Choose how to add your meal photo", [
      { text: "Take photo",        onPress: takePhoto   },
      { text: "Choose from library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function submit() {
    if (!base64 || !mealType) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/meal-log`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64, mealType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");
      onSuccess(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = base64 && mealType && !loading;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Log a meal</Text>

        {/* Image picker */}
        <TouchableOpacity onPress={showImageOptions} style={s.imagePicker}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={s.imagePreview} />
              <TouchableOpacity
                onPress={() => { setImageUri(null); setBase64(null); }}
                style={s.imageRemoveBtn}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 36, marginBottom: 6 }}>📸</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#bbb" }}>
                Tap to upload or take a photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Meal type */}
        <Text style={s.sheetLabel}>What meal is this?</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {MEAL_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setMealType(t.key)}
              style={[s.mealTypeBtn, mealType === t.key && s.mealTypeBtnActive]}
            >
              <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
              <Text style={[s.mealTypeBtnText, mealType === t.key && { color: "#fff" }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!mealType && (
          <Text style={{ fontSize: 12, color: "#ffb347", fontWeight: "600", marginBottom: 10 }}>
            👆 Select a meal type above
          </Text>
        )}
        {error && (
          <Text style={{ fontSize: 12, color: "#e53e3e", marginBottom: 10, fontWeight: "600" }}>
            ⚠️ {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          style={[s.ctaBtn, { opacity: canSubmit ? 1 : 0.4 }]}
        >
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={s.ctaBtnText}>Analysing with AI…</Text>
            </View>
          ) : (
            <Text style={s.ctaBtnText}>✨ Analyse & log meal</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

// ─── Result Sheet ─────────────────────────────────────────────────────────────
function ResultSheet({ log, onClose }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 30 }}>{mealEmoji(log.mealType)}</Text>
          <View>
            <Text style={{ fontSize: 12, color: "#aaa", fontWeight: "500" }}>{mealTypeLabel(log.mealType)}</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1a1a1a" }}>
              {fmt(log.totals?.calories ?? 0)} kcal
            </Text>
          </View>
          <View style={{ marginLeft: "auto", backgroundColor: "rgba(34,197,94,0.1)", padding: 8, borderRadius: 10 }}>
            <Text style={{ fontSize: 22 }}>✅</Text>
          </View>
        </View>

        {/* Macro row */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20, padding: 16, backgroundColor: "#f4f2ed", borderRadius: 16 }}>
          {[
            { label: "Protein", value: log.totals?.protein, color: "#ff6b35" },
            { label: "Carbs",   value: log.totals?.carbs,   color: "#1a1a1a" },
            { label: "Fat",     value: log.totals?.fat,     color: "#bbb"    },
          ].map((m) => (
            <View key={m.label} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: m.color }}>
                {fmt(m.value ?? 0)}<Text style={{ fontSize: 10, color: "#aaa" }}>g</Text>
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8 }}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={s.sheetLabel}>Detected foods</Text>
        <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
          {log.foods.map((f, i) => (
            <View key={i} style={{
              flexDirection: "row", alignItems: "center", gap: 10,
              padding: 12, backgroundColor: "#fff",
              borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14, marginBottom: 8,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a1a1a" }}>{f.name}</Text>
                <Text style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{f.portion}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1a1a1a" }}>{fmt(f.macros?.calories ?? 0)}</Text>
                <Text style={{ fontSize: 10, color: "#bbb" }}>kcal</Text>
              </View>
              {f.confidence < 0.7 && (
                <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: "#f59e0b" }}>~est</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {log.aiNotes && (
          <Text style={{ fontSize: 12, color: "#aaa", lineHeight: 20, marginVertical: 12, fontStyle: "italic" }}>
            💡 {log.aiNotes}
          </Text>
        )}

        <TouchableOpacity onPress={onClose} style={s.ctaBtn}>
          <Text style={s.ctaBtnText}>Done</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ log, index, onDelete, onEdit, token }) {
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [editOpen,       setEditOpen]       = useState(false);
  const [currentTotals,  setCurrentTotals]  = useState(log.totals);
  const date = new Date(log.date);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(log._id);
  }

  function handleSave(newMacros) {
    setCurrentTotals(newMacros);
    onEdit?.(log._id, newMacros);
  }

  return (
    <>
      <View style={[s.card, { padding: 14 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>

          {/* Date badge */}
          <View style={{
            width: 44, height: 44, borderRadius: 13,
            backgroundColor: index === 0 ? "#1a1a1a" : "#f4f2ed",
            borderWidth: 1, borderColor: "#e8e5de",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 0.6, color: index === 0 ? "rgba(255,255,255,0.45)" : "#ccc" }}>
              {date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: "800", lineHeight: 20, color: index === 0 ? "#fff" : "#1a1a1a" }}>
              {date.getDate()}
            </Text>
          </View>

          {/* Meal info */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 15 }}>{mealEmoji(log.mealType)}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a1a1a" }}>{mealTypeLabel(log.mealType)}</Text>
              {index === 0 && (
                <View style={{ backgroundColor: "rgba(255,107,53,0.1)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: "#ff6b35" }}>Latest</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, color: "#aaa", marginTop: 2 }} numberOfLines={1}>
              {log.foods.map((f) => f.name).join(", ")}
            </Text>
          </View>

          {/* Right column */}
          <View style={{ alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#1a1a1a" }}>
                {fmt(currentTotals?.calories ?? 0)}
                <Text style={{ fontSize: 10, fontWeight: "500", color: "#bbb" }}> kcal</Text>
              </Text>
              <Text style={{ fontSize: 11, color: "#ff6b35", fontWeight: "600", marginTop: 2 }}>
                {fmt(currentTotals?.protein ?? 0)}g protein
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <TouchableOpacity
                onPress={() => setEditOpen(true)}
                style={{ paddingHorizontal: 10, paddingVertical: 3, backgroundColor: "#f4f2ed", borderWidth: 1, borderColor: "#e0ddd6", borderRadius: 8 }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#555" }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
                  backgroundColor: confirmDelete ? "rgba(244,63,94,0.06)" : "#f4f2ed",
                  borderWidth: 1,
                  borderColor: confirmDelete ? "rgba(244,63,94,0.25)" : "#e0ddd6",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: confirmDelete ? "#f43f5e" : "#bbb" }}>
                  {confirmDelete ? "Sure?" : "Del"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {editOpen && (
        <EditMacrosSheet
          log={{ ...log, totals: currentTotals }}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          token={token}
        />
      )}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const { token, session } = useAuth();

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [result,  setResult]  = useState(null);
  const [selDate, setSelDate] = useState(todayISO());

  const fetchLogs = useCallback(async (date) => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/meal-log?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLogs(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchLogs(selDate);
  }, [token, selDate, fetchLogs]);

  function handleSuccess(newLog) {
    setShowLog(false);
    setResult(newLog);
    if (toLocalISO(new Date(newLog.date)) === selDate) {
      setLogs((prev) => [newLog, ...prev]);
    }
  }

  async function handleDelete(id) {
    await fetch(`${BASE_URL}/api/meal-log?id=${id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLogs((prev) => prev.filter((l) => l._id !== id));
  }

  function handleEdit(id, newMacros) {
    setLogs((prev) =>
      prev.map((l) => l._id === id ? { ...l, totals: newMacros } : l)
    );
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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selDate === toLocalISO(yesterday)) return "Yesterday";
    return new Date(selDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const todayTotals = sumMacros(logs);
  const isToday     = selDate === todayISO();
  const calPct      = Math.min((todayTotals.calories / MACRO_GOALS.calories) * 100, 100);
  const firstName   = session?.user?.name?.split(" ")[0] ?? "Athlete";

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {getGreeting()}</Text>
          <Text style={s.headerTitle}>{firstName} 🥗</Text>
        </View>
        <TouchableOpacity onPress={() => setShowLog(true)} style={s.iconBtn}>
          <Text style={{ fontSize: 18 }}>➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date nav */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={s.navBtn}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a1a1a" }}>{dateLabel()}</Text>
          <TouchableOpacity
            onPress={() => shiftDate(1)}
            disabled={isToday}
            style={[s.navBtn, { opacity: isToday ? 0.25 : 1 }]}
          >
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard height={160} />
            <SkeletonCard height={100} />
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
          </View>
        ) : (
          <>
            {/* Calories card */}
            <View style={s.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <View>
                  <Text style={s.eyebrow}>Calories {isToday ? "today" : dateLabel().toLowerCase()}</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 3 }}>
                    <Text style={{ fontSize: 36, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 }}>
                      {fmt(todayTotals.calories)}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#bbb" }}>/ {MACRO_GOALS.calories} kcal</Text>
                  </View>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
                  backgroundColor: calPct >= 90 ? "rgba(229,62,62,0.08)" : calPct >= 60 ? "rgba(255,107,53,0.09)" : "#f4f2ed",
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.4, color: calPct >= 90 ? "#e53e3e" : calPct >= 60 ? "#ff6b35" : "#bbb" }}>
                    {calPct >= 90 ? "🔥 Near limit" : calPct >= 60 ? "⚡ On track" : "💪 Keep eating"}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ height: 8, backgroundColor: "#f0ede6", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
                <View style={{
                  height: "100%", width: `${calPct}%`,
                  backgroundColor: calPct >= 90 ? "#e53e3e" : "#ff6b35",
                  borderRadius: 99,
                }} />
              </View>

              {/* Macro rings */}
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <MacroRing value={round1(todayTotals.protein)} max={MACRO_GOALS.protein} color="#ff6b35" label="Protein" />
                <MacroRing value={round1(todayTotals.carbs)}   max={MACRO_GOALS.carbs}   color="#1a1a1a" label="Carbs"   />
                <MacroRing value={round1(todayTotals.fat)}     max={MACRO_GOALS.fat}     color="#aaa"    label="Fat"     />
                <MacroRing value={round1(todayTotals.fiber)}   max={30}                  color="#4ade80" label="Fiber"   />
              </View>
            </View>

            {/* Section label */}
            <Text style={s.sectionLabel}>Meals logged</Text>

            {logs.length === 0 ? (
              <View style={[s.card, { alignItems: "center", padding: 40 }]}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🍽️</Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 }}>
                  {isToday ? "No meals logged yet" : "No meals on this day"}
                </Text>
                <Text style={{ fontSize: 13, color: "#aaa", lineHeight: 20, marginBottom: 20, textAlign: "center" }}>
                  {isToday
                    ? "Take a photo of your next meal to track calories and macros automatically."
                    : "Nothing was logged here."}
                </Text>
                {isToday && (
                  <TouchableOpacity onPress={() => setShowLog(true)} style={s.ctaBtn}>
                    <Text style={s.ctaBtnText}>📸 Log a meal →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {logs.map((log, i) => (
                  <MealCard
                    key={log._id}
                    log={log}
                    index={i}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    token={token}
                  />
                ))}
                {isToday && (
                  <TouchableOpacity onPress={() => setShowLog(true)} style={[s.ctaBtn, { marginTop: 4 }]}>
                    <Text style={s.ctaBtnText}>📸 Log another meal →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showLog && (
        <LogSheet
          onClose={() => setShowLog(false)}
          onSuccess={handleSuccess}
          token={token}
        />
      )}
      {result && (
        <ResultSheet
          log={result}
          onClose={() => setResult(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: "#fafaf8" },
  header:      {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: "#fafaf8",
    borderBottomWidth: 1, borderBottomColor: "rgba(232,229,222,0.5)",
  },
  greeting:    { fontSize: 12, color: "#aaa", fontWeight: "400" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1, lineHeight: 26 },
  iconBtn:     {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e8e5de",
    alignItems: "center", justifyContent: "center",
  },
  navBtn:      {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e8e5de",
    alignItems: "center", justifyContent: "center",
  },
  navBtnText:  { fontSize: 18, color: "#1a1a1a" },
  card:        {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de",
    borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eyebrow:     { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa" },
  sectionLabel:{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginTop: 4 },
  ctaBtn:      { width: "100%", padding: 14, backgroundColor: "#1a1a1a", borderRadius: 14, alignItems: "center" },
  ctaBtnText:  { fontSize: 14, fontWeight: "700", color: "#fafaf8", letterSpacing: 0.1 },

  // Modal / Sheet
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  bottomSheet:  {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fafaf8",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16,
    maxHeight: "90%",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0ddd6", alignSelf: "center", marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5, marginBottom: 20 },
  sheetLabel:   { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa", marginBottom: 8 },

  // Image picker
  imagePicker:   {
    height: 170, borderRadius: 16,
    borderWidth: 2, borderStyle: "dashed", borderColor: "#e0ddd6",
    backgroundColor: "#f4f2ed",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginBottom: 16,
  },
  imagePreview:  { width: "100%", height: "100%", borderRadius: 16 },
  imageRemoveBtn:{
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 99,
    width: 28, height: 28, alignItems: "center", justifyContent: "center",
  },

  // Meal type buttons
  mealTypeBtn:      {
    width: "47%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: "#e8e5de", backgroundColor: "#fff",
  },
  mealTypeBtnActive:{ backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mealTypeBtnText:  { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
});