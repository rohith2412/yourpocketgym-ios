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
import { getToken } from "../src/auth/storage";

// ─── helpers ──────────────────────────────────────────────────────────────────
const totalVol = (sets) => sets.reduce((s, x) => s + x.reps * x.weight, 0);
const maxW = (sets) => sets.length ? Math.max(...sets.map((s) => s.weight)) : 0;

function getWeekActivity(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toLocaleDateString("en-CA");
    const hasLog = logs.some(
      (l) => new Date(l.date).toLocaleDateString("en-CA") === iso
    );
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
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );
}

const toISODate = (date) => new Date(date).toLocaleDateString("en-CA");

function buildYearGrid(logs) {
  const volByDate = {};
  logs.forEach((log) => {
    const iso = toISODate(log.date);
    const volume = log.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
      0
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
      if (cursor > today) {
        week.push(null);
      } else {
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
  const intensity = vol / maxVol;
  if (intensity < 0.25) return "#ffd4c2";
  if (intensity < 0.5)  return "#ff9f7a";
  if (intensity < 0.75) return "#ff6b35";
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
      const mgExercises = log.exercises.filter((e) => (e.muscleGroup || "").trim() === mg);
      const weights = mgExercises.flatMap((e) => e.sets.map((s) => s.weight));
      const vols    = mgExercises.flatMap((e) => e.sets.map((s) => s.reps * s.weight));
      const best    = weights.length ? Math.max(...weights) : 0;
      const vol     = vols.reduce((a, b) => a + b, 0);
      const names   = [...new Set(mgExercises.map((e) => e.name))];
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
const CELL = 11;
const GAP  = 3;
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 18;

function YearChart({ logs }) {
  const { weeks, maxVol } = buildYearGrid(logs);
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);

  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearSessions = logs.filter((l) => new Date(l.date) >= yearStart).length;

  const longestStreak = (() => {
    let best = 0, cur = 0;
    weeks.flat().filter(Boolean).forEach((d) => {
      if (d.hasLog) { cur++; best = Math.max(best, cur); }
      else cur = 0;
    });
    return best;
  })();

  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        wi, x: wi * STEP,
        label: new Date(first.date).toLocaleDateString("en-US", { month: "short" }),
      });
      lastMonth = m;
    }
  });

  const gridWidth  = weeks.length * STEP;
  const DAY_NAMES  = ["", "Mon", "", "Wed", "", "Fri", ""];

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={{ width: gridWidth }}>
              <View style={{ height: 14, marginBottom: 4 }}>
                {monthLabels.map(({ wi, x, label }) => (
                  <Text key={wi} style={[yc.monthLabel, { position: "absolute", left: x }]} numberOfLines={1}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: GAP }}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                    {week.map((day, di) => (
                      <Pressable
                        key={di}
                        onPress={() => {
                          if (!day?.hasLog) return;
                          setTooltip(tooltip?.date === day.date ? null : day);
                        }}
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
          <Text style={yc.tooltipDate}>
            {new Date(tooltip.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </Text>
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
  container:  { marginTop: 4 },
  statsRow:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:   { flex: 1, backgroundColor: "#f4f2ed", borderRadius: 12, padding: 10 },
  statLabel:  { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa", marginBottom: 3 },
  statValue:  { fontSize: 20, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  statUnit:   { fontSize: 11, fontWeight: "400", color: "#aaa" },
  dayLabel:   { fontSize: 8, fontWeight: "600", color: "#bbb", lineHeight: CELL },
  monthLabel: { position: "absolute", fontSize: 9, fontWeight: "700", color: "#aaa", letterSpacing: 0.4, width: 30 },
  cell:       { width: CELL, height: CELL, borderRadius: 2 },
  tooltip:    { marginTop: 10, backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  tooltipDate:{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.55)", marginBottom: 2 },
  tooltipVol: { fontSize: 13, fontWeight: "800", color: "#ff6b35" },
  legend:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" },
  legendLabel:{ fontSize: 9, color: "#bbb", fontWeight: "600" },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});

// ─── DeltaBadge ───────────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined)
    return <View style={[bs.base, bs.neutral]}><Text style={[bs.text, { color: "#aaa" }]}>1st</Text></View>;
  if (delta === 0)
    return <View style={[bs.base, bs.neutral]}><Text style={[bs.text, { color: "#aaa" }]}>- 0</Text></View>;
  const up = delta > 0;
  return (
    <View style={[bs.base, up ? bs.up : bs.down]}>
      <Text style={[bs.text, { color: up ? "#16a34a" : "#f43f5e" }]}>
        {up ? "▲" : "▼"} {Math.abs(delta)}
      </Text>
    </View>
  );
}
const bs = StyleSheet.create({
  base:    { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start" },
  up:      { backgroundColor: "rgba(34,197,94,0.1)" },
  down:    { backgroundColor: "rgba(244,63,94,0.09)" },
  neutral: { backgroundColor: "#f4f2ed" },
  text:    { fontSize: 11, fontWeight: "700" },
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
  row:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  mgName:     { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  mgSub:      { fontSize: 11, color: "#aaa", marginTop: 2 },
  rowRight:   { flexDirection: "row", alignItems: "center", gap: 8 },
  bestWeight: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  lbs:        { fontSize: 11, fontWeight: "400", color: "#aaa" },
  chevron:    { fontSize: 16, color: "#ccc", marginLeft: 4 },
  expanded:   { borderTopWidth: 1, borderTopColor: "#f0ede8", padding: 16, gap: 10 },
  exHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 6 },
  exName:     { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  exMax:      { fontSize: 11, color: "#aaa" },
  setRow:     { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 4, marginBottom: 4 },
  setNum:     { width: 16, color: "#ccc", fontWeight: "700", textAlign: "center" },
  setDetail:  { color: "#888", fontSize: 12 },
  setVol:     { marginLeft: "auto", color: "#bbb", fontSize: 12 },
  divider:    { height: 1, backgroundColor: "#f0ede8", marginVertical: 8 },
});

// ─── ExercisePicker ───────────────────────────────────────────────────────────
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
                <Pressable
                  key={name}
                  disabled={isAdded}
                  onPress={() => !isAdded && toggle(name)}
                  style={[ep.item, isSel && ep.itemSel, isAdded && ep.itemAdded]}
                >
                  <Text style={[ep.itemText, isSel && ep.itemTextSel]}>{name}</Text>
                  {isAdded
                    ? <Text style={ep.addedLabel}>Added</Text>
                    : isSel
                      ? <Text style={{ color: "#ff6b35", fontWeight: "800", fontSize: 16 }}>✓</Text>
                      : <Text style={{ color: "#ccc", fontSize: 20 }}>+</Text>
                  }
                </Pressable>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
          <View style={ep.footer}>
            <Pressable
              disabled={picked.length === 0}
              onPress={() => onConfirm(picked, muscleGroup)}
              style={[ep.addBtn, picked.length === 0 && ep.addBtnDisabled]}
            >
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
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  panel:         { backgroundColor: "#fafaf8", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%", paddingBottom: 36 },
  handle:        { width: 36, height: 4, backgroundColor: "#e8e5de", borderRadius: 99, alignSelf: "center", marginTop: 12 },
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e8e5de" },
  back:          { fontSize: 13, fontWeight: "700", color: "#aaa" },
  title:         { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  count:         { fontSize: 12, color: "#aaa", minWidth: 70, textAlign: "right" },
  list:          { padding: 12 },
  item:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, marginBottom: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de" },
  itemSel:       { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  itemAdded:     { opacity: 0.4 },
  itemText:      { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  itemTextSel:   { color: "#fff" },
  addedLabel:    { fontSize: 10, fontWeight: "700", color: "#aaa" },
  footer:        { padding: 16, borderTopWidth: 1, borderTopColor: "#e8e5de" },
  addBtn:        { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 15, alignItems: "center" },
  addBtnDisabled:{ opacity: 0.3 },
  addBtnText:    { color: "#fafaf8", fontSize: 15, fontWeight: "700" },
});

// ─── LogSheet ─────────────────────────────────────────────────────────────────
function LogSheet({ onClose, onSaved }) {
  const [exercises, setExercises] = useState([]);
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [pickerMg,  setPickerMg]  = useState(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim,    { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim,    { toValue: 600, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const addSet = (ei) =>
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== ei) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { setNumber: ex.sets.length + 1, reps: last ? last.reps : "", weight: last ? last.weight : "" }],
        };
      })
    );

  const removeSet = (ei, si) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : {
          ...ex,
          sets: ex.sets.filter((_, j) => j !== si).map((s, j) => ({ ...s, setNumber: j + 1 })),
        }
      )
    );

  const updateSet = (ei, si, field, val) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : {
          ...ex,
          sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: val } : s),
        }
      )
    );

  const onPickerConfirm = (names, mg) => {
    setExercises((prev) => [
      ...prev,
      ...names.map((name) => ({ name, muscleGroup: mg, sets: [{ setNumber: 1, reps: "", weight: "" }] })),
    ]);
    setPickerMg(null);
  };

  const submit = async () => {
    if (!exercises.length) { alert("Add at least one exercise."); return; }

    const cleanedExercises = exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
    }));

    const hasZero = cleanedExercises.some((ex) => ex.sets.some((s) => s.reps === 0 || s.weight === 0));
    if (hasZero) { alert("Some sets are missing reps or weight. Please fill them all in."); return; }

    setSaving(true);
    try {
      const token = await getToken();
      const res   = await fetch("https://yourpocketgym.com/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString(), exercises: cleanedExercises, notes }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        onSaved();
        setTimeout(() => onClose(), 1600);
      } else alert(json.error || "Something went wrong.");
    } catch (e) {
      alert("Network error. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const alreadyAdded = exercises.map((e) => e.name);

  return (
    <Modal visible animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View style={[ls.overlay, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[ls.panelWrapper, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={ls.kav}>
          <View style={ls.panel}>
            <View style={ls.handle} />
            {saved ? (
              <View style={ls.savedContainer}>
                <View style={ls.savedIcon}>
                  <Text style={{ fontSize: 24, color: "#22c55e" }}>✓</Text>
                </View>
                <Text style={ls.savedText}>Workout saved!</Text>
              </View>
            ) : (
              <>
                <View style={ls.header}>
                  <Text style={ls.headerTitle}>Log workout</Text>
                  <Pressable onPress={handleClose}>
                    <Text style={ls.closeBtn}>✕</Text>
                  </Pressable>
                </View>
                <ScrollView style={ls.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={ls.sectionLabel}>Select muscle group</Text>
                  <View style={ls.mgGrid}>
                    {MUSCLE_GROUPS.map((mg) => {
                      const count = exercises.filter((e) => e.muscleGroup === mg).length;
                      return (
                        <Pressable
                          key={mg}
                          onPress={() => setPickerMg(mg)}
                          style={[ls.mgBtn, count > 0 && ls.mgBtnActive]}
                        >
                          <Text style={[ls.mgBtnText, count > 0 && ls.mgBtnTextActive]}>{mg}</Text>
                          {count > 0 && (
                            <View style={ls.mgCount}>
                              <Text style={ls.mgCountText}>{count}</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {exercises.length === 0 && (
                    <View style={ls.emptyCard}>
                      <Text style={ls.emptyText}>No exercises yet — tap a muscle group above</Text>
                    </View>
                  )}
                  {exercises.map((ex, ei) => (
                    <View key={ei} style={ls.exCard}>
                      <View style={ls.exCardHeader}>
                        <View>
                          <Text style={ls.exMg}>{ex.muscleGroup}</Text>
                          <Text style={ls.exName}>{ex.name}</Text>
                        </View>
                        <Pressable onPress={() => setExercises((prev) => prev.filter((_, i) => i !== ei))}>
                          <Text style={ls.removeEx}>✕</Text>
                        </Pressable>
                      </View>
                      <View style={ls.setHeader}>
                        {["SET","REPS","LBS",""].map((lbl, i) => (
                          <Text key={i} style={[ls.setHeaderText, i === 3 && { width: 32 }]}>{lbl}</Text>
                        ))}
                      </View>
                      {ex.sets.map((set, si) => (
                        <View key={si} style={ls.setRow}>
                          <Text style={ls.setNum}>{set.setNumber}</Text>
                          <TextInput
                            style={ls.numInput}
                            value={String(set.reps)}
                            placeholder="0"
                            placeholderTextColor="#ccc"
                            keyboardType="numeric"
                            onChangeText={(v) => updateSet(ei, si, "reps", v.replace(/[^0-9]/g, ""))}
                          />
                          <TextInput
                            style={ls.numInput}
                            value={String(set.weight)}
                            placeholder="0"
                            placeholderTextColor="#ccc"
                            keyboardType="decimal-pad"
                            onChangeText={(v) => updateSet(ei, si, "weight", v.replace(/[^0-9.]/g, ""))}
                          />
                          <Pressable onPress={() => removeSet(ei, si)} style={ls.removeSetBtn}>
                            <Text style={ls.removeSetText}>−</Text>
                          </Pressable>
                        </View>
                      ))}
                      <Pressable onPress={() => addSet(ei)}>
                        <Text style={ls.addSetText}>+ Add set</Text>
                      </Pressable>
                    </View>
                  ))}
                  <TextInput
                    style={ls.notesInput}
                    placeholder="Notes (optional)…"
                    placeholderTextColor="#aaa"
                    multiline
                    numberOfLines={2}
                    value={notes}
                    onChangeText={setNotes}
                  />
                  <Pressable onPress={submit} disabled={saving} style={[ls.saveBtn, saving && ls.saveBtnDisabled]}>
                    <Text style={ls.saveBtnText}>
                      {saving ? "Saving…" : `Save workout${exercises.length > 0 ? ` · ${exercises.length} exercise${exercises.length > 1 ? "s" : ""}` : ""}`}
                    </Text>
                  </Pressable>
                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
      {pickerMg && (
        <ExercisePicker
          muscleGroup={pickerMg}
          alreadyAdded={alreadyAdded}
          onConfirm={onPickerConfirm}
          onClose={() => setPickerMg(null)}
        />
      )}
    </Modal>
  );
}
const ls = StyleSheet.create({
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  panelWrapper:   { position: "absolute", bottom: 0, left: 0, right: 0 },
  kav:            { width: "100%", justifyContent: "flex-end" },
  panel:          { backgroundColor: "#fafaf8", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%", paddingBottom: Platform.OS === "ios" ? 36 : 20 },
  handle:         { width: 36, height: 4, backgroundColor: "#e8e5de", borderRadius: 99, alignSelf: "center", marginTop: 12 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e8e5de" },
  headerTitle:    { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  closeBtn:       { fontSize: 18, color: "#ccc", padding: 4 },
  scroll:         { padding: 16 },
  sectionLabel:   { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 10 },
  mgGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mgBtn:          { width: "31%", borderRadius: 14, padding: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", alignItems: "center" },
  mgBtnActive:    { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  mgBtnText:      { fontSize: 12, fontWeight: "700", color: "#1a1a1a" },
  mgBtnTextActive:{ color: "#fff" },
  mgCount:        { backgroundColor: "#ff6b35", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1, marginTop: 4 },
  mgCountText:    { fontSize: 10, fontWeight: "700", color: "#fff" },
  emptyCard:      { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#e8e5de", marginBottom: 12 },
  emptyText:      { fontSize: 13, color: "#aaa" },
  exCard:         { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e8e5de", marginBottom: 12 },
  exCardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  exMg:           { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#ff6b35", marginBottom: 2 },
  exName:         { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  removeEx:       { fontSize: 16, color: "#ccc", padding: 4 },
  setHeader:      { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e8e5de", marginBottom: 6 },
  setHeaderText:  { flex: 1, fontSize: 9, fontWeight: "700", letterSpacing: 1.2, color: "#ccc", textAlign: "center" },
  setRow:         { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  setNum:         { flex: 1, fontSize: 13, color: "#bbb", textAlign: "center", fontWeight: "700" },
  numInput:       { flex: 1, borderWidth: 1, borderColor: "#e8e5de", borderRadius: 10, padding: 8, fontSize: 16, fontWeight: "800", textAlign: "center", color: "#1a1a1a", backgroundColor: "#fafaf8" },
  removeSetBtn:   { width: 32, height: 32, borderWidth: 1, borderColor: "#e8e5de", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  removeSetText:  { fontSize: 18, color: "#bbb" },
  addSetText:     { color: "#ff6b35", fontSize: 13, fontWeight: "700", paddingVertical: 6 },
  notesInput:     { borderWidth: 1, borderColor: "#e8e5de", borderRadius: 14, padding: 14, fontSize: 15, color: "#1a1a1a", backgroundColor: "#fff", marginBottom: 12, minHeight: 60 },
  saveBtn:        { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnDisabled:{ opacity: 0.4 },
  saveBtnText:    { color: "#fafaf8", fontSize: 15, fontWeight: "700" },
  savedContainer: { alignItems: "center", justifyContent: "center", padding: 48, gap: 12 },
  savedIcon:      { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(34,197,94,0.1)", alignItems: "center", justifyContent: "center" },
  savedText:      { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
});

// ─── ProgressScreen ───────────────────────────────────────────────────────────
function ProgressScreen({ logs }) {
  const muscleStats = buildMuscleStats(logs);
  if (logs.length === 0) {
    return (
      <View style={ps.empty}>
        <Text style={{ fontSize: 36 }}>🏋️</Text>
        <Text style={ps.emptyTitle}>No workouts yet</Text>
        <Text style={ps.emptySub}>Log your first session to start tracking progress</Text>
      </View>
    );
  }
  return (
    <ScrollView style={ps.scroll} showsVerticalScrollIndicator={false}>
      <Text style={ps.sectionLabel}>Body parts</Text>
      <View style={{ gap: 8 }}>
        {muscleStats.map(({ mg, lastBest, delta, exNames, sessionCount }) => (
          <MuscleAccordionRow
            key={mg} mg={mg} lastBest={lastBest} delta={delta}
            exNames={exNames} sessionCount={sessionCount} logs={logs}
          />
        ))}
      </View>
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}
const ps = StyleSheet.create({
  scroll:       { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 10 },
  empty:        { alignItems: "center", justifyContent: "center", padding: 80, gap: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  emptySub:     { fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 20 },
});

// ─── HistoryScreen ────────────────────────────────────────────────────────────
function HistoryScreen({ logs, loading, onDelete, confirmDeleteId }) {
  if (loading) return <ActivityIndicator style={{ padding: 60 }} color="#ff6b35" />;
  if (!logs.length) {
    return (
      <View style={hs.empty}>
        <Text style={{ fontSize: 36 }}>📋</Text>
        <Text style={hs.emptyTitle}>No workouts logged yet</Text>
        <Text style={hs.emptySub}>Your history will appear here</Text>
      </View>
    );
  }
  return (
    <ScrollView style={hs.scroll} showsVerticalScrollIndicator={false}>
      {logs.map((log) => {
        const isPending = confirmDeleteId === log._id;
        const date      = new Date(log.date);
        return (
          <View key={log._id} style={hs.card}>
            <View style={hs.cardHeader}>
              <View style={hs.dateBox}>
                <Text style={hs.dateMonth}>{date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</Text>
                <Text style={hs.dateDay}>{date.getDate()}</Text>
              </View>
              <Text style={hs.weekday}>{date.toLocaleDateString("en-US", { weekday: "long" })}</Text>
              <Pressable
                onPress={() => onDelete(log._id)}
                style={[hs.deleteBtn, isPending && hs.deleteBtnPending]}
              >
                <Text style={[hs.deleteBtnText, isPending && hs.deleteBtnTextPending]}>
                  {isPending ? "Confirm?" : "Delete"}
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 6, marginTop: 8 }}>
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
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}
const hs = StyleSheet.create({
  scroll:              { padding: 16 },
  empty:               { alignItems: "center", padding: 80, gap: 12 },
  emptyTitle:          { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  emptySub:            { fontSize: 13, color: "#aaa" },
  card:                { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e8e5de", padding: 14, marginBottom: 10 },
  cardHeader:          { flexDirection: "row", alignItems: "center", gap: 10 },
  dateBox:             { width: 40, height: 40, borderRadius: 12, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  dateMonth:           { fontSize: 7, fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: 0.6 },
  dateDay:             { fontSize: 15, fontWeight: "800", color: "#fff", lineHeight: 18 },
  weekday:             { flex: 1, fontSize: 14, fontWeight: "800", color: "#1a1a1a" },
  deleteBtn:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  deleteBtnPending:    { backgroundColor: "rgba(244,63,94,0.08)" },
  deleteBtnText:       { fontSize: 11, fontWeight: "700", color: "#ccc" },
  deleteBtnTextPending:{ color: "#f43f5e" },
  exRow:               { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  exName:              { fontSize: 13, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  exStats:             { fontSize: 11, color: "#aaa", flexShrink: 0 },
  notes:               { fontSize: 12, color: "#aaa", fontStyle: "italic", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e8e5de" },
});

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [tab,             setTab]             = useState("progress");
  const [logs,            setLogs]            = useState([]);
  const [loadingLogs,     setLoadingLogs]     = useState(true);
  const [showLog,         setShowLog]         = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [chartOpen,       setChartOpen]       = useState(false);
  const router = useRouter();

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const token = await getToken();
      const res   = await fetch("https://yourpocketgym.com/api/tracking?limit=400", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) {
      console.error("fetchLogs error:", e);
    } finally {
      setLoadingLogs(false);
    }
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
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("deleteLog error:", e);
    }
    setConfirmDeleteId(null);
    fetchLogs();
  };

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
            <Text style={t.subtitle}>Your workouts</Text>
            <Text style={t.title}>Tracker</Text>
          </View>
          <View style={t.headerButtons}>
            <Pressable onPress={() => router.push("/profile")} style={t.avatarBtn}>
              <Text style={t.avatarIcon}>👤</Text>
            </Pressable>
            <Pressable onPress={() => setShowLog(true)} style={t.addBtn}>
              <Text style={t.addBtnText}>＋</Text>
            </Pressable>
          </View>
        </View>

        {!loadingLogs && (
          <View>
            <Pressable onPress={() => setChartOpen((o) => !o)}>
              <View style={t.streakRow}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
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
            <Text style={t.fabBtnText}>＋ Log workout</Text>
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
  header:          { backgroundColor: "#fafaf8", paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 60 : 20, borderBottomWidth: 1, borderBottomColor: "rgba(232,229,222,0.5)" },
  titleRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  subtitle:        { fontSize: 12, color: "#aaa", marginBottom: 2 },
  title:           { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  headerButtons:   { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", alignItems: "center", justifyContent: "center" },
  avatarIcon:      { fontSize: 16 },
  addBtn:          { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e5de", alignItems: "center", justifyContent: "center" },
  addBtnText:      { fontSize: 18, color: "#1a1a1a" },
  streakRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  streakCount:     { fontSize: 20, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  streakOf:        { fontSize: 12, color: "#bbb" },
  weekVol:         { fontSize: 11, color: "#aaa" },
  badge:           { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: "#f4f2ed" },
  badgeActive:     { backgroundColor: "rgba(255,107,53,0.09)" },
  badgeText:       { fontSize: 11, fontWeight: "700", color: "#bbb", letterSpacing: 0.4 },
  badgeTextActive: { color: "#ff6b35" },
  weekDots:        { flexDirection: "row", gap: 5, marginBottom: 12 },
  dayCol:          { flex: 1, alignItems: "center", gap: 5 },
  dot:             { width: "100%", aspectRatio: 1, borderRadius: 9, backgroundColor: "#f4f2ed", alignItems: "center", justifyContent: "center" },
  dotActive:       { backgroundColor: "#1a1a1a" },
  dotToday:        { borderWidth: 2, borderColor: "#ff6b35" },
  dotCheck:        { color: "#fff", fontWeight: "800", fontSize: 11 },
  dotCheckToday:   { color: "#ff6b35" },
  dayLabel:        { fontSize: 9, fontWeight: "700", color: "#ccc", letterSpacing: 0.3 },
  dayLabelToday:   { color: "#ff6b35" },
  tabs:            { flexDirection: "row", gap: 4 },
  tab:             { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:       { borderBottomColor: "#ff6b35" },
  tabText:         { fontSize: 13, fontWeight: "700", color: "#aaa" },
  tabTextActive:   { color: "#1a1a1a" },
  chartToggle:     { fontSize: 10, fontWeight: "700", color: "#ccc", letterSpacing: 0.6, textTransform: "uppercase", textAlign: "right", paddingBottom: 8, marginTop: 4 },
  yearChartContainer: { paddingBottom: 8 },
  yearChartDivider:   { height: 1, backgroundColor: "#e8e5de", marginBottom: 12 },
  yearChartTitle:     { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#aaa", marginBottom: 8 },
  fab:             { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16 },
  fabBtn:          { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  fabBtnText:      { color: "#fafaf8", fontSize: 15, fontWeight: "700", letterSpacing: 0.1 },
});