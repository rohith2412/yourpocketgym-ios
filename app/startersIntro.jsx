import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getToken } from "../src/auth/storage";

const TOTAL_STEPS   = 7;
const stepProgress  = [14, 28, 42, 57, 71, 85, 100];

export default function IntroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    age:                25,
    height:             170,
    weight:             70,
    gender:             "",
    fitnessGoal:        "",
    experienceLevel:    "",
    workoutDaysPerWeek: 0,
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleDay = (i) => {
    const updated = selectedDays.includes(i)
      ? selectedDays.filter((d) => d !== i)
      : [...selectedDays, i];
    setSelectedDays(updated);
    set("workoutDaysPerWeek", updated.length);
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch("https://yourpocketgym.com/api/user-intro", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        // ✅ FIX: update cached user in AsyncStorage so hasIntro = true
        // Without this, AITrainerScreen reads stale false and keeps
        // redirecting back to startersIntro on every app launch
        const userRaw = await AsyncStorage.getItem("user");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          await AsyncStorage.setItem("user", JSON.stringify({ ...user, hasIntro: true }));
        }
        setDone(true);
        setTimeout(() => router.replace("/tracking"), 2000);
      } else {
        alert("Something went wrong: " + data.error);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const summaryChips = [
    form.gender === "male" ? "♂ Male" : form.gender === "female" ? "♀ Female" : "◎ Other",
    `${form.age} yrs`,
    `${form.height} cm`,
    `${form.weight} kg`,
    form.fitnessGoal === "lose fat"    ? "🔥 Lose fat"
      : form.fitnessGoal === "gain muscle" ? "💪 Gain muscle"
      : "🏋️ Strength",
    form.experienceLevel === "beginner"     ? "🌱 Beginner"
      : form.experienceLevel === "intermediate" ? "⚡ Intermediate"
      : "🎯 Advanced",
    `${form.workoutDaysPerWeek}×/week`,
  ];

  const progressWidth = `${stepProgress[step - 1]}%`;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: progressWidth }]} />
          </View>

          {/* ── DONE SCREEN ── */}
          {done ? (
            <View style={s.doneWrap}>
              <View style={s.doneIcon}>
                <Text style={s.doneIconText}>✓</Text>
              </View>
              <Text style={s.doneTitle}>All set!</Text>
              <Text style={s.doneSub}>Redirecting to your tracking…</Text>
              <View style={s.chips}>
                {summaryChips.map((label, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <>
              {/* ── STEP 1: Gender ── */}
              {step === 1 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 1 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>What's your biological sex?</Text>
                  <View style={s.optionGrid}>
                    {[
                      { val: "male",   icon: "♂", label: "Male"   },
                      { val: "female", icon: "♀", label: "Female" },
                      { val: "other",  icon: "◎", label: "Other"  },
                    ].map((o) => (
                      <Pressable
                        key={o.val}
                        onPress={() => set("gender", o.val)}
                        style={[s.optionBtn, form.gender === o.val && s.optionSelected]}
                      >
                        <Text style={s.optionIcon}>{o.icon}</Text>
                        <Text style={[s.optionLabel, form.gender === o.val && s.optionLabelSelected]}>
                          {o.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <View />
                    <Pressable
                      onPress={next}
                      disabled={!form.gender}
                      style={[s.btnNext, !form.gender && s.btnDisabled]}
                    >
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 2: Age ── */}
              {step === 2 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 2 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>How old are you?</Text>
                  <View style={s.numRow}>
                    <View>
                      <Text style={s.bigNumber}>{form.age}</Text>
                      <Text style={s.numUnit}>years old</Text>
                    </View>
                    <View style={s.stepperCol}>
                      <Pressable onPress={() => set("age", Math.min(99, form.age + 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>+</Text>
                      </Pressable>
                      <Pressable onPress={() => set("age", Math.max(10, form.age - 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>−</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={s.presetsRow}>
                    {[18, 25, 30, 35, 40, 50].map((a) => (
                      <Pressable
                        key={a}
                        onPress={() => set("age", a)}
                        style={[s.presetBtn, form.age === a && s.presetBtnActive]}
                      >
                        <Text style={[s.presetBtnText, form.age === a && s.presetBtnTextActive]}>{a}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable onPress={next} style={s.btnNext}>
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 3: Height ── */}
              {step === 3 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 3 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>How tall are you?</Text>
                  <View style={s.numRow}>
                    <View>
                      <Text style={s.bigNumber}>{form.height}</Text>
                      <Text style={s.numUnit}>centimeters</Text>
                    </View>
                    <View style={s.stepperCol}>
                      <Pressable onPress={() => set("height", Math.min(250, form.height + 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>+</Text>
                      </Pressable>
                      <Pressable onPress={() => set("height", Math.max(100, form.height - 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>−</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={s.presetsRow}>
                    {[155, 160, 165, 170, 175, 180, 185, 190].map((h) => (
                      <Pressable
                        key={h}
                        onPress={() => set("height", h)}
                        style={[s.presetBtn, form.height === h && s.presetBtnActive]}
                      >
                        <Text style={[s.presetBtnText, form.height === h && s.presetBtnTextActive]}>{h}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable onPress={next} style={s.btnNext}>
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 4: Weight ── */}
              {step === 4 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 4 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>What's your current weight?</Text>
                  <View style={s.numRow}>
                    <View>
                      <Text style={s.bigNumber}>{form.weight}</Text>
                      <Text style={s.numUnit}>kilograms</Text>
                    </View>
                    <View style={s.stepperCol}>
                      <Pressable onPress={() => set("weight", Math.min(200, form.weight + 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>+</Text>
                      </Pressable>
                      <Pressable onPress={() => set("weight", Math.max(30, form.weight - 1))} style={s.stepperBtn}>
                        <Text style={s.stepperBtnText}>−</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={s.presetsRow}>
                    {[50, 60, 70, 80, 90, 100].map((w) => (
                      <Pressable
                        key={w}
                        onPress={() => set("weight", w)}
                        style={[s.presetBtn, form.weight === w && s.presetBtnActive]}
                      >
                        <Text style={[s.presetBtnText, form.weight === w && s.presetBtnTextActive]}>{w}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable onPress={next} style={s.btnNext}>
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 5: Fitness Goal ── */}
              {step === 5 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 5 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>What's your main goal?</Text>
                  <View style={s.optionGrid}>
                    {[
                      { val: "lose fat",    icon: "🔥", label: "Lose fat",    sub: "Burn calories, slim down"    },
                      { val: "gain muscle", icon: "💪", label: "Gain muscle", sub: "Build mass and size"         },
                      { val: "strength",    icon: "🏋️", label: "Strength",    sub: "Lift heavier, get stronger"  },
                    ].map((o) => (
                      <Pressable
                        key={o.val}
                        onPress={() => set("fitnessGoal", o.val)}
                        style={[s.optionBtn, form.fitnessGoal === o.val && s.optionSelected]}
                      >
                        <Text style={s.optionIcon}>{o.icon}</Text>
                        <Text style={[s.optionLabel, form.fitnessGoal === o.val && s.optionLabelSelected]}>
                          {o.label}
                        </Text>
                        <Text style={s.optionSub}>{o.sub}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={next}
                      disabled={!form.fitnessGoal}
                      style={[s.btnNext, !form.fitnessGoal && s.btnDisabled]}
                    >
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 6: Experience ── */}
              {step === 6 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 6 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>What's your experience level?</Text>
                  <View style={s.optionGrid}>
                    {[
                      { val: "beginner",     icon: "🌱", label: "Beginner",     sub: "Under 1 year" },
                      { val: "intermediate", icon: "⚡", label: "Intermediate", sub: "1–3 years"    },
                      { val: "advanced",     icon: "🎯", label: "Advanced",     sub: "3+ years"     },
                    ].map((o) => (
                      <Pressable
                        key={o.val}
                        onPress={() => set("experienceLevel", o.val)}
                        style={[s.optionBtn, form.experienceLevel === o.val && s.optionSelected]}
                      >
                        <Text style={s.optionIcon}>{o.icon}</Text>
                        <Text style={[s.optionLabel, form.experienceLevel === o.val && s.optionLabelSelected]}>
                          {o.label}
                        </Text>
                        <Text style={s.optionSub}>{o.sub}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={next}
                      disabled={!form.experienceLevel}
                      style={[s.btnNext, !form.experienceLevel && s.btnDisabled]}
                    >
                      <Text style={s.btnNextText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── STEP 7: Workout Days ── */}
              {step === 7 && (
                <View style={s.stepWrap}>
                  <Text style={s.stepLabel}>Step 7 of {TOTAL_STEPS}</Text>
                  <Text style={s.question}>How many days per week can you train?</Text>
                  <View style={s.daysGrid}>
                    {dayLabels.map((d, i) => (
                      <Pressable
                        key={i}
                        onPress={() => toggleDay(i)}
                        style={[s.dayBtn, selectedDays.includes(i) && s.daySelected]}
                      >
                        <Text style={[s.dayBtnText, selectedDays.includes(i) && s.dayBtnTextSelected]}>
                          {d}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={s.daysHint}>
                    {selectedDays.length > 0
                      ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
                      : "Tap to select your training days"}
                  </Text>
                  <View style={s.navRow}>
                    <Pressable onPress={back} style={s.btnBack}>
                      <Text style={s.btnBackText}>Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={submit}
                      disabled={selectedDays.length === 0 || loading}
                      style={[s.btnNext, (selectedDays.length === 0 || loading) && s.btnDisabled]}
                    >
                      <Text style={s.btnNextText}>{loading ? "Saving…" : "Let's go →"}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f5f4f0" },
  scroll: {
    flexGrow: 1, justifyContent: "center",
    padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 20,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 28,
    minHeight: 520,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 24,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  progressTrack: { height: 2, backgroundColor: "#e8e6e0", borderRadius: 99, marginBottom: 32 },
  progressFill:  { height: 2, backgroundColor: "#1a1a1a", borderRadius: 99 },
  stepWrap:      { flex: 1, gap: 4 },
  stepLabel:     { fontSize: 11, fontWeight: "500", letterSpacing: 1, textTransform: "uppercase", color: "#999", marginBottom: 8 },
  question:      { fontSize: 26, fontWeight: "700", color: "#1a1a1a", lineHeight: 32, letterSpacing: -0.5, marginBottom: 24 },
  optionGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  optionBtn: {
    flex: 1, minWidth: "28%", backgroundColor: "#f7f6f2",
    borderWidth: 1.5, borderColor: "#e8e6e0", borderRadius: 14, padding: 14, gap: 5,
  },
  optionSelected: {
    borderColor: "#1a1a1a", backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  optionIcon:          { fontSize: 20 },
  optionLabel:         { fontSize: 13, fontWeight: "500", color: "#1a1a1a" },
  optionLabelSelected: { fontWeight: "700" },
  optionSub:           { fontSize: 11, color: "#999" },
  numRow:        { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  bigNumber:     { fontSize: 64, fontWeight: "800", color: "#1a1a1a", letterSpacing: -2, lineHeight: 72 },
  numUnit:       { fontSize: 14, color: "#999", marginTop: 4 },
  stepperCol:    { gap: 8 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#e8e6e0", backgroundColor: "#f7f6f2",
    alignItems: "center", justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, color: "#1a1a1a", fontWeight: "300", lineHeight: 24 },
  presetsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  presetBtn: {
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "#e8e6e0", backgroundColor: "#f7f6f2",
  },
  presetBtnActive:    { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  presetBtnText:      { fontSize: 13, color: "#999", fontWeight: "500" },
  presetBtnTextActive:{ color: "#fff" },
  daysGrid:    { flexDirection: "row", gap: 6, marginBottom: 12 },
  dayBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#e8e6e0",
    backgroundColor: "#f7f6f2", borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  daySelected:        { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  dayBtnText:         { fontSize: 13, fontWeight: "500", color: "#999" },
  dayBtnTextSelected: { color: "#fff" },
  daysHint:    { fontSize: 13, color: "#aaa", marginBottom: 8 },
  navRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 24, gap: 10,
  },
  btnBack: {
    borderWidth: 1.5, borderColor: "#e8e6e0", borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 18,
  },
  btnBackText: { fontSize: 14, color: "#999" },
  btnNext: {
    flex: 1, maxWidth: 200, backgroundColor: "#1a1a1a",
    borderRadius: 10, paddingVertical: 13, alignItems: "center",
  },
  btnDisabled:  { opacity: 0.3 },
  btnNextText:  { fontSize: 14, fontWeight: "600", color: "#fff" },
  doneWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: 12, paddingVertical: 40,
  },
  doneIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#f7f6f2",
    borderWidth: 1.5, borderColor: "#e8e6e0",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  doneIconText: { fontSize: 26 },
  doneTitle:    { fontSize: 28, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  doneSub:      { fontSize: 14, color: "#aaa" },
  chips:        { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  chip: {
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: "#f7f6f2", borderWidth: 1, borderColor: "#e8e6e0",
  },
  chipText: { fontSize: 12, color: "#666" },
});