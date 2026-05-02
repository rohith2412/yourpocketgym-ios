import AvatarButton from "@/components/AvatarButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { getToken } from "../src/auth/storage";

// ─── helpers progress 7d 30d ──────────────────────────────────────────────────────────────────
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
//log w

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
  if (!hasLog) return "rgba(255,255,255,0.07)";
  const i = vol / maxVol;
  if (i < 0.25) return "rgba(200,208,220,0.35)";
  if (i < 0.5) return "rgba(200,208,220,0.55)";
  if (i < 0.75) return "rgba(200,208,220,0.78)";
  return "#c8d0dc";
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
        {[
          "rgba(255,255,255,0.07)",
          "rgba(200,208,220,0.35)",
          "rgba(200,208,220,0.55)",
          "rgba(200,208,220,0.78)",
          "#c8d0dc",
        ].map((c) => (
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
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  statUnit: { fontSize: 12, fontWeight: "400", color: "rgba(255,255,255,0.3)" },
  dayLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
    lineHeight: CELL,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.4,
    width: 30,
  },
  cell: { width: CELL, height: CELL, borderRadius: 3 },
  tooltip: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tooltipDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  tooltipVol: { fontSize: 14, fontWeight: "800", color: "#e8380d" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    justifyContent: "flex-end",
  },
  legendLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "600",
  },
  legendCell: { width: 11, height: 11, borderRadius: 2 },
});

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// true  → static pre-filled data for App Store screenshots
// false → live data from the server (normal user experience)
const DEMO_MODE = false;

