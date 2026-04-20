import AvatarButton from "@/components/AvatarButton";
import PageBackground from "@/components/PageBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteWorkoutLog,
  getAllWorkoutLogs,
  saveWorkoutLog,
  saveWorkoutLogs,
} from "@/src/db/gymDb";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { getToken } from "../src/auth/storage";
//good
// ─── helpers tracker headerButtons History  done back to ────────────────────────────────────────────────────────────────── log work
const totalVol = (sets) => sets.reduce((s, x) => s + x.reps * x.weight, 0);
const maxW = (sets) =>
  sets.length ? Math.max(...sets.map((s) => s.weight)) : 0;

function getWeekActivity(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toLocaleDateString("en-CA");
    const hasLog = logs.some(
      (l) => new Date(l.date).toLocaleDateString("en-CA") === iso,
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
    0,
  );
}

const toISODate = (date) => new Date(date).toLocaleDateString("en-CA");

function buildYearGrid(logs) {
  const volByDate = {};
  logs.forEach((log) => {
    const iso = toISODate(log.date);
    const volume = log.exercises.reduce(
      (sum, ex) =>
        sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
      0,
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
        week.push({
          date: iso,
          vol: volByDate[iso] || 0,
          hasLog: !!volByDate[iso],
        });
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
  if (i < 0.5) return "#ff9f7a";
  if (i < 0.75) return "#7c3aed";
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
      const mgExs = log.exercises.filter(
        (e) => (e.muscleGroup || "").trim() === mg,
      );
      const weights = mgExs.flatMap((e) => e.sets.map((s) => s.weight));
      const vols = mgExs.flatMap((e) => e.sets.map((s) => s.reps * s.weight));
      const best = weights.length ? Math.max(...weights) : 0;
      const vol = vols.reduce((a, b) => a + b, 0);
      const names = [...new Set(mgExs.map((e) => e.name))];
      if (!grouped[mg]) grouped[mg] = [];
      grouped[mg].push({
        logId: log._id,
        date: log.date,
        bestWeight: best,
        totalVol: vol,
        exNames: names,
      });
    });
  });
  return Object.entries(grouped)
    .map(([mg, sessions]) => {
      const last = sessions[0];
      const prev = sessions[1] || null;
      const delta = prev !== null ? last.bestWeight - prev.bestWeight : null;
      const allNames = [...new Set(sessions.flatMap((s) => s.exNames))];
      return {
        mg,
        lastBest: last.bestWeight,
        delta,
        exNames: allNames,
        sessionCount: sessions.length,
      };
    })
    .sort((a, b) => a.mg.localeCompare(b.mg));
}

const EXERCISE_LIBRARY = {
  Chest: [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Dumbbell Fly",
    "Cable Fly",
    "Push-Up",
    "Chest Dip",
    "Incline Dumbbell Press",
    "Pec Deck Machine",
    "Landmine Press",
  ],
  Back: [
    "Pull-Up",
    "Chin-Up",
    "Lat Pulldown",
    "Seated Cable Row",
    "Barbell Row",
    "Dumbbell Row",
    "T-Bar Row",
    "Face Pull",
    "Deadlift",
    "Romanian Deadlift",
    "Good Morning",
    "Back Extension",
  ],
  Shoulders: [
    "Overhead Press",
    "Dumbbell Shoulder Press",
    "Arnold Press",
    "Lateral Raise",
    "Front Raise",
    "Rear Delt Fly",
    "Upright Row",
    "Cable Lateral Raise",
    "Machine Shoulder Press",
    "Shrug",
  ],
  Arms: [
    "Barbell Curl",
    "Dumbbell Curl",
    "Hammer Curl",
    "Preacher Curl",
    "Cable Curl",
    "Incline Dumbbell Curl",
    "Concentration Curl",
    "Tricep Pushdown",
    "Skull Crusher",
    "Close-Grip Bench",
    "Overhead Tricep Extension",
    "Dips",
    "Diamond Push-Up",
  ],
  Legs: [
    "Squat",
    "Front Squat",
    "Leg Press",
    "Hack Squat",
    "Bulgarian Split Squat",
    "Lunge",
    "Romanian Deadlift",
    "Leg Curl",
    "Leg Extension",
    "Calf Raise",
    "Glute Bridge",
    "Hip Thrust",
    "Step-Up",
    "Sumo Deadlift",
  ],
  Core: [
    "Plank",
    "Crunch",
    "Sit-Up",
    "Leg Raise",
    "Hanging Leg Raise",
    "Ab Wheel Rollout",
    "Cable Crunch",
    "Russian Twist",
    "Bicycle Crunch",
    "Dead Bug",
    "Pallof Press",
    "Dragon Flag",
  ],
};
const MUSCLE_GROUPS = Object.keys(EXERCISE_LIBRARY);

