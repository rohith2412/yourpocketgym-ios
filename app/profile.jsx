import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
//profile $12 cut calories your goal
import Svg, {
  Circle, ClipPath, Defs, Ellipse, G,
  LinearGradient as SvgGradient, Path, Rect, Stop,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import PageBackground from "@/components/PageBackground";
import { getToken, removeToken } from "../src/auth/storage";

const API = "https://yourpocketgym.com/api";

const calcBmi = (weight, height) => {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
};
const bmiCategory = (val) => {
  const n = parseFloat(val);
  if (n < 18.5) return { label: "Underweight", color: "#60a5fa" };
  if (n < 25)   return { label: "Healthy",     color: "#22c55e" };
  if (n < 30)   return { label: "Overweight",  color: "#f59e0b" };
  return               { label: "Obese",       color: "#ef4444" };
};
const GOAL_MAP = {
  "lose fat":    { label: "Lose fat" },
  "gain muscle": { label: "Gain muscle" },
  strength:      { label: "Strength" },
};
const EXP_MAP = {
  beginner:     { label: "Beginner" },
  intermediate: { label: "Intermediate" },
  advanced:     { label: "Advanced" },
};
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// ── Animated Face Avatar (same character as AvatarButton) ────────────────────
const AnimatedCircle  = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedG       = Animated.createAnimatedComponent(G);

function FaceAvatar({ size = 96 }) {
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle float
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatAnim, { toValue:  0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();

    // Single blink every ~7 s
    const doBlink = () => {
      Animated.sequence([
        Animated.delay(7000),
        Animated.timing(blinkAnim, { toValue: 0, duration: 80,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 90,  useNativeDriver: false }),
      ]).start(() => doBlink());
    };
    doBlink();

    // Subtle smile sway
    Animated.loop(Animated.sequence([
      Animated.timing(wiggleAnim, { toValue: -1.5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(wiggleAnim, { toValue:  1.5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);

  const leftLidRy  = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [25, 0] });
  const rightLidRy = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [25, 0] });
  const smileX     = wiggleAnim.interpolate({ inputRange: [-1.5,1.5], outputRange: [-2, 2] });
  const floatY     = floatAnim.interpolate({ inputRange: [-5,0], outputRange: [-5, 0] });

  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 288 288">
        <Defs>
          {/* Clip to circle */}
          <ClipPath id="avClip">
            <Circle cx="144" cy="144" r="144" />
          </ClipPath>

          {/* Skin — warm peach */}
          <SvgGradient id="avSkin" x1="25%" y1="5%" x2="75%" y2="95%">
            <Stop offset="0%"   stopColor="#fcd5ae" />
            <Stop offset="100%" stopColor="#e8a06a" />
          </SvgGradient>

          {/* Ear */}
          <SvgGradient id="avEar" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor="#f4c090" />
            <Stop offset="100%" stopColor="#d9885a" />
          </SvgGradient>

          {/* Hair — dark brown */}
          <SvgGradient id="avHair" x1="20%" y1="0%" x2="80%" y2="100%">
            <Stop offset="0%"   stopColor="#3a2510" />
            <Stop offset="100%" stopColor="#160e04" />
          </SvgGradient>

          {/* Iris — violet */}
          <SvgGradient id="avIris" x1="30%" y1="10%" x2="70%" y2="90%">
            <Stop offset="0%"   stopColor="#8b5cf6" />
            <Stop offset="100%" stopColor="#5b21b6" />
          </SvgGradient>

          {/* Eyelid cover */}
          <SvgGradient id="avLid" x1="25%" y1="0%" x2="75%" y2="100%">
            <Stop offset="0%"   stopColor="#fcd5ae" />
            <Stop offset="100%" stopColor="#eeaa78" />
          </SvgGradient>
        </Defs>

        <G clipPath="url(#avClip)">
          {/* Background */}
          <Rect width="288" height="288" fill="#ede9fe" />

          <AnimatedG translateY={floatY}>
            {/* Ears */}
            <Ellipse cx="44"  cy="168" rx="33" ry="35" fill="url(#avEar)" />
            <Ellipse cx="44"  cy="172" rx="19" ry="21" fill="#d07848" fillOpacity="0.45" />
            <Ellipse cx="244" cy="168" rx="33" ry="35" fill="url(#avEar)" />
            <Ellipse cx="244" cy="172" rx="19" ry="21" fill="#d07848" fillOpacity="0.45" />

            {/* Hair */}
            <Ellipse cx="144" cy="82"  rx="98" ry="80" fill="url(#avHair)" />
            <Ellipse cx="130" cy="44"  rx="22" ry="28" fill="#2a1a0a" />
            <Ellipse cx="155" cy="38"  rx="16" ry="22" fill="#321e0c" />
            <Ellipse cx="114" cy="58"  rx="26" ry="15" fill="#6a4828" fillOpacity="0.5" />

            {/* Face */}
            <Ellipse cx="144" cy="162" rx="98" ry="100" fill="url(#avSkin)" />
            <Ellipse cx="144" cy="248" rx="72" ry="22"  fill="#c08050" fillOpacity="0.18" />

            {/* Left eye */}
            <Ellipse cx="110" cy="152" rx="26" ry="27" fill="#ffffff" />
            <Circle  cx="114" cy="156" r="17"           fill="url(#avIris)" />
            <Circle  cx="114" cy="156" r="10"           fill="#0d0820" />
            <Circle  cx="122" cy="148" r="6.5"          fill="#ffffff" />
            <Circle  cx="110" cy="164" r="2.5"          fill="#ffffff" fillOpacity="0.55" />
            <AnimatedEllipse cx="110" cy="152" rx="27" ry={leftLidRy} fill="url(#avLid)" />

            {/* Right eye */}
            <Ellipse cx="178" cy="150" rx="26" ry="27" fill="#ffffff" />
            <Circle  cx="182" cy="154" r="17"           fill="url(#avIris)" />
            <Circle  cx="182" cy="154" r="10"           fill="#0d0820" />
            <Circle  cx="190" cy="146" r="6.5"          fill="#ffffff" />
            <Circle  cx="178" cy="162" r="2.5"          fill="#ffffff" fillOpacity="0.55" />
            <AnimatedEllipse cx="178" cy="150" rx="27" ry={rightLidRy} fill="url(#avLid)" />

            {/* Eyebrows */}
            <Path d="M 90,128 Q 110,120 132,124" fill="none" stroke="#2a1a0a" strokeWidth="5.5" strokeLinecap="round" />
            <Path d="M 156,122 Q 176,116 198,122" fill="none" stroke="#2a1a0a" strokeWidth="5.5" strokeLinecap="round" />

            {/* Nose */}
            <Ellipse cx="144" cy="178" rx="9"  ry="7"  fill="#c87848" fillOpacity="0.5" />
            <Circle  cx="138" cy="180" r="4"           fill="#b86838" fillOpacity="0.45" />
            <Circle  cx="150" cy="180" r="4"           fill="#b86838" fillOpacity="0.45" />

            {/* Cheeks */}
            <Ellipse cx="82"  cy="190" rx="26" ry="16" fill="#f07060" fillOpacity="0.2" />
            <Ellipse cx="206" cy="188" rx="26" ry="16" fill="#f07060" fillOpacity="0.2" />

            {/* Smile */}
            <AnimatedPath
              d="M 116,204 Q 144,226 172,204"
              fill="none" stroke="#c06040"
              strokeWidth="5" strokeLinecap="round"
              translateX={smileX}
            />
            <AnimatedPath
              d="M 122,207 Q 144,212 166,207"
              fill="none" stroke="#d07858"
              strokeWidth="2.5" strokeLinecap="round"
              translateX={smileX}
            />
          </AnimatedG>
        </G>
      </Svg>
    </View>
  );
}
const av = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "#ede9fe" },
});

