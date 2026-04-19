import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ FIX: needed for full sign out
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getToken, removeToken } from "../src/auth/storage";

const API = "https://yourpocketgym.com/api";

const calcBmi = (weight, height) => {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
};

const bmiCategory = (val) => {
  const n = parseFloat(val);
  if (n < 18.5) return { label: "Underweight", color: "#60a5fa" };
  if (n < 25) return { label: "Healthy", color: "#22c55e" };
  if (n < 30) return { label: "Overweight", color: "#f59e0b" };
  return { label: "Obese", color: "#ef4444" };
};

const GOAL_MAP = {
  "lose fat": { icon: "🔥", label: "Lose fat" },
  "gain muscle": { icon: "💪", label: "Gain muscle" },
  strength: { icon: "🏋️", label: "Strength" },
};

const EXP_MAP = {
  beginner: { icon: "🌱", label: "Beginner" },
  intermediate: { icon: "⚡", label: "Intermediate" },
  advanced: { icon: "🎯", label: "Advanced" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 64 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={[av.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[av.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  circle: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontWeight: "700" },
});

function SectionLabel({ children }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}
function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}
function Divider() {
  return <View style={s.divider} />;
}
function MenuRow({ icon, label, labelStyle, right, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.menuRow, pressed && { opacity: 0.55 }]}
    >
      <Text style={s.menuIcon}>{icon}</Text>
      <Text style={[s.menuLabel, labelStyle]}>{label}</Text>
      {right ?? <Text style={s.menuChevron}>›</Text>}
    </Pressable>
  );
}