// ─── YearChart ────────────────────────────────────────────────────────────────
const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 20;

function YearChart({ logs }) {
  const { weeks, maxVol } = buildYearGrid(logs);
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearSessions = logs.filter((l) => new Date(l.date) >= yearStart).length;
  const longestStreak = (() => {
    let best = 0,
      cur = 0;
    weeks
      .flat()
      .filter(Boolean)
      .forEach((d) => {
        if (d.hasLog) {
          cur++;
          best = Math.max(best, cur);
        } else cur = 0;
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
        wi,
        x: wi * STEP,
        label: new Date(first.date).toLocaleDateString("en-US", {
          month: "short",
        }),
      });
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
          <Text style={yc.statValue}>
            {yearSessions}
            <Text style={yc.statUnit}> sessions</Text>
          </Text>
        </View>
        <View style={yc.statCard}>
          <Text style={yc.statLabel}>Longest streak</Text>
          <Text style={yc.statValue}>
            {longestStreak}
            <Text style={yc.statUnit}> days</Text>
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: DAY_LABEL_WIDTH, marginTop: 18 }}>
          {DAY_NAMES.map((name, di) => (
            <View
              key={di}
              style={{
                height: CELL,
                marginBottom: GAP,
                justifyContent: "center",
              }}
            >
              {name !== "" && <Text style={yc.dayLabel}>{name}</Text>}
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            <View style={{ width: gridWidth }}>
              <View style={{ height: 14, marginBottom: 4 }}>
                {monthLabels.map(({ wi, x, label }) => (
                  <Text
                    key={wi}
                    style={[yc.monthLabel, { position: "absolute", left: x }]}
                    numberOfLines={1}
                  >
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
                        style={[
                          yc.cell,
                          {
                            backgroundColor: day
                              ? cellColor(day.vol, maxVol, day.hasLog)
                              : "transparent",
                          },
                        ]}
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
            {new Date(tooltip.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text style={yc.tooltipVol}>
            {tooltip.vol.toLocaleString()} lbs volume
          </Text>
        </View>
      )}
      <View style={yc.legend}>
        <Text style={yc.legendLabel}>Less</Text>
        {["#f0ede6", "#ffd4c2", "#ff9f7a", "#7c3aed", "#c8410d"].map((c) => (
          <View key={c} style={[yc.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={yc.legendLabel}>More</Text>
      </View>
    </View>
  );
}
const yc = StyleSheet.create({
  container: { marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#f4f2ed",
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#aaa",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  statUnit: { fontSize: 12, fontWeight: "400", color: "#aaa" },
  dayLabel: { fontSize: 8, fontWeight: "600", color: "#bbb", lineHeight: CELL },
  monthLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.4,
    width: 30,
  },
  cell: { width: CELL, height: CELL, borderRadius: 3 },
  tooltip: {
    marginTop: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  tooltipDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  tooltipVol: { fontSize: 14, fontWeight: "800", color: "#7c3aed" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    justifyContent: "flex-end",
  },
  legendLabel: { fontSize: 10, color: "#bbb", fontWeight: "600" },
  legendCell: { width: 11, height: 11, borderRadius: 2 },
});

// ─── DeltaBadge ───────────────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined)
    return (
      <View style={[bs.base, bs.neutral]}>
        <Text style={[bs.text, { color: "#aaa" }]}>1st</Text>
      </View>
    );
  if (delta === 0)
    return (
      <View style={[bs.base, bs.neutral]}>
        <Text style={[bs.text, { color: "#aaa" }]}>= 0</Text>
      </View>
    );
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
  base: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  up: { backgroundColor: "rgba(34,197,94,0.1)" },
  down: { backgroundColor: "rgba(244,63,94,0.09)" },
  neutral: { backgroundColor: "#f4f2ed" },
  text: { fontSize: 12, fontWeight: "700" },
});

// ─── MuscleAccordionRow ───────────────────────────────────────────────────────
function MuscleAccordionRow({
  mg,
  lastBest,
  delta,
  exNames,
  sessionCount,
  logs,
}) {
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
          <Text style={ms.mgSub}>
            {sessionCount} session{sessionCount !== 1 ? "s" : ""} ·{" "}
            {exNames.length} exercise{exNames.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={ms.rowRight}>
          <Text style={ms.bestWeight}>
            {lastBest}
            <Text style={ms.lbs}> lbs</Text>
          </Text>
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
                  <Text style={ms.setDetail}>
                    {s.reps} reps × {s.weight} lbs
                  </Text>
                  <Text style={ms.setVol}>
                    {(s.reps * s.weight).toLocaleString()} vol
                  </Text>
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5de",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  mgName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  mgSub: { fontSize: 12, color: "#aaa", marginTop: 3 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  bestWeight: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  lbs: { fontSize: 12, fontWeight: "400", color: "#aaa" },
  chevron: { fontSize: 18, color: "#ccc", marginLeft: 4 },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
    padding: 18,
    gap: 10,
  },
  exHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 6,
  },
  exName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  exMax: { fontSize: 12, color: "#aaa" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 4,
    marginBottom: 5,
  },
  setNum: {
    width: 18,
    color: "#ccc",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 13,
  },
  setDetail: { color: "#888", fontSize: 13 },
  setVol: { marginLeft: "auto", color: "#bbb", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#f0ede8", marginVertical: 8 },
});

// ─── ExercisePicker touch: { alignSelf: "auto" }, ─────────────────────────────────────────────────────────── log workout
function ExercisePicker({ muscleGroup, alreadyAdded, onConfirm, onClose }) {
  const list = EXERCISE_LIBRARY[muscleGroup] || [];
  const [picked, setPicked] = useState([]);
  const toggle = (name) =>
    setPicked((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ep.overlay}>
        <View style={ep.panel}>
          <View style={ep.handle} />
          <View style={ep.header}>
            <Pressable onPress={onClose}>
              <Text style={ep.back}>← Back</Text>
            </Pressable>
            <Text style={ep.title}>{muscleGroup}</Text>
            <Text style={ep.count}>{picked.length} selected</Text>
          </View>
          <ScrollView style={ep.list} showsVerticalScrollIndicator={false}>
            {list.map((name) => {
              const isAdded = alreadyAdded.includes(name);
              const isSel = picked.includes(name);
              return (
                <Pressable
                  key={name}
                  disabled={isAdded}
                  onPress={() => !isAdded && toggle(name)}
                  style={[
                    ep.item,
                    isSel && ep.itemSel,
                    isAdded && ep.itemAdded,
                  ]}
                >
                  <Text style={[ep.itemText, isSel && ep.itemTextSel]}>
                    {name}
                  </Text>
                  {isAdded ? (
                    <Text style={ep.addedLabel}>Added</Text>
                  ) : isSel ? (
                    <Text
                      style={{
                        color: "#7c3aed",
                        fontWeight: "800",
                        fontSize: 18,
                      }}
                    >
                      ✓
                    </Text>
                  ) : (
                    <Text style={{ color: "#ccc", fontSize: 22 }}>+</Text>
                  )}
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
                Add{" "}
                {picked.length > 0
                  ? `${picked.length} exercise${picked.length > 1 ? "s" : ""}`
                  : "exercises"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const ep = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: "#fafaf8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e8e5de",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e5de",
  },
  back: { fontSize: 15, fontWeight: "700", color: "#aaa" },
  title: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  count: { fontSize: 13, color: "#aaa", minWidth: 70, textAlign: "right" },
  list: { padding: 14 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
  },
  itemSel: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  itemAdded: { opacity: 0.4 },
  itemText: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  itemTextSel: { color: "#fff" },
  addedLabel: { fontSize: 11, fontWeight: "700", color: "#aaa" },
  footer: { padding: 18, borderTopWidth: 1, borderTopColor: "#e8e5de" },
  addBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.3 },
  addBtnText: { color: "#fafaf8", fontSize: 16, fontWeight: "700" },
});

// ─── LogSheet ─────────────────────────────────────────────────────────────────
// ✅ FIX: Completely rebuilt - keyboard no longer pushes screen up.
// The fix is: ScrollView sits OUTSIDE KeyboardAvoidingView so only the
// save button area nudges up, not the whole modal content.
// ─── LogSheet ─────────────────────────────────────────────────────────────────
// ✅ FIX: Removed KeyboardAvoidingView entirely.
// ScrollView uses keyboardShouldPersistTaps + automaticallyAdjustKeyboardInsets
// so content scrolls naturally when keyboard appears. Save button is fixed
// at the bottom with paddingBottom that accounts for keyboard via inputAccessoryView
// pattern - no jumping, no empty gap.
// ─── LogSheet - Fully Redesigned ─────────────────────────────────────────────
// New approach: Step-based flow. No nested ScrollView + KAV conflicts.
// Step 1: Pick muscle group → Step 2: Pick exercise → Step 3: Log sets
// Sets are entered in a fixed bottom panel - keyboard cannot break anything.
const MG_META: Record<string, { color: string }> = {
  Chest: { color: "#7c3aed" },
  Back: { color: "#6366f1" },
  Shoulders: { color: "#f59e0b" },
  Arms: { color: "#22c55e" },
  Legs: { color: "#3b82f6" },
  Core: { color: "#ef4444" },
};

function LogSheet({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"muscles" | "exercises" | "sets">("muscles");
  const [activeMg, setActiveMg] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [activeEx, setActiveEx] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const slideAnim = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 68,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const currentEx = activeEx !== null ? exercises[activeEx] : null;
  const alreadyAdded = exercises.map((e) => e.name);

  const pickMuscle = (mg: string) => {
    setActiveMg(mg);
    setStep("exercises");
  };

  const pickExercise = (name: string) => {
    const existing = exercises.findIndex((e) => e.name === name);
    if (existing >= 0) {
      setActiveEx(existing);
    } else {
      setExercises((prev) => [
        ...prev,
        { name, mg: activeMg, sets: [{ reps: "", weight: "" }] },
      ]);
      setActiveEx(exercises.length);
    }
    setStep("sets");
  };

  const updateSet = (si: number, field: string, val: string) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== activeEx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s: any, j: number) =>
                j === si ? { ...s, [field]: val } : s,
              ),
            },
      ),
    );

  const addSet = () =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== activeEx
          ? ex
          : { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] },
      ),
    );

  const removeSet = (si: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== activeEx
          ? ex
          : { ...ex, sets: ex.sets.filter((_: any, j: number) => j !== si) },
      ),
    );

  const removeExercise = (ei: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== ei));

  const doneWithSets = () => {
    setActiveEx(null);
    setStep("muscles");
  };

  const submit = async () => {
    if (!exercises.length) {
      alert("Add at least one exercise.");
      return;
    }
    const cleaned = exercises.map((ex) => ({
      name: ex.name,
      muscleGroup: ex.mg,
      sets: ex.sets.map((s: any, i: number) => ({
        setNumber: i + 1,
        reps: Number(s.reps) || 0,
        weight: Number(s.weight) || 0,
      })),
    }));
    if (
      cleaned.some((ex) => ex.sets.some((s) => s.reps === 0 || s.weight === 0))
    ) {
      alert("Fill in all reps and weights.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("https://yourpocketgym.com/api/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          exercises: cleaned,
          notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Cache in SQLite so it shows instantly next open
        try { saveWorkoutLog(json.data); } catch {}
        setSaved(true);
        onSaved();
        setTimeout(() => onClose(), 1600);
      } else alert(json.error || "Something went wrong.");
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };
  //good
  const stepIndex = step === "muscles" ? 0 : step === "exercises" ? 1 : 2;

  return (
    <Modal visible animationType="none" transparent onRequestClose={dismiss}>
      <Animated.View style={[lg.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      <Animated.View
        style={[lg.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={lg.handle} />

        {/* ── SAVED ── */}
        {saved && (
          <View style={lg.savedWrap}>
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={lg.savedCircle}
            >
              <Text style={lg.savedCheckText}>✓</Text>
            </LinearGradient>
            <Text style={lg.savedTitle}>Workout Saved!</Text>
            <Text style={lg.savedSub}>Keep grinding</Text>
          </View>
        )}

        {/* ── STEP 1: MUSCLES ── */}
        {!saved && step === "muscles" && (
          <View style={lg.flex}>
            {/* Header */}
            <View style={lg.header}>
              <View style={lg.flex}>
                <Text style={lg.eyebrow}>NEW WORKOUT</Text>
                <Text style={lg.title}>
                  {exercises.length === 0
                    ? "Pick a muscle group"
                    : `${exercises.length} exercise${exercises.length !== 1 ? "s" : ""} added`}
                </Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Step pills */}
            <View style={lg.stepRow}>
              {["Muscle", "Exercise", "Sets"].map((label, i) => (
                <View key={label} style={lg.stepPill}>
                  <View
                    style={[lg.stepDot, i <= stepIndex && lg.stepDotActive]}
                  >
                    <Text
                      style={[
                        lg.stepDotText,
                        i <= stepIndex && { color: "#fff" },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[lg.stepLabel, i <= stepIndex && lg.stepLabelActive]}
                  >
                    {label}
                  </Text>
                  {i < 2 && (
                    <View
                      style={[lg.stepLine, i < stepIndex && lg.stepLineActive]}
                    />
                  )}
                </View>
              ))}
            </View>

            <ScrollView
              style={lg.flex}
              contentContainerStyle={lg.muscleScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* 2-col muscle grid */}
              <View style={lg.muscleGrid}>
                {MUSCLE_GROUPS.map((mg) => {
                  const count = exercises.filter((e) => e.mg === mg).length;
                  const meta = MG_META[mg] || { color: "#7c3aed" };
                  return (
                    <Pressable
                      key={mg}
                      onPress={() => pickMuscle(mg)}
                      style={({ pressed }) => [
                        lg.muscleCard,
                        count > 0 && lg.muscleCardActive,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View
                        style={[lg.muscleDot, { backgroundColor: meta.color }]}
                      />
                      <Text
                        style={[lg.muscleName, count > 0 && { color: "#fff" }]}
                      >
                        {mg}
                      </Text>
                      {count > 0 && (
                        <View style={lg.muscleBadge}>
                          <Text style={lg.muscleBadgeText}>{count}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Added exercises */}
              {exercises.length > 0 && (
                <View style={lg.addedSection}>
                  <Text style={lg.sectionLabel}>Added exercises</Text>
                  {exercises.map((ex, ei) => (
                    <View key={ei} style={lg.addedRow}>
                      <View
                        style={[
                          lg.addedAccent,
                          {
                            backgroundColor: MG_META[ex.mg]?.color || "#7c3aed",
                          },
                        ]}
                      />
                      <View style={lg.addedLeft}>
                        <Text style={lg.addedMg}>{ex.mg}</Text>
                        <Text style={lg.addedName}>{ex.name}</Text>
                      </View>
                      <Text style={lg.addedSets}>{ex.sets.length}×</Text>
                      <Pressable
                        onPress={() => {
                          setActiveMg(ex.mg);
                          setActiveEx(ei);
                          setStep("sets");
                        }}
                        style={lg.addedEditBtn}
                      >
                        <Text style={lg.addedEditText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => removeExercise(ei)}
                        style={lg.addedDelBtn}
                      >
                        <Text style={lg.addedDelText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View style={lg.notesSection}>
                <Text style={lg.sectionLabel}>Session notes</Text>
                <TextInput
                  style={lg.notesInput}
                  placeholder="How did it feel? Any PRs?"
                  placeholderTextColor="#ccc"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  blurOnSubmit
                  returnKeyType="done"
                />
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={lg.bottomBar}>
              <Pressable
                onPress={submit}
                disabled={saving || exercises.length === 0}
                style={[
                  lg.saveBtn,
                  (saving || exercises.length === 0) && { opacity: 0.3 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={lg.saveBtnText}>
                    Save Workout
                    {exercises.length > 0
                      ? ` · ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}`
                      : ""}
                  </Text>
                )}
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
                <Text style={lg.eyebrow}>{activeMg?.toUpperCase()}</Text>
                <Text style={lg.title}>Select exercise</Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Step pills */}
            <View style={lg.stepRow}>
              {["Muscle", "Exercise", "Sets"].map((label, i) => (
                <View key={label} style={lg.stepPill}>
                  <View
                    style={[lg.stepDot, i <= stepIndex && lg.stepDotActive]}
                  >
                    <Text
                      style={[
                        lg.stepDotText,
                        i <= stepIndex && { color: "#fff" },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[lg.stepLabel, i <= stepIndex && lg.stepLabelActive]}
                  >
                    {label}
                  </Text>
                  {i < 2 && (
                    <View
                      style={[lg.stepLine, i < stepIndex && lg.stepLineActive]}
                    />
                  )}
                </View>
              ))}
            </View>

            <ScrollView
              style={lg.flex}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={false}
            >
              {(
                EXERCISE_LIBRARY[activeMg as keyof typeof EXERCISE_LIBRARY] ||
                []
              ).map((name: string) => {
                const isAdded = alreadyAdded.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => pickExercise(name)}
                    style={({ pressed }) => [
                      lg.exItem,
                      isAdded && lg.exItemAdded,
                      pressed && { opacity: 0.65 },
                    ]}
                  >
                    {isAdded && (
                      <View
                        style={[
                          lg.exAccent,
                          {
                            backgroundColor:
                              MG_META[activeMg!]?.color || "#7c3aed",
                          },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        lg.exItemName,
                        isAdded && {
                          color: "#7c3aed",
                          fontWeight: "700" as const,
                        },
                      ]}
                    >
                      {name}
                    </Text>
                    <View style={[lg.exBadge, isAdded && lg.exBadgeAdded]}>
                      <Text
                        style={[
                          lg.exBadgeText,
                          isAdded && { color: "#7c3aed" },
                        ]}
                      >
                        {isAdded ? "Edit" : "+"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── STEP 3: SETS ── */}
        {!saved && step === "sets" && currentEx && (
          <View style={lg.flex}>
            <View style={lg.header}>
              <Pressable onPress={doneWithSets} style={lg.backBtn}>
                <Text style={lg.backBtnText}>←</Text>
              </Pressable>
              <View style={[lg.flex, { marginLeft: 14 }]}>
                <Text style={lg.eyebrow}>{currentEx.mg?.toUpperCase()}</Text>
                <Text style={lg.title} numberOfLines={1}>
                  {currentEx.name}
                </Text>
              </View>
              <Pressable onPress={dismiss} style={lg.closeBtn}>
                <Text style={lg.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Step pills */}
            <View style={lg.stepRow}>
              {["Muscle", "Exercise", "Sets"].map((label, i) => (
                <View key={label} style={lg.stepPill}>
                  <View
                    style={[lg.stepDot, i <= stepIndex && lg.stepDotActive]}
                  >
                    <Text
                      style={[
                        lg.stepDotText,
                        i <= stepIndex && { color: "#fff" },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[lg.stepLabel, i <= stepIndex && lg.stepLabelActive]}
                  >
                    {label}
                  </Text>
                  {i < 2 && (
                    <View
                      style={[lg.stepLine, i < stepIndex && lg.stepLineActive]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Header row */}
            <View style={lg.setHeaderRow}>
              <Text style={[lg.setHeaderLabel, { width: 40 }]}>#</Text>
              <Text
                style={[lg.setHeaderLabel, { flex: 1, textAlign: "center" }]}
              >
                Reps
              </Text>
              <Text
                style={[lg.setHeaderLabel, { flex: 1, textAlign: "center" }]}
              >
                lbs
              </Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              style={lg.flex}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {currentEx.sets.map((set: any, si: number) => (
                <View key={si} style={lg.setRow}>
                  <View style={lg.setNum}>
                    <Text style={lg.setNumText}>{si + 1}</Text>
                  </View>

                  <TextInput
                    style={lg.setInput}
                    value={set.reps}
                    placeholder="0"
                    placeholderTextColor="#ccc"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    selectTextOnFocus
                    onChangeText={(v) =>
                      updateSet(si, "reps", v.replace(/[^0-9]/g, ""))
                    }
                  />

                  <TextInput
                    style={lg.setInput}
                    value={set.weight}
                    placeholder="0"
                    placeholderTextColor="#ccc"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    selectTextOnFocus
                    onChangeText={(v) =>
                      updateSet(si, "weight", v.replace(/[^0-9.]/g, ""))
                    }
                  />

                  <Pressable
                    onPress={() => removeSet(si)}
                    disabled={currentEx.sets.length <= 1}
                    style={[
                      lg.delSetBtn,
                      currentEx.sets.length <= 1 && { opacity: 0.15 },
                    ]}
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

            <View style={lg.bottomBar}>
              <Pressable onPress={doneWithSets} style={lg.doneBtn}>
                <Text style={lg.doneBtnText}>Done - back to exercises</Text>
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

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "92%",
    backgroundColor: "#fafaf8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 20,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e0ddd6",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.6)",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7c3aed",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0ede8",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 12, color: "#999", fontWeight: "700" },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#f0ede8",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#555", fontWeight: "500" },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
  },
  stepPill: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f0ede8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  stepDotActive: { backgroundColor: "#7c3aed" },
  stepDotText: { fontSize: 10, fontWeight: "800", color: "#bbb" },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#bbb" },
  stepLabelActive: { color: "#1a1a1a" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#f0ede8",
    marginHorizontal: 6,
    borderRadius: 99,
  },
  stepLineActive: { backgroundColor: "#7c3aed" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#bbb",
    marginBottom: 10,
  },

  // ── Step 1: Muscles ──
  muscleScroll: { padding: 20 },

  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  muscleCard: {
    width: "47%",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  muscleCardActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  muscleName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  muscleBadge: {
    backgroundColor: "#7c3aed",
    borderRadius: 99,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  muscleBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  // Added exercises
  addedSection: { marginBottom: 24 },
  addedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e5de",
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
    overflow: "hidden",
  },
  addedAccent: { width: 4, alignSelf: "stretch", borderRadius: 99 },
  addedLeft: { flex: 1, paddingLeft: 4 },
  addedMg: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  addedName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  addedSets: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "700",
    paddingRight: 4,
  },
  addedEditBtn: {
    backgroundColor: "#f4f2ed",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addedEditText: { fontSize: 12, fontWeight: "700", color: "#555" },
  addedDelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  addedDelText: { fontSize: 11, fontWeight: "700", color: "#f43f5e" },

  // Notes
  notesSection: { marginBottom: 10 },
  notesInput: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#1a1a1a",
    minHeight: 76,
    textAlignVertical: "top",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    backgroundColor: "#fafaf8",
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
  },
  saveBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },

  // ── Step 2: Exercises ──
  exItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e5de",
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden",
    gap: 10,
  },
  exItemAdded: {
    borderColor: "rgba(124,58,237,0.25)",
    backgroundColor: "rgba(124,58,237,0.03)",
  },
  exAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  exItemName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  exBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f4f2ed",
  },
  exBadgeAdded: { backgroundColor: "rgba(124,58,237,0.1)" },
  exBadgeText: { fontSize: 12, fontWeight: "700", color: "#aaa" },

  // ── Step 3: Sets ──
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ede8",
  },
  setHeaderLabel: { fontSize: 12, fontWeight: "700", color: "#bbb" },

  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f2ed",
  },
  setNum: {
    width: 40,
    alignItems: "center",
  },
  setNumText: { fontSize: 15, fontWeight: "700", color: "#bbb" },

  setInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 12,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#1a1a1a",
  },

  delSetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  delSetText: {
    fontSize: 20,
    color: "#f43f5e",
    fontWeight: "400",
    lineHeight: 24,
  },

  addSetRow: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#e0ddd6",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  addSetText: { fontSize: 14, fontWeight: "700", color: "#000000" },

  doneBtn: {
    backgroundColor: "#010101",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },

  // ── Saved ── add set
  savedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  savedCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  savedCheckText: { fontSize: 36, color: "#fff" },
  savedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  savedSub: { fontSize: 15, color: "#aaa" },
});

// ─── ProgressScreen ───────────────────────────────────────────────────────────
function ProgressScreen({ logs }) {
  const muscleStats = buildMuscleStats(logs);
  if (logs.length === 0) {
    return (
      <View style={ps.empty}>
        <Text style={{ fontSize: 48 }}>🏋️</Text>
        <Text style={ps.emptyTitle}>No workouts yet</Text>
        <Text style={ps.emptySub}>
          Log your first session to start tracking progress
        </Text>
      </View>
    );
  }
  return (
    <ScrollView style={ps.scroll} showsVerticalScrollIndicator={false}>
      <Text style={ps.sectionLabel}>Body parts</Text>
      <View style={{ gap: 10 }}>
        {muscleStats.map(({ mg, lastBest, delta, exNames, sessionCount }) => (
          <MuscleAccordionRow
            key={mg}
            mg={mg}
            lastBest={lastBest}
            delta={delta}
            exNames={exNames}
            sessionCount={sessionCount}
            logs={logs}
          />
        ))}
      </View>
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}
const ps = StyleSheet.create({
  scroll: { padding: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#aaa",
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 80,
    gap: 14,
  },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  emptySub: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 22,
  },
});

// ─── HistoryScreen ────────────────────────────────────────────────────────────
function HistoryScreen({ logs, loading, onDelete, confirmDeleteId }) {
  if (loading)
    return (
      <ActivityIndicator style={{ padding: 60 }} color="#7c3aed" size="large" />
    );
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
                <Text style={hs.dateMonth}>
                  {date
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}
                </Text>
                <Text style={hs.dateDay}>{date.getDate()}</Text>
              </View>
              <Text style={hs.weekday}>
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </Text>
              <Pressable
                onPress={() => onDelete(log._id)}
                style={[hs.deleteBtn, isPending && hs.deleteBtnPending]}
              >
                <Text
                  style={[
                    hs.deleteBtnText,
                    isPending && hs.deleteBtnTextPending,
                  ]}
                >
                  {isPending ? "Confirm?" : "Delete"}
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 7, marginTop: 10 }}>
              {log.exercises.map((ex, i) => (
                <View key={i} style={hs.exRow}>
                  <Text style={hs.exName} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text style={hs.exStats}>
                    {ex.sets.length} sets · {maxW(ex.sets)} lbs ·{" "}
                    {totalVol(ex.sets).toLocaleString()} vol
                  </Text>
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
  scroll: { padding: 18 },
  empty: { alignItems: "center", padding: 80, gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  emptySub: { fontSize: 14, color: "#aaa" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5de",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.6,
  },
  dateDay: { fontSize: 18, fontWeight: "800", color: "#fff", lineHeight: 20 },
  weekday: { flex: 1, fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  deleteBtnPending: { backgroundColor: "rgba(244,63,94,0.08)" },
  deleteBtnText: { fontSize: 12, fontWeight: "700", color: "#ccc" },
  deleteBtnTextPending: { color: "#f43f5e" },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  exName: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  exStats: { fontSize: 12, color: "#aaa", flexShrink: 0 },
  notes: {
    fontSize: 13,
    color: "#aaa",
    fontStyle: "italic",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8e5de",
  },
});

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [tab, setTab] = useState("progress");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem("user").then((raw) => {
      if (raw) {
        try {
          const user = JSON.parse(raw);
          setUserName(user.name?.split(" ")[0] ?? "");
        } catch {}
      }
    });
  }, []);

  const fetchLogs = useCallback(async () => {
    // 1. Show SQLite data instantly (no spinner on subsequent opens)
    const cached = getAllWorkoutLogs();
    if (cached.length > 0) {
      setLogs(cached);
      setLoadingLogs(false);
    }

    // 2. Sync from server in background to pick up any missing entries
    try {
      const token = await getToken();
      const res = await fetch(
        "https://yourpocketgym.com/api/tracking?limit=400",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success && json.data?.length) {
        saveWorkoutLogs(json.data);      // bulk-update SQLite cache
        setLogs(json.data);
      }
    } catch (e) {
      console.error("fetchLogs sync error:", e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const deleteLog = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    // Remove from SQLite + UI instantly
    deleteWorkoutLog(id);
    setLogs((prev) => prev.filter((l) => l._id !== id));
    setConfirmDeleteId(null);
    // Fire-and-forget server delete
    getToken().then((token) =>
      fetch(`https://yourpocketgym.com/api/tracking?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    );
  };

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  const weekDays = getWeekActivity(logs);
  const streakCount = weekDays.filter((d) => d.active).length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekVolume = logs
    .filter((l) => new Date(l.date) >= weekStart)
    .reduce((s, l) => s + totalVolLog(l), 0);
  return (
    <SafeAreaView style={t.root} edges={["top"]}>
      <PageBackground variant="tracking" />
      <StatusBar barStyle="dark-content" />

      <View style={t.header}>
        <View style={t.titleRow}>
          <View>
            <Text style={t.subtitle}>
              Good {getGreeting()}
              {userName ? `, ${userName}` : ""}
            </Text>
            <Text style={t.title}>Tracker</Text>
          </View>
          <AvatarButton />
        </View>

        {!loadingLogs && (
          <View>
            <Pressable onPress={() => setChartOpen((o) => !o)}>
              <View style={t.streakRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <Text style={t.streakCount}>{streakCount}</Text>
                  <Text style={t.streakOf}>/ 7 sessions</Text>
                  {weekVolume > 0 && (
                    <Text style={t.weekVol}>
                      · {weekVolume.toLocaleString()} lbs
                    </Text>
                  )}
                </View>
                <View style={[t.badge, streakCount >= 3 && t.badgeActive]}>
                  <Text
                    style={[t.badgeText, streakCount >= 3 && t.badgeTextActive]}
                  >
                    {streakCount >= 5
                      ? "🔥 On fire"
                      : streakCount >= 3
                        ? "⚡ Good week"
                        : "💪 Keep going"}
                  </Text>
                </View>
              </View>
              <View style={t.weekDots}>
                {weekDays.map((d, i) => (
                  <View key={i} style={t.dayCol}>
                    <View
                      style={[
                        t.dot,
                        d.active && t.dotActive,
                        d.today && !d.active && t.dotToday,
                      ]}
                    >
                      {d.active && (
                        <Text style={[t.dotCheck, d.today && t.dotCheckToday]}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text style={[t.dayLabel, d.today && t.dayLabelToday]}>
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={t.chartToggle}>
                {chartOpen ? "▲ Hide" : "▼ Year view"}
              </Text>
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
          {[
            ["progress", "Progress"],
            ["history", "History"],
          ].map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[t.tab, tab === key && t.tabActive]}
            >
              <Text style={[t.tabText, tab === key && t.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "progress" && <ProgressScreen logs={logs} />}
        {tab === "history" && (
          <HistoryScreen
            logs={logs}
            loading={loadingLogs}
            onDelete={deleteLog}
            confirmDeleteId={confirmDeleteId}
          />
        )}
      </View>

      {!showLog && (
        <View style={t.fab}>
          <Pressable onPress={() => setShowLog(true)} style={t.fabBtn}>
            <LinearGradient
              colors={["#232323", "#000000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={t.fabBtnGrad}
            >
              <Text style={t.fabBtnText}>Log workout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
      {showLog && (
        <LogSheet onClose={() => setShowLog(false)} onSaved={fetchLogs} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────── touch:     { alignSelf: "auto" },
const t = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  subtitle: { fontSize: 12, color: "#323131", marginBottom: 2, fontWeight: "400" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 10 },
  //touch
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addBtnText: { fontSize: 22, color: "#fff", fontWeight: "300" },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 18 },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  streakCount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  streakOf: { fontSize: 13, color: "#bbb" },
  weekVol: { fontSize: 12, color: "#aaa" },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  badgeActive: { backgroundColor: "rgba(124,58,237,0.09)" },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#bbb",
    letterSpacing: 0.3,
  },
  badgeTextActive: { color: "#7c3aed" },
  weekDots: { flexDirection: "row", gap: 6, marginBottom: 12 },
  dayCol: { flex: 1, alignItems: "center", gap: 6 },
  dot: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  dotToday: { borderWidth: 2, borderColor: "#000000" },
  dotCheck: { color: "#fff", fontWeight: "800", fontSize: 13 },
  dotCheckToday: { color: "#111111" },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.3,
  },
  dayLabelToday: { color: "#000000" },
  tabs: { flexDirection: "row", gap: 4 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#000000" },
  tabText: { fontSize: 15, fontWeight: "700", color: "#aaa" },
  tabTextActive: { color: "#1a1a1a" },
  chartToggle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ccc",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "right",
    paddingBottom: 10,
    marginTop: 4,
  },
  yearChartContainer: { paddingBottom: 10 },
  yearChartDivider: { height: 1, backgroundColor: "#e8e5de", marginBottom: 14 },
  yearChartTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#aaa",
    marginBottom: 10,
  },
  fab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 10 : 10,
  },
  fabBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabBtnGrad: { paddingVertical: 18, alignItems: "center", borderRadius: 18 },
  fabBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
//added