// Generates a full year of deterministic demo gym logs for screenshots.
// • Days 7–365 : pseudo-random year grid (fills the heat map)
// • Days 0–6   : hand-crafted sessions → smooth flowing line chart
//   Volumes:  10.2k → 14.0k → 12.8k → 18.0k → 12.9k → 15.4k → 17.3k
function buildDemoLogs(): any[] {
  const SESSIONS = [
    { name: "Bench Press",        muscleGroup: "Chest",     baseW: 145, baseR: 10, numSets: 4 },
    { name: "Squat",              muscleGroup: "Legs",      baseW: 215, baseR: 8,  numSets: 5 },
    { name: "Deadlift",           muscleGroup: "Back",      baseW: 255, baseR: 5,  numSets: 4 },
    { name: "Overhead Press",     muscleGroup: "Shoulders", baseW: 105, baseR: 8,  numSets: 4 },
    { name: "Lat Pulldown",       muscleGroup: "Back",      baseW: 150, baseR: 10, numSets: 3 },
    { name: "Barbell Curl",       muscleGroup: "Arms",      baseW: 95,  baseR: 12, numSets: 3 },
    { name: "Leg Press",          muscleGroup: "Legs",      baseW: 315, baseR: 12, numSets: 3 },
    { name: "Incline Bench Press",muscleGroup: "Chest",     baseW: 125, baseR: 10, numSets: 4 },
    { name: "Romanian Deadlift",  muscleGroup: "Legs",      baseW: 175, baseR: 10, numSets: 3 },
    { name: "Seated Cable Row",   muscleGroup: "Back",      baseW: 145, baseR: 12, numSets: 3 },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: any[] = [];

  // ── Year backdrop (days 7-365) ─────────────────────────────────────────────
  for (let daysAgo = 365; daysAgo > 6; daysAgo--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dow  = d.getDay();
    const seed = daysAgo * 37 + 19;
    const p1   = seed % 100;
    const p2   = (seed * 13 + 7) % 100;

    const trains =
      ([1, 2, 3, 4, 5].includes(dow) && p1 > 14) ||
      (dow === 6 && p1 > 69);
    if (!trains) continue;

    const progress  = 1 + ((365 - daysAgo) / 365) * 0.15;
    const sess      = SESSIONS[(daysAgo * 3 + 5) % SESSIONS.length];
    const intensity = 0.65 + (p2 / 100) * 0.35;
    const baseW     = Math.round((sess.baseW * progress * intensity) / 5) * 5;
    const reps      = Math.max(3, Math.round(sess.baseR * intensity));

    const dx = new Date(today);
    dx.setDate(dx.getDate() - daysAgo);
    dx.setHours(10, 0, 0, 0);
    result.push({
      _id: `demo_${daysAgo}`,
      date: dx.toISOString(),
      exercises: [{ name: sess.name, muscleGroup: sess.muscleGroup,
        sets: Array.from({ length: sess.numSets }, (_, i) => ({ setNumber: i+1, reps, weight: baseW + i*5 })),
      }],
    });
  }

  // ── Last 7 days: hand-crafted for a beautiful flowing line chart ───────────
  // Shape: start medium → rise → slight dip → big peak → dip → rise → finish high
  type S = { setNumber:number; reps:number; weight:number };
  type E = { name:string; mg:string; sets:S[] };
  const WEEK: { da:number; ex:E[] }[] = [
    {
      da: 6, // ~10,200 — Push: chest + shoulders + tris
      ex: [
        { name:"Bench Press",    mg:"Chest",     sets:[{setNumber:1,reps:10,weight:130},{setNumber:2,reps:8,weight:145},{setNumber:3,reps:6,weight:155},{setNumber:4,reps:6,weight:155}] },
        { name:"Overhead Press", mg:"Shoulders", sets:[{setNumber:1,reps:10,weight:95}, {setNumber:2,reps:8,weight:105},{setNumber:3,reps:6,weight:115}] },
        { name:"Tricep Pushdown",mg:"Arms",      sets:[{setNumber:1,reps:15,weight:60}, {setNumber:2,reps:12,weight:70},{setNumber:3,reps:12,weight:75},{setNumber:4,reps:10,weight:80}] },
      ],
    },
    {
      da: 5, // ~14,000 — Pull: back compound day
      ex: [
        { name:"Deadlift",        mg:"Back", sets:[{setNumber:1,reps:5,weight:235},{setNumber:2,reps:4,weight:255},{setNumber:3,reps:3,weight:270},{setNumber:4,reps:3,weight:280}] },
        { name:"Lat Pulldown",    mg:"Back", sets:[{setNumber:1,reps:12,weight:145},{setNumber:2,reps:10,weight:155},{setNumber:3,reps:8,weight:165},{setNumber:4,reps:6,weight:175}] },
        { name:"Seated Cable Row",mg:"Back", sets:[{setNumber:1,reps:12,weight:130},{setNumber:2,reps:10,weight:145},{setNumber:3,reps:10,weight:150}] },
      ],
    },
    {
      da: 4, // ~12,800 — Legs light + accessories
      ex: [
        { name:"Squat",        mg:"Legs", sets:[{setNumber:1,reps:8,weight:175},{setNumber:2,reps:6,weight:190},{setNumber:3,reps:5,weight:205},{setNumber:4,reps:4,weight:215}] },
        { name:"Leg Curl",     mg:"Legs", sets:[{setNumber:1,reps:15,weight:85},{setNumber:2,reps:12,weight:95},{setNumber:3,reps:10,weight:105},{setNumber:4,reps:10,weight:110}] },
        { name:"Leg Extension",mg:"Legs", sets:[{setNumber:1,reps:15,weight:90},{setNumber:2,reps:12,weight:100},{setNumber:3,reps:12,weight:105}] },
      ],
    },
    {
      da: 3, // ~18,000 — PEAK legs day (big volume spike)
      ex: [
        { name:"Squat",             mg:"Legs", sets:[{setNumber:1,reps:8,weight:185},{setNumber:2,reps:6,weight:205},{setNumber:3,reps:5,weight:220},{setNumber:4,reps:4,weight:235}] },
        { name:"Leg Press",         mg:"Legs", sets:[{setNumber:1,reps:15,weight:255},{setNumber:2,reps:12,weight:280},{setNumber:3,reps:10,weight:305}] },
        { name:"Romanian Deadlift", mg:"Legs", sets:[{setNumber:1,reps:10,weight:145},{setNumber:2,reps:10,weight:155},{setNumber:3,reps:8,weight:165}] },
      ],
    },
    {
      da: 2, // ~12,900 — Full body recovery
      ex: [
        { name:"Bench Press",   mg:"Chest",     sets:[{setNumber:1,reps:10,weight:145},{setNumber:2,reps:8,weight:155},{setNumber:3,reps:6,weight:165}] },
        { name:"Barbell Row",   mg:"Back",      sets:[{setNumber:1,reps:10,weight:155},{setNumber:2,reps:8,weight:165},{setNumber:3,reps:8,weight:170}] },
        { name:"Overhead Press",mg:"Shoulders", sets:[{setNumber:1,reps:10,weight:95},{setNumber:2,reps:8,weight:105},{setNumber:3,reps:6,weight:115}] },
        { name:"Barbell Curl",  mg:"Arms",      sets:[{setNumber:1,reps:12,weight:75},{setNumber:2,reps:10,weight:85},{setNumber:3,reps:8,weight:95}] },
      ],
    },
    {
      da: 1, // ~15,400 — Upper push heavy
      ex: [
        { name:"Bench Press",        mg:"Chest", sets:[{setNumber:1,reps:8,weight:155},{setNumber:2,reps:8,weight:165},{setNumber:3,reps:6,weight:175},{setNumber:4,reps:5,weight:185},{setNumber:5,reps:4,weight:195}] },
        { name:"Incline Bench Press",mg:"Chest", sets:[{setNumber:1,reps:10,weight:130},{setNumber:2,reps:8,weight:140},{setNumber:3,reps:6,weight:150},{setNumber:4,reps:6,weight:155}] },
        { name:"Seated Cable Row",   mg:"Back",  sets:[{setNumber:1,reps:12,weight:130},{setNumber:2,reps:10,weight:145},{setNumber:3,reps:10,weight:150},{setNumber:4,reps:8,weight:160}] },
      ],
    },
    {
      da: 0, // ~17,300 — Upper push + pull, finish strong
      ex: [
        { name:"Bench Press",   mg:"Chest",     sets:[{setNumber:1,reps:8,weight:160},{setNumber:2,reps:6,weight:175},{setNumber:3,reps:5,weight:185},{setNumber:4,reps:4,weight:195},{setNumber:5,reps:3,weight:205}] },
        { name:"Barbell Row",   mg:"Back",      sets:[{setNumber:1,reps:8,weight:160},{setNumber:2,reps:8,weight:170},{setNumber:3,reps:6,weight:180},{setNumber:4,reps:5,weight:190},{setNumber:5,reps:4,weight:200}] },
        { name:"Lat Pulldown",  mg:"Back",      sets:[{setNumber:1,reps:12,weight:155},{setNumber:2,reps:10,weight:165},{setNumber:3,reps:8,weight:175}] },
        { name:"Overhead Press",mg:"Shoulders", sets:[{setNumber:1,reps:8,weight:110},{setNumber:2,reps:6,weight:120},{setNumber:3,reps:5,weight:130}] },
      ],
    },
  ];

  for (const { da, ex } of WEEK) {
    const d = new Date(today);
    d.setDate(d.getDate() - da);
    d.setHours(10, 0, 0, 0);
    result.push({
      _id: `demo_w${da}`,
      date: d.toISOString(),
      exercises: ex.map(({ name, mg, sets }) => ({ name, muscleGroup: mg, sets })),
    });
  }

  return result;
}

const DEMO_LOGS: any[] = buildDemoLogs();

// ─── VolumeLineChart ──────────────────────────────────────────────────────────
const ORANGE = "#FF6B1A";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function buildVolumeSeries(logs: any[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  const volByDate: Record<string, number> = {};
  logs.forEach((log) => {
    const iso = toISODate(log.date);
    const vol = log.exercises?.reduce(
      (s: number, ex: any) =>
        s + (ex.sets?.reduce((ss: number, set: any) => ss + set.reps * set.weight, 0) ?? 0),
      0,
    ) ?? 0;
    volByDate[iso] = (volByDate[iso] ?? 0) + vol;
  });

  const points: { label: string; vol: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const iso = toISODate(d);
    const label =
      days <= 7
        ? ["S", "M", "T", "W", "T", "F", "S"][d.getDay()]
        : d.getDate() === 1
          ? d.toLocaleDateString("en-US", { month: "short" })
          : i % 7 === 0
            ? String(d.getDate())
            : "";
    points.push({ label, vol: volByDate[iso] ?? 0 });
  }
  return points;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

function VolumeLineChart({
  logs,
  slideWidth,
}: {
  logs: any[];
  slideWidth: number;
}) {
  const [period, setPeriod] = useState(0); // 0 = 7d, 1 = 30d
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const series7 = useMemo(() => buildVolumeSeries(logs, 7), [logs]);
  const series30 = useMemo(() => buildVolumeSeries(logs, 30), [logs]);
  const series = period === 0 ? series7 : series30;

  const PAD_L = 12;
  const PAD_R = 12;
  const PAD_T = 10;
  const PAD_B = 20;
  const H = 100;

  // inner chart dims — subtract card horizontal padding (16*2) so SVG fills card
  const innerW = slideWidth - 32; // card paddingHorizontal is 16 each side
  const chartW = innerW - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVol = useMemo(
    () => Math.max(...series.map((p) => p.vol), 1),
    [series],
  );

  const pts = useMemo((): { x: number; y: number }[] => {
    if (!innerW) return [];
    return series.map((p, i) => ({
      x: PAD_L + (i / Math.max(series.length - 1, 1)) * chartW,
      y: PAD_T + (1 - p.vol / maxVol) * chartH,
    }));
  }, [series, innerW, maxVol, chartW, chartH]);

  const linePath = useMemo(() => smoothPath(pts), [pts]);

  const areaPath = useMemo(() => {
    if (!pts.length || !linePath) return "";
    const base = PAD_T + chartH;
    return `${linePath} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`;
  }, [linePath, pts, chartH]);

  const hasData = useMemo(() => series.some((p) => p.vol > 0), [series]);

  // Always the rightmost tip of the line — that's where the glow lives
  const lastActivePt = useMemo(
    () => (pts.length > 0 && hasData ? pts[pts.length - 1] : null),
    [pts, hasData],
  );

  return (
    <View style={vc.inner}>
      {/* Minimal header row */}
      <View style={vc.row}>
        <Text style={vc.label}>Your chart</Text>
        <View style={vc.pillRow}>
          {([] as const).map((p, i) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(i)}
              activeOpacity={0.75}
              style={[vc.pill, period === i && vc.pillActive]}
            >
              <Text style={[vc.pillText, period === i && vc.pillTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      {innerW > 0 && (
        <Svg width={innerW} height={H} style={{ overflow: "visible" }}>
          <Defs>
            <SvgLinearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={ORANGE} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={ORANGE} stopOpacity="0.01" />
            </SvgLinearGradient>
          </Defs>

          {areaPath ? <Path d={areaPath} fill="url(#vg)" /> : null}

          {linePath ? (
            <>
              <Path d={linePath} fill="none" stroke={ORANGE} strokeWidth={18} opacity={0.04} strokeLinecap="round" strokeLinejoin="round" />
              <Path d={linePath} fill="none" stroke={ORANGE} strokeWidth={10} opacity={0.10} strokeLinecap="round" strokeLinejoin="round" />
              <Path d={linePath} fill="none" stroke={ORANGE} strokeWidth={5}  opacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
              <Path d={linePath} fill="none" stroke={ORANGE} strokeWidth={2.5} opacity={0.70} strokeLinecap="round" strokeLinejoin="round" />
              <Path d={linePath} fill="none" stroke="#fff"   strokeWidth={1.5} opacity={0.90} strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}

          {/* Regular mid-line dots */}
          {pts.map((pt, i) => {
            if (series[i]?.vol <= 0) return null;
            if (i === pts.length - 1) return null; // tip drawn separately with glow
            return <Circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill={ORANGE} opacity={0.7} />;
          })}

          {/* Last active point — subtle glow + pulse */}
          {lastActivePt && (
            <>
              {/* Single soft glow halo */}
              <Circle cx={lastActivePt.x} cy={lastActivePt.y} r={10} fill={ORANGE} opacity={0.15} />
              {/* Animated pulse ring */}
              <AnimatedCircle
                cx={lastActivePt.x}
                cy={lastActivePt.y}
                r={pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 11] })}
                fill="none"
                stroke={ORANGE}
                strokeWidth={1}
                opacity={pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] })}
              />
              {/* Main dot */}
              <Circle cx={lastActivePt.x} cy={lastActivePt.y} r={4}   fill={ORANGE} opacity={1} />
              {/* White centre */}
              <Circle cx={lastActivePt.x} cy={lastActivePt.y} r={2}   fill="#fff"   opacity={0.9} />
            </>
          )}

          {series.map((p, i) =>
            p.label ? (
              <SvgText
                key={i}
                x={PAD_L + (i / Math.max(series.length - 1, 1)) * chartW}
                y={H - 3}
                textAnchor="middle"
                fontSize={8}
                fontWeight="600"
                fill="rgba(255,255,255,0.28)"
              >
                {p.label}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}

      {!hasData && (
        <Text style={vc.empty}>Log workouts to see volume</Text>
      )}
    </View>
  );
}

const vc = StyleSheet.create({
  inner: {
    paddingTop: 14,
    paddingBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "rgba(255,255,255,0.3)",
  },
  pillRow: {
    flexDirection: "row",
    gap: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  pillActive: {
    backgroundColor: "rgba(232,56,13,0.18)",
    borderColor: "rgba(232,56,13,0.35)",
  },
  pillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
  },
  pillTextActive: { color: ORANGE },
  empty: {
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
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

// ─── LogSheet ─────────────────────────────────────────────────────────────────
const MG_META: Record<string, { color: string }> = {
  Chest: { color: "#e8380d" },
  Back: { color: "#e8380d" },
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

        {/* ── SAVED session ── */}
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
              <View style={lg.muscleGrid}>
                {MUSCLE_GROUPS.map((mg) => {
                  const count = exercises.filter((e) => e.mg === mg).length;
                  const meta = MG_META[mg] || { color: "#e8380d" };
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

              {exercises.length > 0 && (
                <View style={lg.addedSection}>
                  <Text style={lg.sectionLabel}>Added exercises</Text>
                  {exercises.map((ex, ei) => (
                    <View key={ei} style={lg.addedRow}>
                      <View
                        style={[
                          lg.addedAccent,
                          {
                            backgroundColor: MG_META[ex.mg]?.color || "#e8380d",
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
                              MG_META[activeMg!]?.color || "#e8380d",
                          },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        lg.exItemName,
                        isAdded && {
                          color: "#e8380d",
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
                          isAdded && { color: "#e8380d" },
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
    color: "#e8380d",
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
  stepDotActive: { backgroundColor: "#e8380d" },
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
  stepLineActive: { backgroundColor: "#e8380d" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#bbb",
    marginBottom: 10,
  },

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
    backgroundColor: "#e8380d",
    borderRadius: 99,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  muscleBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

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
    color: "#e8380d",
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
      <ActivityIndicator style={{ padding: 60 }} color="#e8380d" size="large" />
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
  const [cardPage, setCardPage] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const cardScrollRef = useRef<ScrollView>(null);
  const cardPageRef = useRef(0);

  // Auto-cycle between the two cards every 10 seconds
  useEffect(() => {
    if (!cardWidth) return;
    const timer = setInterval(() => {
      const next = cardPageRef.current === 0 ? 1 : 0;
      // collapse year view before leaving slide 0
      if (next === 1) setChartOpen(false);
      cardScrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
      cardPageRef.current = next;
      setCardPage(next);
    }, 10000);
    return () => clearInterval(timer);
  }, [cardWidth]);
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
    try {
      const token = await getToken();
      const res = await fetch(
        "https://yourpocketgym.com/api/tracking?limit=400",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success && json.data?.length) {
        setLogs(json.data);
      }
    } catch (e) {
      console.error("fetchLogs error:", e);
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
    setLogs((prev) => prev.filter((l) => l._id !== id));
    setConfirmDeleteId(null);
    getToken().then((token) =>
      fetch(`https://yourpocketgym.com/api/tracking?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}),
    );
  };

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  // DEMO_MODE → use static logs for the card section only
  const displayLogs = DEMO_MODE ? DEMO_LOGS : logs;

  const weekDays = getWeekActivity(displayLogs);
  const streakCount = weekDays.filter((d) => d.active).length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekVolume = displayLogs
    .filter((l) => new Date(l.date) >= weekStart)
    .reduce((s, l) => s + totalVolLog(l), 0);

  return (
    <SafeAreaView style={t.root} edges={["top"]}>
   
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

        {(!loadingLogs || DEMO_MODE) && (
          <View
            onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
          >
            {cardWidth > 0 && (
              // Clipping wrapper — overflow:hidden correctly masks the black
              // background to the border radius on iOS
              <View style={[t.calCardWrap, { width: cardWidth }]}>
                <ScrollView
                  ref={cardScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(e) => {
                    const page = Math.round(
                      e.nativeEvent.contentOffset.x / cardWidth,
                    );
                    if (page === 1) setChartOpen(false);
                    cardPageRef.current = page;
                    setCardPage(page);
                  }}
                  style={{ width: cardWidth }}
                  contentContainerStyle={{ alignItems: "stretch" }}
                >
                  {/* ── Slide 0: Streak week view ── */}
                  <View style={[t.calSlide, { width: cardWidth }]}>
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
                            style={[
                              t.badgeText,
                              streakCount >= 3 && t.badgeTextActive,
                            ]}
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
                                <Text
                                  style={[t.dotCheck, d.today && t.dotCheckToday]}
                                >
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
                      <View style={t.yearChartInner}>
                        <View style={t.yearChartDivider} />
                        <Text style={t.yearChartTitle}>Past year</Text>
                        <YearChart logs={displayLogs} />
                      </View>
                    )}
                  </View>

                  {/* ── Slide 1: Volume chart ── */}
                  <View style={[t.calSlide, { width: cardWidth }]}>
                    <VolumeLineChart logs={displayLogs} slideWidth={cardWidth} />
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Page indicator dots */}
            <View style={t.pageDots}>
              <View style={[t.pageDot, cardPage === 0 && t.pageDotActive]} />
              <View style={[t.pageDot, cardPage === 1 && t.pageDotActive]} />
            </View>
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
        {tab === "progress" && <ProgressScreen logs={displayLogs} />}
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
              <Text style={t.fabBtnText}>+</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  subtitle: {
    fontSize: 12,
    color: "#323131",
    marginBottom: 2,
    fontWeight: "400",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  pageDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    marginBottom: 2,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  pageDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  pageDotActive: {
    backgroundColor: ORANGE,
    width: 14,
  },
  // Outer wrapper: handles border radius + clipping so the black bg
  // is correctly masked to rounded corners on iOS
  calCardWrap: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111111",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // Individual slide — just padding, background inherited from wrapper
  calSlide: {
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  // Keep calCard for any remaining references
  calCard: {
    backgroundColor: "#111111",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  streakCount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
  },
  streakOf: { fontSize: 13, color: "rgba(255,255,255,0.35)" },
  weekVol: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeActive: { backgroundColor: "rgba(124,58,237,0.25)" },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.3,
  },
  badgeTextActive: { color: "#e8380d" },
  weekDots: { flexDirection: "row", gap: 6, marginBottom: 12 },
  dayCol: { flex: 1, alignItems: "center", gap: 6 },
  dot: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: "#ffffff", borderColor: "#ffffff" },
  dotToday: { borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  dotCheck: { color: "#111111", fontWeight: "800", fontSize: 13 },
  dotCheckToday: { color: "#111111" },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.3,
  },
  dayLabelToday: { color: "rgba(255,255,255,0.8)" },
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
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "right",
    paddingBottom: 10,
    marginTop: 4,
  },
  yearChartInner: { paddingBottom: 8 },
  yearChartDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  yearChartTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    marginBottom: 10,
  },
fab: {
  position: "absolute",
  bottom: 0 ,
  right: 30,
},
fabBtn: {
  borderRadius: 18,
  overflow: "hidden",
  shadowColor: "#e8380d",
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
},
fabBtnGrad: {
  width: 60,
  height: 60,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 18,
},
fabBtnText: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "300",
  lineHeight: 32,
},
});