// ── Edit Sheet ────────────────────────────────────────────────────────────────
function EditSheet({ profile, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(form);
        onClose();
      } else alert("Save failed: " + data.error);
    } finally {
      setSaving(false);
    }
  };

  const Chips = ({ label, field, options }) => (
    <View style={es.group}>
      <Text style={es.groupLabel}>{label}</Text>
      <View style={es.chips}>
        {options.map((o) => (
          <Pressable
            key={o.val}
            style={[es.chip, form[field] === o.val && es.chipActive]}
            onPress={() => set(field, o.val)}
          >
            <Text
              style={[es.chipText, form[field] === o.val && es.chipTextActive]}
            >
              {o.icon} {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const Stepper = ({ label, field, min, max, unit }) => (
    <View style={es.group}>
      <Text style={es.groupLabel}>{label}</Text>
      <View style={es.stepRow}>
        <Pressable
          style={es.stepBtn}
          onPress={() => set(field, Math.max(min, (form[field] || min) - 1))}
        >
          <Text style={es.stepBtnText}>−</Text>
        </Pressable>
        <Text style={es.stepVal}>
          {form[field]} <Text style={es.stepUnit}>{unit}</Text>
        </Text>
        <Pressable
          style={es.stepBtn}
          onPress={() => set(field, Math.min(max, (form[field] || min) + 1))}
        >
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
          <Pressable onPress={onClose}>
            <Text style={es.closeBtn}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={es.body} showsVerticalScrollIndicator={false}>
          <Chips
            label="Biological sex"
            field="gender"
            options={[
              { val: "male", icon: "♂", label: "Male" },
              { val: "female", icon: "♀", label: "Female" },
              { val: "other", icon: "◎", label: "Other" },
            ]}
          />
          <Stepper label="Age" field="age" min={10} max={99} unit="yrs" />
          <Stepper
            label="Height"
            field="height"
            min={100}
            max={250}
            unit="cm"
          />
          <Stepper label="Weight" field="weight" min={30} max={200} unit="kg" />
          <Chips
            label="Main goal"
            field="fitnessGoal"
            options={[
              { val: "lose fat", icon: "🔥", label: "Lose fat" },
              { val: "gain muscle", icon: "💪", label: "Gain muscle" },
              { val: "strength", icon: "🏋️", label: "Strength" },
            ]}
          />
          <Chips
            label="Experience"
            field="experienceLevel"
            options={[
              { val: "beginner", icon: "🌱", label: "Beginner" },
              { val: "intermediate", icon: "⚡", label: "Intermediate" },
              { val: "advanced", icon: "🎯", label: "Advanced" },
            ]}
          />
          <View style={es.group}>
            <Text style={es.groupLabel}>Days per week</Text>
            <View style={es.daysRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Pressable
                  key={n}
                  style={[
                    es.dayBtn,
                    form.workoutDaysPerWeek === n && es.dayBtnActive,
                  ]}
                  onPress={() => set("workoutDaysPerWeek", n)}
                >
                  <Text
                    style={[
                      es.dayBtnText,
                      form.workoutDaysPerWeek === n && es.dayBtnTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={[es.saveBtn, saving && { opacity: 0.4 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={es.saveBtnText}>
              {saving ? "Saving…" : "Save changes"}
            </Text>
          </Pressable>
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const es = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#e8e5de",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e5de",
  },
  headTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: { fontSize: 14, color: "#bbb", padding: 4 },
  body: { padding: 20 },
  group: { marginBottom: 22 },
  groupLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    backgroundColor: "#fafaf8",
  },
  chipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555" },
  chipTextActive: { color: "#fff" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    backgroundColor: "#fafaf8",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 22, color: "#1a1a1a", lineHeight: 26 },
  stepVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  stepUnit: { fontSize: 13, fontWeight: "400", color: "#aaa" },
  daysRow: { flexDirection: "row", gap: 6 },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    backgroundColor: "#fafaf8",
    alignItems: "center",
  },
  dayBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  dayBtnTextActive: { color: "#fff" },
  saveBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const t = await getToken();
        if (!t) {
          router.replace("/login");
          return;
        }
        setToken(t);

        const res = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const json = await res.json();
        if (!json.success) {
          router.replace("/login");
          return;
        }
        setProfile(json.data);
      } catch (_) {}

      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    })();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    // ✅ FIX: also clear "user" from AsyncStorage - previously only removeToken()
    // was called which cleared the token key but left a stale "user" object behind.
    // On next app launch useAuth() in AITrainerScreen would find user but no token,
    // causing a broken authenticated-looking state.
    await removeToken();
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  const handleCancelSubscription = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      setTimeout(() => setCancelConfirm(false), 4000);
      return;
    }
    setCanceling(true);
    try {
      const res = await fetch(`${API}/stripe/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setProfile((p) => ({
          ...p,
          subscriptionStatus: "canceling",
          isSubscribed: false,
        }));
        setCancelConfirm(false);
      } else {
        alert("Error: " + json.error);
      }
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  const bmiVal = profile ? calcBmi(profile.weight, profile.height) : null;
  const bmiInfo = bmiVal ? bmiCategory(bmiVal) : null;
  const goal = profile?.fitnessGoal ? GOAL_MAP[profile.fitnessGoal] : null;
  const exp = profile?.experienceLevel
    ? EXP_MAP[profile.experienceLevel]
    : null;
  const expiryDate = profile?.currentPeriodEnd
    ? formatDate(profile.currentPeriodEnd)
    : null;
  const daysRemaining = profile?.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil((new Date(profile.currentPeriodEnd) - Date.now()) / 86400000),
      )
    : null;

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card style={s.heroCard}>
          <Avatar name={profile?.name} size={64} />
          <View style={s.heroInfo}>
            <View style={s.heroNameRow}>
              <Text style={s.heroName}>{profile?.name ?? "Athlete"}</Text>
              {profile?.isSubscribed && (
                <View style={s.proBadge}>
                  <Text style={s.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={s.heroEmail}>{profile?.email}</Text>
            {profile?.memberSince && (
              <Text style={s.memberSince}>
                Member since {formatDate(profile.memberSince)}
              </Text>
            )}
            <View style={s.pillsRow}>
              {profile?.gender && (
                <View style={s.pill}>
                  <Text style={s.pillText}>
                    {profile.gender === "male"
                      ? "♂"
                      : profile.gender === "female"
                        ? "♀"
                        : "◎"}{" "}
                    {profile.gender}
                  </Text>
                </View>
              )}
              {profile?.age > 0 && (
                <View style={s.pill}>
                  <Text style={s.pillText}>{profile.age} yrs</Text>
                </View>
              )}
              {profile?.workoutDaysPerWeek > 0 && (
                <View style={s.pill}>
                  <Text style={s.pillText}>
                    {profile.workoutDaysPerWeek}×/wk
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Pro banner */}
        {profile?.isSubscribed && (
          <View style={s.proBanner}>
            <Text style={{ fontSize: 20 }}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.proBannerTitle}>Pro subscriber</Text>
              <Text style={s.proBannerSub}>
                {expiryDate
                  ? `Renews · ${expiryDate}`
                  : "All features unlocked"}
              </Text>
            </View>
            <Pressable
              style={s.detailsBtn}
              onPress={() => router.push("/pricing")}
            >
              <Text style={s.detailsBtnText}>Details</Text>
            </Pressable>
          </View>
        )}

        {/* Upgrade banner */}
        {profile &&
          !profile.isSubscribed &&
          profile.subscriptionStatus !== "canceling" && (
            <Pressable
              style={s.upgradeBanner}
              onPress={() => router.push("/pricing")}
            >
              <Text style={{ fontSize: 20 }}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.upgradeTitle}>Unlock Pro features</Text>
                <Text style={s.upgradeSub}>
                  AI trainer, nutrition tracking, recipes & more
                </Text>
              </View>
              <View style={s.priceBadge}>
                <Text style={s.priceBadgeText}>$12/mo →</Text>
              </View>
            </Pressable>
          )}

        {/* Canceling notice */}
        {profile?.subscriptionStatus === "canceling" && (
          <View style={s.cancelNotice}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={s.cancelNoticeText}>
              Your subscription is canceled. Pro access continues until end of
              billing period.
            </Text>
          </View>
        )}

        {/* Activity stats */}
        {profile?.workoutStats?.sessions > 0 && (
          <>
            <SectionLabel>Activity</SectionLabel>
            <View style={s.statGrid}>
              <Card style={s.statCard}>
                <Text style={s.statIcon}>🏋️</Text>
                <Text style={s.statValue}>{profile.workoutStats.sessions}</Text>
                <Text style={s.statLabel}>Workouts logged</Text>
              </Card>
              <Card style={s.statCard}>
                <Text style={s.statIcon}>📈</Text>
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
                <Text style={s.topExercise}>
                  {profile.workoutStats.topExercise}
                </Text>
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
                <Text style={s.statValue}>
                  {profile.height} <Text style={s.statUnit}>cm</Text>
                </Text>
              </Card>
              <Card style={s.statCard}>
                <Text style={s.statLabel}>Weight</Text>
                <Text style={s.statValue}>
                  {profile.weight} <Text style={s.statUnit}>kg</Text>
                </Text>
              </Card>
            </View>

            {bmiVal && bmiInfo && (
              <Card style={{ marginBottom: 10 }}>
                <View style={s.bmiTop}>
                  <Text style={s.statLabel}>BMI</Text>
                  <View
                    style={[
                      s.bmiBadge,
                      { backgroundColor: bmiInfo.color + "28" },
                    ]}
                  >
                    <Text style={[s.bmiBadgeText, { color: bmiInfo.color }]}>
                      {bmiInfo.label}
                    </Text>
                  </View>
                </View>
                <Text style={s.bmiValue}>{bmiVal}</Text>
                <View style={s.bmiBar}>
                  {[
                    { w: 22, color: "#93c5fd" },
                    { w: 40, color: "#86efac" },
                    { w: 22, color: "#fcd34d" },
                    { w: 16, color: "#fca5a5" },
                  ].map((seg, i) => (
                    <View
                      key={i}
                      style={{
                        flex: seg.w,
                        height: 6,
                        backgroundColor: seg.color,
                        opacity: 0.6,
                        borderRadius: 99,
                      }}
                    />
                  ))}
                </View>
                <View style={s.bmiScale}>
                  {["10", "18.5", "25", "30", "40"].map((n) => (
                    <Text key={n} style={s.bmiScaleText}>
                      {n}
                    </Text>
                  ))}
                </View>
              </Card>
            )}
          </>
        )}

        {/* Training profile */}
        {profile?.hasIntro && (goal || exp) && (
          <>
            <SectionLabel>Training</SectionLabel>
            <View style={[s.statGrid, { marginBottom: 10 }]}>
              {goal && (
                <Card style={s.trainingCard}>
                  <Text style={{ fontSize: 22 }}>{goal.icon}</Text>
                  <View>
                    <Text style={s.statLabel}>Goal</Text>
                    <Text style={s.trainingLabel}>{goal.label}</Text>
                  </View>
                </Card>
              )}
              {exp && (
                <Card style={s.trainingCard}>
                  <Text style={{ fontSize: 22 }}>{exp.icon}</Text>
                  <View>
                    <Text style={s.statLabel}>Level</Text>
                    <Text style={s.trainingLabel}>{exp.label}</Text>
                  </View>
                </Card>
              )}
            </View>
          </>
        )}

        {/* No intro */}
        {!profile?.hasIntro && (
          <Card style={s.noIntroCard}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
            <Text style={s.noIntroTitle}>Profile incomplete</Text>
            <Text style={s.noIntroSub}>
              Complete your fitness profile to unlock body stats and training
              insights.
            </Text>
            <Pressable
              style={s.ctaBtn}
              onPress={() => router.push("/startersIntro")}
            >
              <Text style={s.ctaBtnText}>Complete setup →</Text>
            </Pressable>
          </Card>
        )}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <Card style={s.menuCard}>
          <MenuRow
            icon="✏️"
            label="Edit fitness profile"
            onPress={() => profile?.hasIntro && setShowEdit(true)}
          />
          <Divider />
          <MenuRow
            icon="💳"
            label={
              profile?.isSubscribed ? "View subscription" : "Upgrade to Pro"
            }
            onPress={() => router.push("/pricing")}
            right={
              <View
                style={[s.planBadge, profile?.isSubscribed && s.planBadgePro]}
              >
                <Text
                  style={[
                    s.planBadgeText,
                    profile?.isSubscribed && s.planBadgeTextPro,
                  ]}
                >
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
                  <Text style={s.cancelWarningTitle}>
                    ⚠️ You'll lose Pro access on:
                  </Text>
                  <Text style={s.cancelWarningDate}>{expiryDate}</Text>
                  <Text style={s.cancelWarningSub}>
                    {daysRemaining === 0
                      ? "Access expires today"
                      : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of Pro remaining`}
                  </Text>
                </View>
              )}
              <MenuRow
                icon="🚫"
                label={
                  canceling
                    ? "Canceling…"
                    : cancelConfirm
                      ? "Tap again to confirm"
                      : "Cancel subscription"
                }
                labelStyle={{ color: cancelConfirm ? "#ef4444" : "#888" }}
                onPress={handleCancelSubscription}
                disabled={canceling}
              />
            </>
          )}

          <Divider />
          <MenuRow
            icon="📄"
            label="Terms of Service"
            onPress={() => router.push("/legal/terms")}
          />
          <Divider />
          <MenuRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => router.push("/legal/privacy")}
          />
          <Divider />
          <MenuRow
            icon="🚪"
            label={signingOut ? "Signing out…" : "Sign out"}
            labelStyle={{ color: "#ef4444" }}
            onPress={handleSignOut}
            disabled={signingOut}
          />
        </Card>

        <Pressable onPress={() => router.push("/legal/delete-account")}>
          <Text style={s.deleteLink}>Delete Account</Text>
        </Pressable>
        <Text style={s.version}>PocketGym · v1.0</Text>
        <View style={{ height: 48 }} />
      </ScrollView>

      {showEdit && profile?.hasIntro && token && (
        <EditSheet
          profile={profile}
          token={token}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile((p) => ({ ...p, ...updated }))}
        />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "rgba(250,250,248,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e5de",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#1a1a1a" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e5de",
    marginBottom: 10,
  },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroInfo: { flex: 1 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  heroEmail: { fontSize: 12, color: "#aaa", marginTop: 2 },
  memberSince: { fontSize: 11, color: "#ccc", marginTop: 1 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 7 },
  pill: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 99,
    backgroundColor: "#f4f2ed",
    borderWidth: 1,
    borderColor: "#e8e5de",
  },
  pillText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  proBadge: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  proBadgeText: { fontSize: 10, fontWeight: "700", color: "#ff6b35" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,107,53,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.2)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  proBannerTitle: { fontSize: 13, fontWeight: "700", color: "#ff6b35" },
  proBannerSub: { fontSize: 11, color: "#aaa", marginTop: 2 },
  detailsBtn: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  detailsBtnText: { fontSize: 11, fontWeight: "700", color: "#ff6b35" },
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  upgradeTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  upgradeSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  priceBadge: {
    backgroundColor: "rgba(255,107,53,0.15)",
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceBadgeText: { fontSize: 12, fontWeight: "700", color: "#ff6b35" },
  cancelNotice: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cancelNoticeText: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "600",
    lineHeight: 18,
    flex: 1,
  },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  statCard: { flex: 1, padding: 14 },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  statUnit: { fontSize: 11, fontWeight: "400", color: "#aaa" },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  topExercise: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 4,
  },
  bmiTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bmiBadge: { borderRadius: 99, paddingVertical: 3, paddingHorizontal: 9 },
  bmiBadgeText: { fontSize: 10, fontWeight: "700" },
  bmiValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  bmiBar: { flexDirection: "row", gap: 2, marginBottom: 5 },
  bmiScale: { flexDirection: "row", justifyContent: "space-between" },
  bmiScaleText: { fontSize: 9, color: "#ccc" },
  trainingCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  trainingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 2,
  },
  noIntroCard: { alignItems: "center", padding: 32, marginBottom: 10 },
  noIntroTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  noIntroSub: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  ctaBtn: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  menuCard: { padding: 0, overflow: "hidden", marginBottom: 10 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuIcon: { fontSize: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  menuChevron: { fontSize: 18, color: "#ddd" },
  divider: { height: 1, backgroundColor: "#e8e5de", marginHorizontal: 16 },
  planBadge: {
    backgroundColor: "#f4f2ed",
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  planBadgePro: { backgroundColor: "rgba(255,107,53,0.1)" },
  planBadgeText: { fontSize: 10, fontWeight: "700", color: "#aaa" },
  planBadgeTextPro: { color: "#ff6b35" },
  cancelWarning: {
    margin: 12,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
    borderRadius: 12,
    padding: 12,
  },
  cancelWarningTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 4,
  },
  cancelWarningDate: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  cancelWarningSub: { fontSize: 11, color: "#aaa", marginTop: 3 },
  deleteLink: {
    fontSize: 11,
    color: "#bbb",
    textDecorationLine: "underline",
    textAlign: "center",
    marginBottom: 8,
  },
  version: {
    textAlign: "center",
    fontSize: 10,
    color: "#ccc",
    fontWeight: "500",
    letterSpacing: 1,
  },
});
