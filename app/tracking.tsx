import { useRouter } from "expo-router";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { LinearGradient } from "expo-linear-gradient";
import { getToken } from "../src/auth/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── helpers tracker ────────────────────────────────────────────────────────────────── log work
const totalVol = (sets) => sets.reduce((s, x) => s + x.reps * x.weight, 0);
const maxW = (sets) => sets.length ? Math.max(...sets.map((s) => s.weight)) : 0;

function getWeekActivity(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toLocaleDateString("en-CA");
    const hasLog = logs.some((l) => new Date(l.date).toLocaleDateString("en-CA") === iso);
    days.push({
      label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
      active: hasLog,
      today: i === 0,
    });
  }
  return days;
}

function totalVolLog(log) {
  return log.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0
  );
}

const toISODate = (date) => new Date(date).toLocaleDateString("en-CA");

function buildYearGrid(logs) {
  const volByDate = {};
  logs.forEach((log) => {
    const iso = toISODate(log.date);
    const volume = log.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0
    );
    volByDate[iso] = (volByDate[iso] || 0) + volume;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const weeks = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today) { week.push(null); }
      else {
        const iso = toISODate(cursor);
        week.push({ date: iso, vol: volByDate[iso] || 0, hasLog: !!volByDate[iso] });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  const maxVol = Math.max(...Object.values(volByDate), 1);
  return { weeks, maxVol };
}

function cellColor(vol, maxVol, hasLog) {
  if (!hasLog) return "#f0ede6";
  const i = vol / maxVol;
  if (i < 0.25) return "#ffd4c2";
  if (i < 0.5)  return "#ff9f7a";
  if (i < 0.75) return "#ff6b35";
  return "#c8410d";
}

function buildMuscleStats(logs) {
  const grouped = {};
  logs.forEach((log) => {
    const mgSeen = new Set();
    log.exercises.forEach((ex) => {
      const mg = (ex.muscleGroup || "").trim() || null;
      if (!mg || mgSeen.has(mg)) return;
      mgSeen.add(mg);
      const mgExs = log.exercises.filter((e) => (e.muscleGroup || "").trim() === mg);
      const weights = mgExs.flatMap((e) => e.sets.map((s) => s.weight));
      const vols    = mgExs.flatMap((e) => e.sets.map((s) => s.reps * s.weight));
      const best    = weights.length ? Math.max(...weights) : 0;
      const vol     = vols.reduce((a, b) => a + b, 0);
      const names   = [...new Set(mgExs.map((e) => e.name))];
      if (!grouped[mg]) grouped[mg] = [];
      grouped[mg].push({ logId: log._id, date: log.date, bestWeight: best, totalVol: vol, exNames: names });
    });
  });
  return Object.entries(grouped)
    .map(([mg, sessions]) => {
      const last  = sessions[0];
      const prev  = sessions[1] || null;
      const delta = prev !== null ? last.bestWeight - prev.bestWeight : null;
      const allNames = [...new Set(sessions.flatMap((s) => s.exNames))];
      return { mg, lastBest: last.bestWeight, delta, exNames: allNames, sessionCount: sessions.length };
    })
    .sort((a, b) => a.mg.localeCompare(b.mg));
}

const EXERCISE_LIBRARY = {
  Chest:     ["Bench Press","Incline Bench Press","Decline Bench Press","Dumbbell Fly","Cable Fly","Push-Up","Chest Dip","Incline Dumbbell Press","Pec Deck Machine","Landmine Press"],
  Back:      ["Pull-Up","Chin-Up","Lat Pulldown","Seated Cable Row","Barbell Row","Dumbbell Row","T-Bar Row","Face Pull","Deadlift","Romanian Deadlift","Good Morning","Back Extension"],
  Shoulders: ["Overhead Press","Dumbbell Shoulder Press","Arnold Press","Lateral Raise","Front Raise","Rear Delt Fly","Upright Row","Cable Lateral Raise","Machine Shoulder Press","Shrug"],
  Arms:      ["Barbell Curl","Dumbbell Curl","Hammer Curl","Preacher Curl","Cable Curl","Incline Dumbbell Curl","Concentration Curl","Tricep Pushdown","Skull Crusher","Close-Grip Bench","Overhead Tricep Extension","Dips","Diamond Push-Up"],
  Legs:      ["Squat","Front Squat","Leg Press","Hack Squat","Bulgarian Split Squat","Lunge","Romanian Deadlift","Leg Curl","Leg Extension","Calf Raise","Glute Bridge","Hip Thrust","Step-Up","Sumo Deadlift"],
  Core:      ["Plank","Crunch","Sit-Up","Leg Raise","Hanging Leg Raise","Ab Wheel Rollout","Cable Crunch","Russian Twist","Bicycle Crunch","Dead Bug","Pallof Press","Dragon Flag"],
};
const MUSCLE_GROUPS = Object.keys(EXERCISE_LIBRARY);

// ─── YearChart ────────────────────────────────────────────────────────────────
const CELL = 12;
const GAP  = 3;
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 20;

function YearChart({ logs }) {
  const { weeks, maxVol } = buildYearGrid(logs);
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);
  const yearStart = new Date(); yearStart.setMonth(0,1); yearStart.setHours(0,0,0,0);
  const yearSessions = logs.filter((l) => new Date(l.date) >= yearStart).length;
  const longestStreak = (() => {
    let best = 0, cur = 0;
    weeks.flat().filter(Boolean).forEach((d) => { if (d.hasLog) { cur++; best = Math.max(best, cur); } else cur = 0; });
    return best;
  })();
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ wi, x: wi * STEP, label: new Date(first.date).toLocaleDateString("en-US", { month: "short" }) });
      lastMonth = m;
    }
  });
  const gridWidth = weeks.length * STEP;
  const DAY_NAMES = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <View style={yc.container}>
      <View style={yc.statsRow}>
        <View style={yc.statCard}>
          <Text style={yc.statLabel}>This year</Text>
          <Text style={yc.statValue}>{yearSessions}<Text style={yc.statUnit}> sessions</Text></Text>
        </View>
        <View style={yc.statCard}>
          <Text style={yc.statLabel}>Longest streak</Text>
          <Text style={yc.statValue}>{longestStreak}<Text style={yc.statUnit}> days</Text></Text>
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: DAY_LABEL_WIDTH, marginTop: 18 }}>
          {DAY_NAMES.map((name, di) => (
            <View key={di} style={{ height: CELL, marginBottom: GAP, justifyContent: "center" }}>
              {name !== "" && <Text style={yc.dayLabel}>{name}</Text>}
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            <View style={{ width: gridWidth }}>
              <View style={{ height: 14, marginBottom: 4 }}>
                {monthLabels.map(({ wi, x, label }) => (
                  <Text key={wi} style={[yc.monthLabel, { position: "absolute", left: x }]} numberOfLines={1}>{label}</Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: GAP }}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                    {week.map((day, di) => (
                      <Pressable key={di}
                        onPress={() => { if (!day?.hasLog) return; setTooltip(tooltip?.date === day.date ? null : day); }}
                        style={[yc.cell, { backgroundColor: day ? cellColor(day.vol, maxVol, day.hasLog) : "transparent" }]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      {tooltip && (
        <View style={yc.tooltip}>
          <Text style={yc.tooltipDate}>{new Date(tooltip.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</Text>
          <Text style={yc.tooltipVol}>{tooltip.vol.toLocaleString()} lbs volume</Text>
        </View>
      )}
      <View style={yc.legend}>
        <Text style={yc.legendLabel}>Less</Text>
        {["#f0ede6","#ffd4c2","#ff9f7a","#ff6b35","#c8410d"].map((c) => (
          <View key={c} style={[yc.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={yc.legendLabel}>More</Text>
      </View>
    </View>
  );
}
const yc = StyleSheet.create({
  container:   { marginTop: 4 },
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:    { flex: 1, backgroundColor: "#f4f2ed", borderRadius: 14, padding: 12 },
  statLabel:   { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa", marginBottom: 3 },
  statValue:   { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  statUnit:    { fontSize: 12, fontWeight: "400", color: "#aaa" },
  dayLabel:    { fontSize: 8, fontWeight: "600", color: "#bbb", lineHeight: CELL },
  monthLabel:  { position: "absolute", fontSize: 9, fontWeight: "700", color: "#aaa", letterSpacing: 0.4, width: 30 },
  cell:        { width: CELL, height: CELL, borderRadius: 3 },
  tooltip:     { marginTop: 10, backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start" },
  tooltipDate: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.55)", marginBottom: 2 },
  tooltipVol:  { fontSize: 14, fontWeight: "800", color: "#ff6b35" },
  legend:      { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" },
  legendLabel: { fontSize: 10, color: "#bbb", fontWeight: "600" },
  legendCell:  { width: 11, height: 11, borderRadius: 2 },
});

// ─── DeltaBadge ───────────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined)
    return <View style={[bs.base, bs.neutral]}><Text style={[bs.text, { color: "#aaa" }]}>1st</Text></View>;
  if (delta === 0)
    return <View style={[bs.base, bs.neutral]}><Text style={[bs.text, { color: "#aaa" }]}>= 0</Text></View>;
  const up = delta > 0;
  return (
    <View style={[bs.base, up ? bs.up : bs.down]}>
      <Text style={[bs.text, { color: up ? "#16a34a" : "#f43f5e" }]}>{up ? "▲" : "▼"} {Math.abs(delta)}</Text>
    </View>
  );
}
const bs = StyleSheet.create({
  base:    { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  up:      { backgroundColor: "rgba(34,197,94,0.1)" },
  down:    { backgroundColor: "rgba(244,63,94,0.09)" },
  neutral: { backgroundColor: "#f4f2ed" },
  text:    { fontSize: 12, fontWeight: "700" },
});

// ─── MuscleAccordionRow ───────────────────────────────────────────────────────
function MuscleAccordionRow({ mg, lastBest, delta, exNames, sessionCount, logs }) {
  const [open, setOpen] = useState(false);
  const allExercises = [];
  const seen = new Set();
  logs.forEach((log) => {
    log.exercises.forEach((ex) => {
      if ((ex.muscleGroup || "").trim() === mg && !seen.has(ex.name)) {
        seen.add(ex.name);
        allExercises.push(ex);
      }
    });
  });
  return (
    <View style={ms.card}>
      <Pressable onPress={() => setOpen((v) => !v)} style={ms.row}>
        <View>
          <Text style={ms.mgName}>{mg}</Text>
          <Text style={ms.mgSub}>{sessionCount} session{sessionCount !== 1 ? "s" : ""} · {exNames.length} exercise{exNames.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={ms.rowRight}>
          <Text style={ms.bestWeight}>{lastBest}<Text style={ms.lbs}> lbs</Text></Text>
          <DeltaBadge delta={delta} />
          <Text style={ms.chevron}>{open ? "∨" : "›"}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={ms.expanded}>
          {allExercises.map((ex, i) => (
            <View key={i}>
              <View style={ms.exHeader}>
                <Text style={ms.exName}>{ex.name}</Text>
                <Text style={ms.exMax}>{maxW(ex.sets)} lbs max</Text>
              </View>
              {ex.sets.map((s, j) => (
                <View key={j} style={ms.setRow}>
                  <Text style={ms.setNum}>{s.setNumber}</Text>
                  <Text style={ms.setDetail}>{s.reps} reps × {s.weight} lbs</Text>
                  <Text style={ms.setVol}>{(s.reps * s.weight).toLocaleString()} vol</Text>
                </View>
              ))}
              {i < allExercises.length - 1 && <View style={ms.divider} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const ms = StyleSheet.create({
  card:       { borderRadius: 20, borderWidth: 1, borderColor: "#e8e5de", backgroundColor: "#fff", overflow: "hidden" },
  row:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  mgName:     { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  mgSub:      { fontSize: 12, color: "#aaa", marginTop: 3 },
  rowRight:   { flexDirection: "row", alignItems: "center", gap: 10 },
  bestWeight: { fontSize: 24, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  lbs:        { fontSize: 12, fontWeight: "400", color: "#aaa" },
  chevron:    { fontSize: 18, color: "#ccc", marginLeft: 4 },
  expanded:   { borderTopWidth: 1, borderTopColor: "#f0ede8", padding: 18, gap: 10 },
  exHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 6 },
  exName:     { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  exMax:      { fontSize: 12, color: "#aaa" },
  setRow:     { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 4, marginBottom: 5 },
  setNum:     { width: 18, color: "#ccc", fontWeight: "700", textAlign: "center", fontSize: 13 },
  setDetail:  { color: "#888", fontSize: 13 },
  setVol:     { marginLeft: "auto", color: "#bbb", fontSize: 13 },
  divider:    { height: 1, backgroundColor: "#f0ede8", marginVertical: 8 },
});

// ─── ExercisePicker ─────────────────────────────────────────────────────────── log workout
function ExercisePicker({ muscleGroup, alreadyAdded, onConfirm, onClose }) {
  const list = EXERCISE_LIBRARY[muscleGroup] || [];
  const [picked, setPicked] = useState([]);
  const toggle = (name) =>
    setPicked((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ep.overlay}>
        <View style={ep.panel}>
          <View style={ep.handle} />
          <View style={ep.header}>
            <Pressable onPress={onClose}><Text style={ep.back}>← Back</Text></Pressable>
            <Text style={ep.title}>{muscleGroup}</Text>
            <Text style={ep.count}>{picked.length} selected</Text>
          </View>
          <ScrollView style={ep.list} showsVerticalScrollIndicator={false}>
            {list.map((name) => {
              const isAdded = alreadyAdded.includes(name);
              const isSel   = picked.includes(name);
              return (
                <Pressable key={name} disabled={isAdded}
                  onPress={() => !isAdded && toggle(name)}
                  style={[ep.item, isSel && ep.itemSel, isAdded && ep.itemAdded]}>
                  <Text style={[ep.itemText, isSel && ep.itemTextSel]}>{name}</Text>
                  {isAdded
                    ? <Text style={ep.addedLabel}>Added</Text>
                    : isSel
                      ? <Text style={{ color: "#ff6b35", fontWeight: "800", fontSize: 18 }}>✓</Text>
                      : <Text style={{ color: "#ccc", fontSize: 22 }}>+</Text>
                  }
                </Pressable>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
          <View style={ep.footer}>
            <Pressable disabled={picked.length === 0} onPress={() => onConfirm(picked, muscleGroup)}
              style={[ep.addBtn, picked.length === 0 && ep.addBtnDisabled]}>
              <Text style={ep.addBtnText}>
                Add {picked.length > 0 ? `${picked.length} exercise${picked.length > 1 ? "s" : ""}` : "exercises"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const ep = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  panel:          { backgroundColor: "#fafaf8", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingBottom: 36 },
  handle:         { width: 40, height: 4, backgroundColor: "#e8e5de", borderRadius: 99, alignSelf: "center", marginTop: 14 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: "#e8e5de" },
  back:           { fontSize: 15, fontWeight: "700", color: "#aaa" },
  title:          { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  count:          { fontSize: 13, color: "#aaa", minWidth: 70, textAlign: "right" },
  list:           { padding: 14 },
  item:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, marginBottom: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de" },
  itemSel:        { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  itemAdded:      { opacity: 0.4 },
  itemText:       { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  itemTextSel:    { color: "#fff" },
  addedLabel:     { fontSize: 11, fontWeight: "700", color: "#aaa" },
  footer:         { padding: 18, borderTopWidth: 1, borderTopColor: "#e8e5de" },
  addBtn:         { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 17, alignItems: "center" },
  addBtnDisabled: { opacity: 0.3 },
  addBtnText:     { color: "#fafaf8", fontSize: 16, fontWeight: "700" },
});

// ─── LogSheet ─────────────────────────────────────────────────────────────────
// ✅ FIX: Completely rebuilt — keyboard no longer pushes screen up.
// The fix is: ScrollView sits OUTSIDE KeyboardAvoidingView so only the
// save button area nudges up, not the whole modal content.
// ─── LogSheet ─────────────────────────────────────────────────────────────────
// ✅ FIX: Removed KeyboardAvoidingView entirely. 
// ScrollView uses keyboardShouldPersistTaps + automaticallyAdjustKeyboardInsets
// so content scrolls naturally when keyboard appears. Save button is fixed
// at the bottom with paddingBottom that accounts for keyboard via inputAccessoryView
// pattern — no jumping, no empty gap.
// ─── LogSheet — Fully Redesigned ─────────────────────────────────────────────
// New approach: Step-based flow. No nested ScrollView + KAV conflicts.
// Step 1: Pick muscle group → Step 2: Pick exercise → Step 3: Log sets
// Sets are entered in a fixed bottom panel — keyboard cannot break anything.
function LogSheet({ onClose, onSaved }) {
  const [step,      setStep]      = useState("muscles");
  const [activeMg,  setActiveMg]  = useState(null);
  const [exercises, setExercises] = useState([]);
  const [activeEx,  setActiveEx]  = useState(null);
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const slideAnim    = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim,    { toValue: 0, tension: 68, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim,    { toValue: 700, duration: 240, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const currentEx = activeEx !== null ? exercises[activeEx] : null;
  const alreadyAdded = exercises.map(e => e.name);

  const pickMuscle = (mg) => { setActiveMg(mg); setStep("exercises"); };

  const pickExercise = (name) => {
    const existing = exercises.findIndex(e => e.name === name);
    if (existing >= 0) {
      setActiveEx(existing);
    } else {
      setExercises(prev => [...prev, { name, mg: activeMg, sets: [{ reps: "", weight: "" }] }]);
      setActiveEx(exercises.length);
    }
    setStep("sets");
  };

  const updateSet = (si, field, val) =>
    setExercises(prev => prev.map((ex, i) =>
      i !== activeEx ? ex : { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) }
    ));

  const addSet = () =>
    setExercises(prev => prev.map((ex, i) =>
      i !== activeEx ? ex : { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] }
    ));

  const removeSet = (si) =>
    setExercises(prev => prev.map((ex, i) =>
      i !== activeEx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== si) }
    ));

  const removeExercise = (ei) => setExercises(prev => prev.filter((_, i) => i !== ei));

  const doneWithSets = () => { setActiveEx(null); setStep("muscles"); };

  const submit = async () => {
    if (!exercises.length) { alert("Add at least one exercise."); return; }
    const cleaned = exercises.map(ex => ({
      name: ex.name, muscleGroup: ex.mg,
      sets: ex.sets.map((s, i) => ({ setNumber: i + 1, reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
    }));
    if (cleaned.some(ex => ex.sets.some(s => s.reps === 0 || s.weight === 0))) {
      alert("Fill in all reps and weights."); return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await fetch("https://yourpocketgym.com/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString(), exercises: cleaned, notes }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); onSaved(); setTimeout(() => onClose(), 1600); }
      else alert(json.error || "Something went wrong.");
    } catch { alert("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible animationType="none" transparent onRequestClose={dismiss}>
      <Animated.View style={[lg.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      <Animated.View style={[lg.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={lg.handle} />

        {/* ── SAVED ── */}
        {saved && (
          <View style={lg.savedWrap}>
            <View style={lg.savedCheck}>
              <Text style={lg.savedCheckText}>✓</Text>
            </View>
            <Text style={lg.savedTitle}>Saved</Text>
            <Text style={lg.savedSub}>Workout logged successfully</Text>
          </View>
        )}

        {/* ── STEP 1: MUSCLES ── weight*/}
        {!saved && step === "muscles" && (
          <View style={lg.flex}>
            <View style={lg.header}>
              <View style={lg.flex}>
                <Text style={lg.title}>Log workout</Text>
                <Text style={lg.sub}>
                  {exercises.length === 0 ? "Select a muscle group" : `${exercises.length} exercise${exercises.length !== 1 ? "s" : ""} added`}
                </Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={lg.flex} contentContainerStyle={lg.muscleScroll} showsVerticalScrollIndicator={false}>

              {/* Muscle group buttons */}
              <View style={lg.muscleGrid}>
                {MUSCLE_GROUPS.map(mg => {
                  const count = exercises.filter(e => e.mg === mg).length;
                  return (
                    <Pressable
                      key={mg}
                      onPress={() => pickMuscle(mg)}
                      style={({ pressed }) => [lg.muscleBtn, count > 0 && lg.muscleBtnActive, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={[lg.muscleBtnText, count > 0 && lg.muscleBtnTextActive]}>{mg}</Text>
                      {count > 0 && (
                        <View style={lg.muscleBtnBadge}>
                          <Text style={lg.muscleBtnBadgeText}>{count}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Added exercises */}
              {exercises.length > 0 && (
                <View style={lg.addedSection}>
                  <Text style={lg.sectionLabel}>Added</Text>
                  {exercises.map((ex, ei) => (
                    <View key={ei} style={lg.addedRow}>
                      <View style={lg.addedLeft}>
                        <Text style={lg.addedMg}>{ex.mg}</Text>
                        <Text style={lg.addedName}>{ex.name}</Text>
                      </View>
                      <Text style={lg.addedSets}>{ex.sets.length} set{ex.sets.length !== 1 ? "s" : ""}</Text>
                      <Pressable
                        onPress={() => { setActiveMg(ex.mg); setActiveEx(ei); setStep("sets"); }}
                        style={lg.addedEditBtn}
                      >
                        <Text style={lg.addedEditText}>Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => removeExercise(ei)} style={lg.addedDelBtn}>
                        <Text style={lg.addedDelText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View style={lg.notesSection}>
                <Text style={lg.sectionLabel}>Notes</Text>
                <TextInput
                  style={lg.notesInput}
                  placeholder="Optional session notes…"
                  placeholderTextColor="#ccc"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  blurOnSubmit
                  returnKeyType="done"
                />
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={lg.bottomBar}>
              <Pressable
                onPress={submit}
                disabled={saving || exercises.length === 0}
                style={[lg.saveBtn, (saving || exercises.length === 0) && { opacity: 0.3 }]}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={lg.saveBtnText}>
                      Save{exercises.length > 0 ? ` · ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}` : ""}
                    </Text>
                }
              </Pressable>
            </View>
          </View>
        )}

        {/* ── STEP 2: EXERCISES ── */}
        {!saved && step === "exercises" && (
          <View style={lg.flex}>
            <View style={lg.header}>
              <Pressable onPress={() => setStep("muscles")} style={lg.backBtn}>
                <Text style={lg.backBtnText}>←</Text>
              </Pressable>
              <View style={[lg.flex, { marginLeft: 14 }]}>
                <Text style={lg.title}>{activeMg}</Text>
                <Text style={lg.sub}>Tap to select</Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={lg.flex} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {(EXERCISE_LIBRARY[activeMg] || []).map(name => {
                const isAdded = alreadyAdded.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => pickExercise(name)}
                    style={({ pressed }) => [lg.exItem, isAdded && lg.exItemAdded, pressed && { opacity: 0.65 }]}
                  >
                    <Text style={[lg.exItemName, isAdded && { color: "#ff6b35" }]}>{name}</Text>
                    <Text style={[lg.exItemArrow, isAdded && { color: "#ff6b35" }]}>
                      {isAdded ? "Edit" : "+"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── STEP 3: SETS ── */}
        {!saved && step === "sets" && currentEx && (
          <View style={lg.flex}>
            {/* Header */}
            <View style={lg.header}>
              <Pressable onPress={doneWithSets} style={lg.backBtn}>
                <Text style={lg.backBtnText}>←</Text>
              </Pressable>
              <View style={[lg.flex, { marginLeft: 14 }]}>
                <Text style={lg.mgTag}>{currentEx.mg}</Text>
                <Text style={lg.setTitle} numberOfLines={1}>{currentEx.name}</Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Column headers */}
            <View style={lg.colHeaders}>
              <View style={{ width: 44 }} />
              <Text style={[lg.colLabel, { flex: 1, textAlign: "center" }]}>REPS</Text>
              <Text style={[lg.colLabel, { flex: 1, textAlign: "center" }]}>WEIGHT</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Set rows — ScrollView with native keyboard insets, no KAV */}
            <ScrollView
              style={lg.flex}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: 20 }}
            >
              {currentEx.sets.map((set, si) => (
                <View key={si} style={lg.setRow}>
                  <View style={lg.setNum}>
                    <Text style={lg.setNumText}>{si + 1}</Text>
                  </View>

                  <TextInput
                    style={lg.setInput}
                    value={String(set.reps)}
                    placeholder="0"
                    placeholderTextColor="#ddd"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    selectTextOnFocus
                    onChangeText={v => updateSet(si, "reps", v.replace(/[^0-9]/g, ""))}
                  />

                  <TextInput
                    style={lg.setInput}
                    value={String(set.weight)}
                    placeholder="0"
                    placeholderTextColor="#ddd"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    selectTextOnFocus
                    onChangeText={v => updateSet(si, "weight", v.replace(/[^0-9.]/g, ""))}
                  />

                  <Pressable
                    onPress={() => removeSet(si)}
                    disabled={currentEx.sets.length <= 1}
                    style={[lg.delSetBtn, currentEx.sets.length <= 1 && { opacity: 0.15 }]}
                  >
                    <Text style={lg.delSetText}>−</Text>
                  </Pressable>
                </View>
              ))}

              {currentEx.sets.length < 10 && (
                <Pressable onPress={addSet} style={lg.addSetRow}>
                  <Text style={lg.addSetText}>+ Add set</Text>
                </Pressable>
              )}
            </ScrollView>

            {/* Bottom bar — always pinned, keyboard cannot touch it */}
            <View style={lg.bottomBar}>
              <Pressable onPress={doneWithSets} style={lg.doneBtn}>
                <Text style={lg.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const lg = StyleSheet.create({
  flex: { flex: 1 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "91%",
    backgroundColor: "#fafaf8",
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 18,
  },

  handle: {
    width: 36, height: 4, backgroundColor: "#e0ddd6",
    borderRadius: 99, alignSelf: "center", marginTop: 12, marginBottom: 4,
  },

  // ── Header ──
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0ede8",
  },
  title:        { fontSize: 20, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  sub:          { fontSize: 13, color: "#bbb", marginTop: 2, fontWeight: "400" },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f0ede8", alignItems: "center", justifyContent: "center" },
  closeBtnText: { fontSize: 13, color: "#999", fontWeight: "700" },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f0ede8", alignItems: "center", justifyContent: "center" },
  backBtnText:  { fontSize: 17, color: "#555", fontWeight: "500" },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1,
    textTransform: "uppercase", color: "#bbb", marginBottom: 10,
  },

  // ── Step 1: Muscles ──
  muscleScroll: { padding: 20 },

  muscleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  muscleBtn: {
    paddingHorizontal: 18, paddingVertical: 13,
    borderRadius: 14, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#e8e5de",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  muscleBtnActive:    { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  muscleBtnText:      { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  muscleBtnTextActive:{ color: "#fff" },
  muscleBtnBadge:     { backgroundColor: "#ff6b35", borderRadius: 99, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  muscleBtnBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  // Added exercises
  addedSection: { marginBottom: 24 },
  addedRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e8e5de",
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
  },
  addedLeft:     { flex: 1 },
  addedMg:       { fontSize: 10, fontWeight: "700", color: "#ff6b35", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  addedName:     { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  addedSets:     { fontSize: 12, color: "#bbb", fontWeight: "600" },
  addedEditBtn:  { backgroundColor: "#f4f2ed", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addedEditText: { fontSize: 12, fontWeight: "700", color: "#555" },
  addedDelBtn:   { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" },
  addedDelText:  { fontSize: 11, fontWeight: "700", color: "#f43f5e" },

  // Notes
  notesSection: { marginBottom: 10 },
  notesInput: {
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e8e5de",
    borderRadius: 14, padding: 14, fontSize: 14, color: "#1a1a1a",
    minHeight: 76, textAlignVertical: "top",
  },

  // Bottom bar — fixed, keyboard proof
  bottomBar: {
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    backgroundColor: "#fafaf8",
    borderTopWidth: 1, borderTopColor: "#f0ede8",
  },
  saveBtn: {
    backgroundColor: "#1a1a1a", borderRadius: 14,
    paddingVertical: 17, alignItems: "center",
  },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  // ── Step 2: Exercises ──
  exItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: "#e8e5de",
    paddingVertical: 15, paddingHorizontal: 16, marginBottom: 8,
  },
  exItemAdded:  { borderColor: "rgba(255,107,53,0.3)", backgroundColor: "rgba(255,107,53,0.03)" },
  exItemName:   { flex: 1, fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  exItemArrow:  { fontSize: 16, color: "#ccc", fontWeight: "600" },

  // ── Step 3: Sets ──
  mgTag:     { fontSize: 11, fontWeight: "700", color: "#ff6b35", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  setTitle:  { fontSize: 20, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.4 },

  colHeaders: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f0ede8",
  },
  colLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1,
    textTransform: "uppercase", color: "#ccc",
  },

  setRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f8f6f3",
  },
  setNum:     { width: 44, height: 52, borderRadius: 12, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  setNumText: { fontSize: 10, fontWeight: "800", color: "#bbb" },

  setInput: {
    flex: 1, height: 50,
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#e8e5de",
    borderRadius: 12, fontSize: 26, fontWeight: "500",
    textAlign: "center", color: "#1a1a1a",
  },

  delSetBtn:  { width: 44, height: 52, borderRadius: 12, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecdd3", alignItems: "center", justifyContent: "center" },
  delSetText: { fontSize: 24, color: "#f43f5e", fontWeight: "300", lineHeight: 28 },

  addSetRow: {
    marginHorizontal: 20, marginTop: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "#e0ddd6",
    alignItems: "center",
  },
  addSetText: { fontSize: 14, fontWeight: "700", color: "#ff6b35" },

  doneBtn: {
    backgroundColor: "#ff6b35", borderRadius: 14,
    paddingVertical: 17, alignItems: "center",
  },
  doneBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },

  // ── Saved ──
  savedWrap:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  savedCheck:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", borderWidth: 1.5, borderColor: "#bbf7d0", alignItems: "center", justifyContent: "center" },
  savedCheckText: { fontSize: 32, color: "#22c55e" },
  savedTitle:     { fontSize: 24, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  savedSub:       { fontSize: 14, color: "#bbb" },
});
// ─── ProgressScreen ───────────────────────────────────────────────────────────
function ProgressScreen({ logs }) {
  const muscleStats = buildMuscleStats(logs);
  if (logs.length === 0) {
    return (
      <View style={ps.empty}>
        <Text style={{ fontSize: 48 }}>🏋️</Text>
        <Text style={ps.emptyTitle}>No workouts yet</Text>
        <Text style={ps.emptySub}>Log your first session to start tracking progress</Text>
      </View>
    );
  }
  return (
    <ScrollView style={ps.scroll} showsVerticalScrollIndicator={false}>
      <Text style={ps.sectionLabel}>Body parts</Text>
      <View style={{ gap: 10 }}>
        {muscleStats.map(({ mg, lastBest, delta, exNames, sessionCount }) => (
          <MuscleAccordionRow key={mg} mg={mg} lastBest={lastBest} delta={delta}
            exNames={exNames} sessionCount={sessionCount} logs={logs} />
        ))}
      </View>
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}
const ps = StyleSheet.create({
  scroll:       { padding: 18 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 12 },
  empty:        { alignItems: "center", justifyContent: "center", padding: 80, gap: 14 },
  emptyTitle:   { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  emptySub:     { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 22 },
});

// ─── HistoryScreen ────────────────────────────────────────────────────────────
function HistoryScreen({ logs, loading, onDelete, confirmDeleteId }) {
  if (loading) return <ActivityIndicator style={{ padding: 60 }} color="#ff6b35" size="large" />;
  if (!logs.length) {
    return (
      <View style={hs.empty}>
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text style={hs.emptyTitle}>No workouts logged yet</Text>
        <Text style={hs.emptySub}>Your history will appear here</Text>
      </View>
    );
  }
  return (
    <ScrollView style={hs.scroll} showsVerticalScrollIndicator={false}>
      {logs.map((log) => {
        const isPending = confirmDeleteId === log._id;
        const date = new Date(log.date);
        return (
          <View key={log._id} style={hs.card}>
            <View style={hs.cardHeader}>
              <View style={hs.dateBox}>
                <Text style={hs.dateMonth}>{date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</Text>
                <Text style={hs.dateDay}>{date.getDate()}</Text>
              </View>
              <Text style={hs.weekday}>{date.toLocaleDateString("en-US", { weekday: "long" })}</Text>
              <Pressable onPress={() => onDelete(log._id)} style={[hs.deleteBtn, isPending && hs.deleteBtnPending]}>
                <Text style={[hs.deleteBtnText, isPending && hs.deleteBtnTextPending]}>
                  {isPending ? "Confirm?" : "Delete"}
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 7, marginTop: 10 }}>
              {log.exercises.map((ex, i) => (
                <View key={i} style={hs.exRow}>
                  <Text style={hs.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={hs.exStats}>{ex.sets.length} sets · {maxW(ex.sets)} lbs · {totalVol(ex.sets).toLocaleString()} vol</Text>
                </View>
              ))}
            </View>
            {log.notes ? <Text style={hs.notes}>"{log.notes}"</Text> : null}
          </View>
        );
      })}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}
const hs = StyleSheet.create({
  scroll:               { padding: 18 },
  empty:                { alignItems: "center", padding: 80, gap: 14 },
  emptyTitle:           { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  emptySub:             { fontSize: 14, color: "#aaa" },
  card:                 { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e8e5de", padding: 16, marginBottom: 12 },
  cardHeader:           { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBox:              { width: 46, height: 46, borderRadius: 14, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  dateMonth:            { fontSize: 8, fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: 0.6 },
  dateDay:              { fontSize: 18, fontWeight: "800", color: "#fff", lineHeight: 20 },
  weekday:              { flex: 1, fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  deleteBtn:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  deleteBtnPending:     { backgroundColor: "rgba(244,63,94,0.08)" },
  deleteBtnText:        { fontSize: 12, fontWeight: "700", color: "#ccc" },
  deleteBtnTextPending: { color: "#f43f5e" },
  exRow:                { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  exName:               { fontSize: 14, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  exStats:              { fontSize: 12, color: "#aaa", flexShrink: 0 },
  notes:                { fontSize: 13, color: "#aaa", fontStyle: "italic", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e8e5de" },
});



// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [tab,             setTab]             = useState("progress");
  const [logs,            setLogs]            = useState([]);
  const [loadingLogs,     setLoadingLogs]     = useState(true);
  const [showLog,         setShowLog]         = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [chartOpen,       setChartOpen]       = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();


  useEffect(() => {
  AsyncStorage.getItem("user").then(raw => {
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setUserName(user.name?.split(" ")[0] ?? "");
      } catch {}
    }
  });
}, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const token = await getToken();
      const res   = await fetch("https://yourpocketgym.com/api/tracking?limit=400", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) { console.error("fetchLogs error:", e); }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const deleteLog = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    try {
      const token = await getToken();
      await fetch(`https://yourpocketgym.com/api/tracking?id=${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { console.error("deleteLog error:", e); }
    setConfirmDeleteId(null);
    fetchLogs();
  };

  function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

  const weekDays    = getWeekActivity(logs);
  const streakCount = weekDays.filter((d) => d.active).length;
  const weekStart   = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekVolume = logs
    .filter((l) => new Date(l.date) >= weekStart)
    .reduce((s, l) => s + totalVolLog(l), 0);
  return (
    <View style={t.root}>
      <StatusBar barStyle="dark-content" />

      <View style={t.header}>
        <View style={t.titleRow}>
          <View>
            <Text style={t.subtitle}>Good {getGreeting()}{userName ? `, ${userName}` : ""}</Text>
<Text style={t.title}>Tracker</Text>
          </View>
          {/* ✅ FIX: + is now on the LEFT, profile on the RIGHT */}
          <View style={t.headerButtons}>
            {/* <Pressable onPress={() => setShowLog(true)} style={t.addBtn}>
              <Text style={t.addBtnText}>＋</Text>
            </Pressable> */}
            <Pressable onPress={() => router.push("/profile")} style={t.avatarBtn}>
              <Text style={t.avatarIcon}>👤</Text>
            </Pressable>
          </View>
        </View>

        {!loadingLogs && (
          <View>
            <Pressable onPress={() => setChartOpen((o) => !o)}>
              <View style={t.streakRow}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <Text style={t.streakCount}>{streakCount}</Text>
                  <Text style={t.streakOf}>/ 7 sessions</Text>
                  {weekVolume > 0 && <Text style={t.weekVol}>· {weekVolume.toLocaleString()} lbs</Text>}
                </View>
                <View style={[t.badge, streakCount >= 3 && t.badgeActive]}>
                  <Text style={[t.badgeText, streakCount >= 3 && t.badgeTextActive]}>
                    {streakCount >= 5 ? "🔥 On fire" : streakCount >= 3 ? "⚡ Good week" : "💪 Keep going"}
                  </Text>
                </View>
              </View>
              <View style={t.weekDots}>
                {weekDays.map((d, i) => (
                  <View key={i} style={t.dayCol}>
                    <View style={[t.dot, d.active && t.dotActive, d.today && !d.active && t.dotToday]}>
                      {d.active && <Text style={[t.dotCheck, d.today && t.dotCheckToday]}>✓</Text>}
                    </View>
                    <Text style={[t.dayLabel, d.today && t.dayLabelToday]}>{d.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={t.chartToggle}>{chartOpen ? "▲ Hide" : "▼ Year view"}</Text>
            </Pressable>
            {chartOpen && (
              <View style={t.yearChartContainer}>
                <View style={t.yearChartDivider} />
                <Text style={t.yearChartTitle}>Past year</Text>
                <YearChart logs={logs} />
              </View>
            )}
          </View>
        )}

        <View style={t.tabs}>
          {[["progress", "Progress"], ["history", "History"]].map(([key, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[t.tab, tab === key && t.tabActive]}>
              <Text style={[t.tabText, tab === key && t.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "progress" && <ProgressScreen logs={logs} />}
        {tab === "history"  && (
          <HistoryScreen logs={logs} loading={loadingLogs} onDelete={deleteLog} confirmDeleteId={confirmDeleteId} />
        )}
      </View>

      {!showLog && (
        <View style={t.fab}>
          <Pressable onPress={() => setShowLog(true)} style={t.fabBtn}>
            <LinearGradient colors={["#232323", "#000000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={t.fabBtnGrad}>
              <Text style={t.fabBtnText}>＋ Log workout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
      {showLog && <LogSheet onClose={() => setShowLog(false)} onSaved={fetchLogs} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const t = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#fafaf8" },
  header:          { backgroundColor: "#fafaf8", paddingHorizontal: 25, paddingTop: Platform.OS === "ios" ? 62 : 22, borderBottomWidth: 1, borderBottomColor: "rgba(232,229,222,0.5)" },
  titleRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  subtitle:        { fontSize: 13, color: "#aaa", marginBottom: 3, fontWeight: "500" },
  title:           { fontSize: 28, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.8 },
  headerButtons:   { flexDirection: "row", alignItems: "center", gap: 10 },
  // ✅ + button is first (left), profile is second (right) LogSheet
  addBtn:          { width: 44, height: 44, borderRadius: 14, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  addBtnText:      { fontSize: 22, color: "#fff", fontWeight: "300" },
  avatarBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e8e5de", alignItems: "center", justifyContent: "center" },
  avatarIcon:      { fontSize: 18 },
  streakRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  streakCount:     { fontSize: 26, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 },
  streakOf:        { fontSize: 13, color: "#bbb" },
  weekVol:         { fontSize: 12, color: "#aaa" },
  badge:           { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "#f4f2ed" },
  badgeActive:     { backgroundColor: "rgba(255,107,53,0.09)" },
  badgeText:       { fontSize: 12, fontWeight: "700", color: "#bbb", letterSpacing: 0.3 },
  badgeTextActive: { color: "#ff6b35" },
  weekDots:        { flexDirection: "row", gap: 6, marginBottom: 12 },
  dayCol:          { flex: 1, alignItems: "center", gap: 6 },
  dot:             { width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dotActive:       { backgroundColor: "#1a1a1a" },
  dotToday:        { borderWidth: 2, borderColor: "#ff6b35" },
  dotCheck:        { color: "#fff", fontWeight: "800", fontSize: 13 },
  dotCheckToday:   { color: "#ff6b35" },
  dayLabel:        { fontSize: 10, fontWeight: "700", color: "#ccc", letterSpacing: 0.3 },
  dayLabelToday:   { color: "#ff6b35" },
  tabs:            { flexDirection: "row", gap: 4 },
  tab:             { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:       { borderBottomColor: "#ff6b35" },
  tabText:         { fontSize: 15, fontWeight: "700", color: "#aaa" },
  tabTextActive:   { color: "#1a1a1a" },
  chartToggle:     { fontSize: 11, fontWeight: "700", color: "#ccc", letterSpacing: 0.6, textTransform: "uppercase", textAlign: "right", paddingBottom: 10, marginTop: 4 },
  yearChartContainer: { paddingBottom: 10 },
  yearChartDivider:   { height: 1, backgroundColor: "#e8e5de", marginBottom: 14 },
  yearChartTitle:     { fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 10 },
  fab:             { position: "absolute", bottom: 0, left: 0, right: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 10 : 10 },
  fabBtn:          { borderRadius: 18, overflow: "hidden", shadowColor: "#ff6b35", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  fabBtnGrad:      { paddingVertical: 18, alignItems: "center", borderRadius: 18 },
  fabBtnText:      { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
});
//added