// ── Primitives ────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}
function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}
function Divider() {
  return <View style={s.divider} />;
}
function MenuRow({ label, labelStyle, right, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.menuRow, pressed && { opacity: 0.55 }]}
    >
      <Text style={[s.menuLabel, labelStyle]}>{label}</Text>
      {right ?? <Text style={s.menuChevron}>›</Text>}
    </Pressable>
  );
}

// ── Edit Sheet load ────────────────────────────────────────────────────────────────
const GOALS_META = [
  { val: "lose fat",    label: "Lose Fat",    },
  { val: "gain muscle", label: "Gain Muscle", },
  { val: "strength",    label: "Strength",    },
];
const EXP_META = [
  { val: "beginner",     label: "Beginner",      },
  { val: "intermediate", label: "Intermediate",  },
  { val: "advanced",     label: "Advanced",      },
];

function EditSheet({ profile, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    gender:             profile.gender             ?? "male",
    age:                profile.age                ?? 25,
    height:             profile.height             ?? 170,
    weight:             profile.weight             ?? 70,
    fitnessGoal:        profile.fitnessGoal        ?? "gain muscle",
    experienceLevel:    profile.experienceLevel    ?? "beginner",
    workoutDaysPerWeek: profile.workoutDaysPerWeek ?? 3,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const slideAnim    = useRef(new Animated.Value(600)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(slideAnim,    { toValue: 0, tension: 62, friction: 13, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim,    { toValue: 600, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/user-intro`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(form); dismiss(); }
      else alert("Save failed: " + data.error);
    } finally { setSaving(false); }
  };

  // Apple-style grouped section
  const Section = ({ label, children }) => (
    <View style={es.section}>
      {label ? <Text style={es.sectionLabel}>{label}</Text> : null}
      <View style={es.sectionGroup}>{children}</View>
    </View>
  );

  // Row with checkmark (for option lists)
  const OptionRow = ({ label, active, onPress, last }) => (
    <Pressable onPress={onPress} style={[es.row, !last && es.rowBorder]}>
      <Text style={es.rowLabel}>{label}</Text>
      {active && <Text style={es.checkmark}>✓</Text>}
    </Pressable>
  );

  // Stepper row (−  value  +)
  const StepperRow = ({ label, field, min, max, unit, last }) => (
    <View style={[es.row, !last && es.rowBorder]}>
      <Text style={es.rowLabel}>{label}</Text>
      <View style={es.stepperInline}>
        <Pressable onPress={() => set(field, Math.max(min, form[field] - 1))} style={es.stepperBtn}>
          <Text style={es.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={es.stepperVal}>{form[field]}<Text style={es.stepperUnit}> {unit}</Text></Text>
        <Pressable onPress={() => set(field, Math.min(max, form[field] + 1))} style={es.stepperBtn}>
          <Text style={es.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[es.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Native-style nav bar */}
        <View style={es.navBar}>
          <View style={es.handle} />
          <View style={es.navRow}>
            <Pressable onPress={dismiss}>
              <Text style={es.navCancel}>Cancel</Text>
            </Pressable>
            <Text style={es.navTitle}>Edit Profile</Text>
            <Pressable onPress={save} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#007AFF" />
                : <Text style={es.navDone}>Done</Text>
              }
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={es.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* Goal */}
          <Section label="FITNESS GOAL">
            {GOALS_META.map((g, i) => (
              <OptionRow
                key={g.val}
                label={g.label}
                active={form.fitnessGoal === g.val}
                onPress={() => set("fitnessGoal", g.val)}
                last={i === GOALS_META.length - 1}
              />
            ))}
          </Section>

          {/* Experience */}
          <Section label="EXPERIENCE LEVEL">
            {EXP_META.map((e, i) => (
              <OptionRow
                key={e.val}
                label={e.label}
                active={form.experienceLevel === e.val}
                onPress={() => set("experienceLevel", e.val)}
                last={i === EXP_META.length - 1}
              />
            ))}
          </Section>

          {/* Body stats */}
          <Section label="BODY STATS">
            <StepperRow label="Age"    field="age"    min={10}  max={99}  unit="yrs" />
            <StepperRow label="Height" field="height" min={100} max={250} unit="cm"  />
            <StepperRow label="Weight" field="weight" min={30}  max={250} unit="kg" last />
          </Section>

          {/* Sex */}
          <Section label="BIOLOGICAL SEX">
            {["Male", "Female", "Other"].map((label, i, arr) => (
              <OptionRow
                key={label}
                label={label}
                active={form.gender === label.toLowerCase()}
                onPress={() => set("gender", label.toLowerCase())}
                last={i === arr.length - 1}
              />
            ))}
          </Section>

          {/* Training days */}
          <Section label="TRAINING DAYS / WEEK">
            {[1,2,3,4,5,6,7].map((n, i) => (
              <OptionRow
                key={n}
                label={`${n} day${n > 1 ? "s" : ""}`}
                active={form.workoutDaysPerWeek === n}
                onPress={() => set("workoutDaysPerWeek", n)}
                last={i === 6}
              />
            ))}
          </Section>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const es = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#f2f2f7",
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    maxHeight: "94%",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },

  // Native nav bar
  navBar: {
    backgroundColor: "#f2f2f7",
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60,60,67,0.18)",
  },
  handle: {
    width: 36, height: 5, backgroundColor: "rgba(60,60,67,0.3)",
    borderRadius: 99, alignSelf: "center", marginTop: 8, marginBottom: 12,
  },
  navRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingBottom: 4,
  },
  navTitle:  { fontSize: 17, fontWeight: "600", color: "#000" },
  navCancel: { fontSize: 17, color: "#007AFF" },
  navDone:   { fontSize: 17, fontWeight: "600", color: "#007AFF" },

  body: { paddingTop: 16 },

  // Grouped section
  section: { marginBottom: 28, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 12, fontWeight: "400", color: "#6c6c70",
    letterSpacing: 0.1, textTransform: "uppercase",
    marginBottom: 6, marginLeft: 16,
  },
  sectionGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: "#fff",
    minHeight: 44,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60,60,67,0.18)",
  },
  rowLabel: { fontSize: 17, color: "#000" },
  checkmark: { fontSize: 17, color: "#007AFF", fontWeight: "600" },

  // Inline stepper
  stepperInline: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#e5e5ea",
    alignItems: "center", justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, color: "#000", fontWeight: "400", lineHeight: 24 },
  stepperVal: { fontSize: 17, color: "#000", minWidth: 56, textAlign: "center" },
  stepperUnit: { fontSize: 13, color: "#8e8e93" },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [token, setToken]             = useState(null);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showEdit, setShowEdit]       = useState(false);
  const [signingOut, setSigningOut]   = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const t = await getToken();
        if (!t) { router.replace("/login"); return; }
        setToken(t);

        // Fetch profile from server
        const res  = await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${t}` } });
        const json = await res.json();
        if (!json.success) { router.replace("/login"); return; }
        setProfile(json.data);
      } catch (_) {}
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    })();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await removeToken();
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };


  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#000000" /></View>;
  }

  const bmiVal      = profile ? calcBmi(profile.weight, profile.height) : null;
  const bmiInfo     = bmiVal ? bmiCategory(bmiVal) : null;
  const goal        = profile?.fitnessGoal    ? GOAL_MAP[profile.fitnessGoal]       : null;
  const exp         = profile?.experienceLevel ? EXP_MAP[profile.experienceLevel]   : null;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <PageBackground variant="profile" />
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <FaceAvatar size={88} />
          <View style={s.heroTextWrap}>
            <View style={s.heroNameRow}>
              <Text style={s.heroName}>{profile?.name ?? "Athlete"}</Text>
            </View>
            <Text style={s.heroEmail}>{profile?.email}</Text>
            {profile?.memberSince && (
              <Text style={s.memberSince}>Since {formatDate(profile.memberSince)}</Text>
            )}
          </View>
          {/* Quick pills */}
          <View style={s.pillsRow}>
            {profile?.gender    && <View style={s.pill}><Text style={s.pillText}>{profile.gender}</Text></View>}
            {profile?.age > 0   && <View style={s.pill}><Text style={s.pillText}>{profile.age} yrs</Text></View>}
            {profile?.workoutDaysPerWeek > 0 && <View style={s.pill}><Text style={s.pillText}>{profile.workoutDaysPerWeek}× / week</Text></View>}
          </View>
        </View>


        {/* Activity stats */}
        {profile?.workoutStats?.sessions > 0 && (
          <>
            <SectionLabel>Activity</SectionLabel>
            <View style={s.statGrid}>
              <Card style={s.statCard}>
                <Text style={s.statValue}>{profile.workoutStats.sessions}</Text>
                <Text style={s.statLabel}>Workouts</Text>
              </Card>
              <Card style={s.statCard}>
                <Text style={s.statValue}>
                  {profile.workoutStats.totalVol >= 1000
                    ? `${(profile.workoutStats.totalVol / 1000).toFixed(1)}t`
                    : `${profile.workoutStats.totalVol}kg`}
                </Text>
                <Text style={s.statLabel}>Total volume</Text>
              </Card>
            </View>
            {profile.workoutStats.topExercise && (
              <Card style={{ marginBottom: 10 }}>
                <Text style={s.statLabel}>Top exercise</Text>
                <Text style={s.topExercise}>{profile.workoutStats.topExercise}</Text>
              </Card>
            )}
          </>
        )}

        {/* Body stats */}
        {profile?.hasIntro && (
          <>
            <SectionLabel>Body</SectionLabel>
            <View style={s.statGrid}>
              <Card style={s.statCard}>
                <Text style={s.statLabel}>Height</Text>
                <Text style={s.statValue}>{profile.height} <Text style={s.statUnit}>cm</Text></Text>
              </Card>
              <Card style={s.statCard}>
                <Text style={s.statLabel}>Weight</Text>
                <Text style={s.statValue}>{profile.weight} <Text style={s.statUnit}>kg</Text></Text>
              </Card>
            </View>
            {bmiVal && bmiInfo && (
              <Card style={{ marginBottom: 10 }}>
                <View style={s.bmiTop}>
                  <Text style={s.statLabel}>BMI</Text>
                  <View style={[s.bmiBadge, { backgroundColor: bmiInfo.color + "28" }]}>
                    <Text style={[s.bmiBadgeText, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
                  </View>
                </View>
                <Text style={s.bmiValue}>{bmiVal}</Text>
                <View style={s.bmiBar}>
                  {[{ w:22, color:"#93c5fd" },{ w:40, color:"#86efac" },{ w:22, color:"#fcd34d" },{ w:16, color:"#fca5a5" }].map((seg,i) => (
                    <View key={i} style={{ flex: seg.w, height: 6, backgroundColor: seg.color, opacity: 0.6, borderRadius: 99 }} />
                  ))}
                </View>
                <View style={s.bmiScale}>
                  {["10","18.5","25","30","40"].map((n) => <Text key={n} style={s.bmiScaleText}>{n}</Text>)}
                </View>
              </Card>
            )}
          </>
        )}

        {/* Training */}
        {profile?.hasIntro && (goal || exp) && (
          <>
            <SectionLabel>Training</SectionLabel>
            <View style={[s.statGrid, { marginBottom: 10 }]}>
              {goal && (
                <Card style={s.trainingCard}>
                  <Text style={s.statLabel}>Goal</Text>
                  <Text style={s.trainingLabel}>{goal.label}</Text>
                </Card>
              )}
              {exp && (
                <Card style={s.trainingCard}>
                  <Text style={s.statLabel}>Level</Text>
                  <Text style={s.trainingLabel}>{exp.label}</Text>
                </Card>
              )}
            </View>
          </>
        )}

        {/* No intro */}
        {!profile?.hasIntro && (
          <Card style={s.noIntroCard}>
            <Text style={s.noIntroTitle}>Profile incomplete</Text>
            <Text style={s.noIntroSub}>Complete your fitness profile to unlock body stats and training insights.</Text>
            <Pressable style={s.ctaBtn} onPress={() => router.push("/startersIntro")}>
              <Text style={s.ctaBtnText}>Complete setup →</Text>
            </Pressable>
          </Card>
        )}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <Card style={s.menuCard}>
          <MenuRow
            label="Edit fitness profile"
            onPress={() => profile?.hasIntro && setShowEdit(true)}
          />
          <Divider />
          <MenuRow label="Terms of Service"  onPress={() => router.push("/legal/terms")} />
          <Divider />
          <MenuRow label="Privacy Policy"    onPress={() => router.push("/legal/privacy")} />
          <Divider />
          <MenuRow
            label={signingOut ? "Signing out…" : "Sign out"}
            labelStyle={{ color: "#ef4444" }}
            onPress={handleSignOut}
            disabled={signingOut}
          />
          <Divider />
          <MenuRow
            label="Delete Account"
            labelStyle={{ color: "#ef4444" }}
            onPress={() => router.push("/legal/delete-account")}
          />
        </Card>

        <Text style={s.version}>Your Pocket Gym · v1.0</Text>
        <View style={{ height: 48 }} />
      </Animated.ScrollView>

      {showEdit && profile?.hasIntro && token && (
        <EditSheet
          profile={profile}
          token={token}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile((p) => ({ ...p, ...updated }))}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#1a1a1a" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },

  // Hero
  hero: { alignItems: "center", paddingVertical: 24, gap: 12 },
  heroTextWrap: { alignItems: "center", gap: 3 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  heroEmail: { fontSize: 13, color: "#666" },
  memberSince: { fontSize: 11, color: "#aaa" },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  pill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.06)", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  pillText: { fontSize: 12, color: "#444", fontWeight: "500", textTransform: "capitalize" },

  proBadge: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)" },
  proBadgeText: { fontSize: 10, fontWeight: "700", color: "#7c3aed" },

  // Banners
  proBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(124,58,237,0.07)", borderWidth: 1, borderColor: "rgba(124,58,237,0.2)",
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  proBannerTitle: { fontSize: 13, fontWeight: "700", color: "#7c3aed" },
  proBannerSub: { fontSize: 11, color: "#aaa", marginTop: 2 },
  detailsBtn: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  detailsBtnText: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },
  upgradeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a1a", borderRadius: 16, padding: 14, marginBottom: 10,
  },
  upgradeTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  upgradeSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  priceBadge: { backgroundColor: "rgba(124,58,237,0.15)", borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  priceBadgeText: { fontSize: 12, fontWeight: "700", color: "#ffffff" },
  cancelNotice: {
    backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  cancelNoticeText: { fontSize: 12, color: "#d97706", fontWeight: "600", lineHeight: 18 },

  // Stats
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#e8e5de", marginBottom: 10 },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  statCard: { flex: 1, padding: 16 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", marginBottom: 2 },
  statUnit: { fontSize: 11, fontWeight: "400", color: "#aaa" },
  statLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 0.8, textTransform: "uppercase" },
  topExercise: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginTop: 4 },
  bmiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bmiBadge: { borderRadius: 99, paddingVertical: 3, paddingHorizontal: 9 },
  bmiBadgeText: { fontSize: 10, fontWeight: "700" },
  bmiValue: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", marginBottom: 10 },
  bmiBar: { flexDirection: "row", gap: 2, marginBottom: 5 },
  bmiScale: { flexDirection: "row", justifyContent: "space-between" },
  bmiScaleText: { fontSize: 9, color: "#ccc" },
  trainingCard: { flex: 1, padding: 16, gap: 4 },
  trainingLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginTop: 4 },
  noIntroCard: { alignItems: "center", padding: 32, marginBottom: 10 },
  noIntroTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  noIntroSub: { fontSize: 13, color: "#aaa", lineHeight: 20, textAlign: "center", marginBottom: 20 },
  ctaBtn: { width: "100%", backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Menu
  menuCard: { padding: 0, overflow: "hidden", marginBottom: 10 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  menuChevron: { fontSize: 18, color: "#ddd" },
  divider: { height: 1, backgroundColor: "#f0ede8", marginHorizontal: 16 },
  planBadge: { backgroundColor: "#f4f2ed", borderRadius: 99, paddingVertical: 3, paddingHorizontal: 8 },
  planBadgePro: { backgroundColor: "rgba(124,58,237,0.1)" },
  planBadgeText: { fontSize: 10, fontWeight: "700", color: "#aaa" },
  planBadgeTextPro: { color: "#7c3aed" },
  cancelWarning: { margin: 12, backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1, borderColor: "rgba(239,68,68,0.18)", borderRadius: 12, padding: 12 },
  cancelWarningTitle: { fontSize: 12, fontWeight: "700", color: "#ef4444", marginBottom: 4 },
  cancelWarningDate: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  cancelWarningSub: { fontSize: 11, color: "#aaa", marginTop: 3 },
  version: { textAlign: "center", fontSize: 10, color: "#ccc", fontWeight: "500", letterSpacing: 1, marginTop: 8 },
});
