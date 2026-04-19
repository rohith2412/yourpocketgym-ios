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
import Svg, {
  Circle, ClipPath, Defs, Ellipse, G, Line,
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

// ── Animated Cat ──────────────────────────────────────────────────────────────
const AnimatedCircle  = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedG       = Animated.createAnimatedComponent(G);

function CatAvatar({ size = 96 }) {
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatAnim, { toValue:  0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();

    const doBlink = () => {
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(blinkAnim, { toValue: 0, duration: 80,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80,  useNativeDriver: false }),
        Animated.delay(120),
        Animated.timing(blinkAnim, { toValue: 0, duration: 70,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80,  useNativeDriver: false }),
      ]).start(() => doBlink());
    };
    doBlink();

    Animated.loop(Animated.sequence([
      Animated.timing(wiggleAnim, { toValue: -2, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(wiggleAnim, { toValue:  2, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);

  const leftEyelidRy   = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [26, 0] });
  const rightEyelidRy  = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [26, 0] });
  const smileX         = wiggleAnim.interpolate({ inputRange: [-2,2], outputRange: [-3, 3] });
  const faceTranslateY = floatAnim.interpolate({ inputRange: [-6,0], outputRange: [-6, 0] });

  return (
    <View style={[cat.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 288 288">
        <Defs>
          <SvgGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </SvgGradient>
          <SvgGradient id="pblob" x1="20%" y1="10%" x2="80%" y2="90%">
            <Stop offset="0%"   stopColor="#ff7a1a" />
            <Stop offset="100%" stopColor="#e84400" />
          </SvgGradient>
          <ClipPath id="pcc">
            <Circle cx="144" cy="144" r="144" />
          </ClipPath>
        </Defs>
        <G clipPath="url(#pcc)">
          <Rect width="288" height="288" fill="transparent" />
          <Path
            d="M144,74 C162,64 186,70 200,88 C218,110 220,135 215,162 C210,188 224,208 216,228 C208,246 190,258 168,263 C148,268 126,266 108,258 C88,250 74,232 70,210 C66,190 76,168 74,148 C72,128 60,108 72,90 C84,72 126,84 144,74Z"
            fill="url(#pblob)"
          />
          <Path
            d="M144,74 C162,64 186,70 200,88 C210,102 216,118 218,135 Q180,68 144,74Z"
            fill="#c43000" opacity="0.6"
          />
          <AnimatedG translateY={faceTranslateY}>
            <Ellipse cx="118" cy="158" rx="22" ry="24" fill="#ffffff" />
            <Circle  cx="124" cy="163" r="13"  fill="#1a1a1a" />
            <Circle  cx="129" cy="156" r="5"   fill="#fff" />
            <Circle  cx="119" cy="168" r="2.5" fill="#fff" opacity="0.5" />
            <AnimatedEllipse cx="118" cy="158" rx="23" ry={leftEyelidRy} fill="url(#pbg)" />
            <Ellipse cx="172" cy="156" rx="22" ry="24" fill="#ffffff" />
            <Circle  cx="178" cy="161" r="13"  fill="#1a1a1a" />
            <Circle  cx="183" cy="154" r="5"   fill="#fff" />
            <Circle  cx="173" cy="166" r="2.5" fill="#fff" opacity="0.5" />
            <AnimatedEllipse cx="172" cy="156" rx="23" ry={rightEyelidRy} fill="url(#pbg)" />
            <AnimatedPath
              d="M128,194 Q144,212 162,194"
              fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"
              translateX={smileX}
            />
            <Ellipse cx="98"  cy="188" rx="14" ry="8" fill="#c4a882" opacity="0.25" />
            <Ellipse cx="192" cy="186" rx="14" ry="8" fill="#c4a882" opacity="0.25" />
          </AnimatedG>
        </G>
      </Svg>
    </View>
  );
}
const cat = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "rgba(255,107,53,0.08)", borderWidth: 2, borderColor: "rgba(255,107,53,0.2)" },
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

// ── Edit Sheet ────────────────────────────────────────────────────────────────
function EditSheet({ profile, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    gender: profile.gender, age: profile.age,
    height: profile.height, weight: profile.weight,
    fitnessGoal: profile.fitnessGoal,
    experienceLevel: profile.experienceLevel,
    workoutDaysPerWeek: profile.workoutDaysPerWeek,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/user-intro`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(form); onClose(); }
      else alert("Save failed: " + data.error);
    } finally { setSaving(false); }
  };

  const Chips = ({ label, field, options }) => (
    <View style={es.group}>
      <Text style={es.groupLabel}>{label}</Text>
      <View style={es.chips}>
        {options.map((o) => (
          <Pressable key={o.val} style={[es.chip, form[field] === o.val && es.chipActive]} onPress={() => set(field, o.val)}>
            <Text style={[es.chipText, form[field] === o.val && es.chipTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const Stepper = ({ label, field, min, max, unit }) => (
    <View style={es.group}>
      <Text style={es.groupLabel}>{label}</Text>
      <View style={es.stepRow}>
        <Pressable style={es.stepBtn} onPress={() => set(field, Math.max(min, (form[field] || min) - 1))}>
          <Text style={es.stepBtnText}>−</Text>
        </Pressable>
        <Text style={es.stepVal}>{form[field]} <Text style={es.stepUnit}>{unit}</Text></Text>
        <Pressable style={es.stepBtn} onPress={() => set(field, Math.min(max, (form[field] || min) + 1))}>
          <Text style={es.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={es.overlay} onPress={onClose} />
      <View style={es.sheet}>
        <View style={es.handle} />
        <View style={es.head}>
          <Text style={es.headTitle}>Edit profile</Text>
          <Pressable onPress={onClose}><Text style={es.closeBtn}>✕</Text></Pressable>
        </View>
        <ScrollView style={es.body} showsVerticalScrollIndicator={false}>
          <Chips label="Biological sex" field="gender" options={[
            { val: "male",   label: "Male"   },
            { val: "female", label: "Female" },
            { val: "other",  label: "Other"  },
          ]} />
          <Stepper label="Age"    field="age"    min={10}  max={99}  unit="yrs" />
          <Stepper label="Height" field="height" min={100} max={250} unit="cm"  />
          <Stepper label="Weight" field="weight" min={30}  max={200} unit="kg"  />
          <Chips label="Main goal" field="fitnessGoal" options={[
            { val: "lose fat",    label: "Lose fat"    },
            { val: "gain muscle", label: "Gain muscle" },
            { val: "strength",    label: "Strength"    },
          ]} />
          <Chips label="Experience" field="experienceLevel" options={[
            { val: "beginner",     label: "Beginner"     },
            { val: "intermediate", label: "Intermediate" },
            { val: "advanced",     label: "Advanced"     },
          ]} />
          <View style={es.group}>
            <Text style={es.groupLabel}>Days per week</Text>
            <View style={es.daysRow}>
              {[1,2,3,4,5,6,7].map((n) => (
                <Pressable key={n} style={[es.dayBtn, form.workoutDaysPerWeek === n && es.dayBtnActive]} onPress={() => set("workoutDaysPerWeek", n)}>
                  <Text style={[es.dayBtnText, form.workoutDaysPerWeek === n && es.dayBtnTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable style={[es.saveBtn, saving && { opacity: 0.4 }]} onPress={save} disabled={saving}>
            <Text style={es.saveBtnText}>{saving ? "Saving…" : "Save changes"}</Text>
          </Pressable>
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const es = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%" },
  handle: { width: 36, height: 4, backgroundColor: "#e8e5de", borderRadius: 99, alignSelf: "center", marginTop: 12 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e8e5de" },
  headTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: { fontSize: 14, color: "#bbb", padding: 4 },
  body: { padding: 20 },
  group: { marginBottom: 22 },
  groupLabel: { fontSize: 10, fontWeight: "700", color: "#aaa", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fafaf8" },
  chipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555" },
  chipTextActive: { color: "#fff" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fafaf8", alignItems: "center", justifyContent: "center" },
  stepBtnText: { fontSize: 22, color: "#1a1a1a", lineHeight: 26 },
  stepVal: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", flex: 1, textAlign: "center" },
  stepUnit: { fontSize: 13, fontWeight: "400", color: "#aaa" },
  daysRow: { flexDirection: "row", gap: 6 },
  dayBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#e8e5de", backgroundColor: "#fafaf8", alignItems: "center" },
  dayBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  dayBtnTextActive: { color: "#fff" },
  saveBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [token, setToken]             = useState(null);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showEdit, setShowEdit]       = useState(false);
  const [signingOut, setSigningOut]   = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [canceling, setCanceling]     = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const t = await getToken();
        if (!t) { router.replace("/login"); return; }
        setToken(t);
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

  const handleCancelSubscription = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); setTimeout(() => setCancelConfirm(false), 4000); return; }
    setCanceling(true);
    try {
      const res  = await fetch(`${API}/stripe/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { setProfile((p) => ({ ...p, subscriptionStatus: "canceling", isSubscribed: false })); setCancelConfirm(false); }
      else alert("Error: " + json.error);
    } finally { setCanceling(false); }
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#ff6b35" /></View>;
  }

  const bmiVal      = profile ? calcBmi(profile.weight, profile.height) : null;
  const bmiInfo     = bmiVal ? bmiCategory(bmiVal) : null;
  const goal        = profile?.fitnessGoal    ? GOAL_MAP[profile.fitnessGoal]       : null;
  const exp         = profile?.experienceLevel ? EXP_MAP[profile.experienceLevel]   : null;
  const expiryDate  = profile?.currentPeriodEnd ? formatDate(profile.currentPeriodEnd) : null;
  const daysRemaining = profile?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(profile.currentPeriodEnd) - Date.now()) / 86400000)) : null;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <PageBackground variant="profile" />
      <StatusBar barStyle="light-content" />

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
          <CatAvatar size={88} />
          <View style={s.heroTextWrap}>
            <View style={s.heroNameRow}>
              <Text style={s.heroName}>{profile?.name ?? "Athlete"}</Text>
              {profile?.isSubscribed && (
                <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>
              )}
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

        {/* Pro banner */}
        {profile?.isSubscribed && (
          <View style={s.proBanner}>
            <View style={{ flex: 1 }}>
              <Text style={s.proBannerTitle}>Pro subscriber</Text>
              <Text style={s.proBannerSub}>{expiryDate ? `Renews · ${expiryDate}` : "All features unlocked"}</Text>
            </View>
            <Pressable style={s.detailsBtn} onPress={() => router.push("/pricing")}>
              <Text style={s.detailsBtnText}>Details</Text>
            </Pressable>
          </View>
        )}

        {/* Upgrade banner */}
        {profile && !profile.isSubscribed && profile.subscriptionStatus !== "canceling" && (
          <Pressable style={s.upgradeBanner} onPress={() => router.push("/pricing")}>
            <View style={{ flex: 1 }}>
              <Text style={s.upgradeTitle}>Unlock Pro</Text>
              <Text style={s.upgradeSub}>AI trainer, nutrition scanning, recipes & more</Text>
            </View>
            <View style={s.priceBadge}><Text style={s.priceBadgeText}>$12/mo →</Text></View>
          </Pressable>
        )}

        {/* Canceling notice */}
        {profile?.subscriptionStatus === "canceling" && (
          <View style={s.cancelNotice}>
            <Text style={s.cancelNoticeText}>
              Your subscription is canceled. Pro access continues until end of billing period.
            </Text>
          </View>
        )}

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
          <MenuRow
            label={profile?.isSubscribed ? "View subscription" : "Upgrade to Pro"}
            onPress={() => router.push("/pricing")}
            right={
              <View style={[s.planBadge, profile?.isSubscribed && s.planBadgePro]}>
                <Text style={[s.planBadgeText, profile?.isSubscribed && s.planBadgeTextPro]}>
                  {profile?.isSubscribed ? "PRO" : "FREE"}
                </Text>
              </View>
            }
          />
          {profile?.isSubscribed && (
            <>
              <Divider />
              {cancelConfirm && expiryDate && (
                <View style={s.cancelWarning}>
                  <Text style={s.cancelWarningTitle}>You'll lose Pro access on:</Text>
                  <Text style={s.cancelWarningDate}>{expiryDate}</Text>
                  <Text style={s.cancelWarningSub}>
                    {daysRemaining === 0 ? "Access expires today" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of Pro remaining`}
                  </Text>
                </View>
              )}
              <MenuRow
                label={canceling ? "Canceling…" : cancelConfirm ? "Tap again to confirm" : "Cancel subscription"}
                labelStyle={{ color: cancelConfirm ? "#ef4444" : "#888" }}
                onPress={handleCancelSubscription}
                disabled={canceling}
              />
            </>
          )}
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
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#ffffff" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#ffffff" },

  // Hero
  hero: { alignItems: "center", paddingVertical: 24, gap: 12 },
  heroTextWrap: { alignItems: "center", gap: 3 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: { fontSize: 22, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  memberSince: { fontSize: 11, color: "rgba(255,255,255,0.45)" },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  pill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.8)", borderWidth: 1, borderColor: "#e8e5de" },
  pillText: { fontSize: 12, color: "#555", fontWeight: "500", textTransform: "capitalize" },

  proBadge: { backgroundColor: "rgba(255,107,53,0.1)", borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  proBadgeText: { fontSize: 10, fontWeight: "700", color: "#ff6b35" },

  // Banners
  proBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,107,53,0.07)", borderWidth: 1, borderColor: "rgba(255,107,53,0.2)",
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  proBannerTitle: { fontSize: 13, fontWeight: "700", color: "#ff6b35" },
  proBannerSub: { fontSize: 11, color: "#aaa", marginTop: 2 },
  detailsBtn: { backgroundColor: "rgba(255,107,53,0.1)", borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  detailsBtnText: { fontSize: 11, fontWeight: "700", color: "#ff6b35" },
  upgradeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a1a", borderRadius: 16, padding: 14, marginBottom: 10,
  },
  upgradeTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  upgradeSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  priceBadge: { backgroundColor: "rgba(255,107,53,0.15)", borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  priceBadgeText: { fontSize: 12, fontWeight: "700", color: "#ff6b35" },
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
  planBadgePro: { backgroundColor: "rgba(255,107,53,0.1)" },
  planBadgeText: { fontSize: 10, fontWeight: "700", color: "#aaa" },
  planBadgeTextPro: { color: "#ff6b35" },
  cancelWarning: { margin: 12, backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1, borderColor: "rgba(239,68,68,0.18)", borderRadius: 12, padding: 12 },
  cancelWarningTitle: { fontSize: 12, fontWeight: "700", color: "#ef4444", marginBottom: 4 },
  cancelWarningDate: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  cancelWarningSub: { fontSize: 11, color: "#aaa", marginTop: 3 },
  version: { textAlign: "center", fontSize: 10, color: "#ccc", fontWeight: "500", letterSpacing: 1, marginTop: 8 },
});
