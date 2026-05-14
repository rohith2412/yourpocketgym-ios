import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getToken } from "../src/auth/storage";

// ─── Constants ──────────────────────────────────────────────────────────────── kg
const TOTAL_STEPS = 7;
const ORANGE      = "#e8380d";
const INK         = "#1a1a1a";
const MUTED       = "#888";

const SCREEN_W = Dimensions.get("window").width;
const H_PAD    = 20;
const CARD_GAP = 10;
const HALF_W   = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;

// ─── Unsplash images ──────────────────────────────────────────────────────────
const IMG = {
  loseFat:      { uri: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" },
  gainMuscle:   { uri: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80" },
  strength:     { uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80" },
  beginner:     { uri: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&q=80" },
  intermediate: { uri: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&q=80" },
  advanced:     { uri: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80" },
};

// ─── Reusable image card ──────────────────────────────────────────────────────
function ImgCard({ image, label, sub, selected, onPress, fullWidth }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.imgCard, fullWidth ? s.imgCardFull : s.imgCardHalf]}
    >
      <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={s.imgScrim} />
      {selected && (
        <View style={s.checkBadge}>
          <Text style={s.checkMark}>✓</Text>
        </View>
      )}
      <View style={s.imgTextWrap}>
        <Text style={s.imgLabel}>{label}</Text>
        {sub ? <Text style={s.imgSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

// ─── Per-step copy ────────────────────────────────────────────────────────────
const STEP_CFG = [
  { titleBlack: "What's your",  titleOrange: "biological sex?",   sub: "Helps us tailor your training and nutrition." },
  { titleBlack: "How old",      titleOrange: "are you?",          sub: "Age shapes your recovery and metabolism." },
  { titleBlack: "How tall",     titleOrange: "are you?",          sub: "We use this to calculate your ideal calories." },
  { titleBlack: "What's your",  titleOrange: "current weight?",   sub: "We'll track your progress from here." },
  { titleBlack: "What's your",  titleOrange: "main goal?",        sub: "Your plan adapts completely to what you're working towards." },
  { titleBlack: "What's your",  titleOrange: "experience level?", sub: "We'll set the right starting intensity for you." },
  { titleBlack: "How many days",titleOrange: "can you train?",    sub: "Pick the days that work best for your schedule." },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function IntroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    age: 25, height: 170, weight: 70,
    gender: "", fitnessGoal: "", experienceLevel: "", workoutDaysPerWeek: 0,
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleDay = (i) => {
    const updated = selectedDays.includes(i)
      ? selectedDays.filter((d) => d !== i)
      : [...selectedDays, i];
    setSelectedDays(updated);
    set("workoutDaysPerWeek", updated.length);
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      if (token) {
        // Already registered (old flow: register → startersIntro)
        const res = await fetch("https://yourpocketgym.com/api/user-intro", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (!res.ok) { alert(`Server error: ${res.status}`); return; }
        const data = await res.json();
        if (data.success) {
          const userRaw = await AsyncStorage.getItem("user");
          if (userRaw) {
            const user = JSON.parse(userRaw);
            await AsyncStorage.setItem("user", JSON.stringify({ ...user, hasIntro: true }));
          }
          setDone(true);
          setTimeout(() => router.replace("/(tabs)/tracking"), 2000);
        } else {
          alert("Error: " + (data.error || "Something went wrong"));
        }
      } else {
        // New user flow: save locally, go to register
        await AsyncStorage.setItem("@pending_intro", JSON.stringify(form));
        router.replace("/register");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const canContinue =
    step === 1 ? !!form.gender :
    step === 5 ? !!form.fitnessGoal :
    step === 6 ? !!form.experienceLevel :
    step === 7 ? selectedDays.length > 0 :
    true;

  const cfg = STEP_CFG[step - 1];
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  if (done) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" />
        <View style={s.doneScreen}>
          <View style={s.doneCircle}>
            <Text style={s.doneCheck}>✓</Text>
          </View>
          <Text style={s.doneTitle}>All set!</Text>
          <Text style={s.doneSub}>Redirecting to your tracking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header: back + segmented progress ── */}
      <View style={s.header}>
        {step > 1 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={s.closeBtn} hitSlop={12}>
            <Text style={s.closeTxt}>←</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={s.segs}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[s.seg, i < step && s.segActive]} />
          ))}
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title block */}
        <View style={s.titleWrap}>
          <Text style={s.stepLabel}>STEP {step} OF {TOTAL_STEPS}</Text>
          <Text style={s.titleBlack}>{cfg.titleBlack}</Text>
          <Text style={s.titleOrange}>{cfg.titleOrange}</Text>
          <Text style={s.subtitle}>{cfg.sub}</Text>
        </View>

        {/* ── Step 1: Gender ── */}
        {step === 1 && (
          <View style={s.genderGrid}>
            {[
              { val: "male",   label: "Male",   icon: "♂" },
              { val: "female", label: "Female", icon: "♀" },
            ].map((o) => {
              const sel = form.gender === o.val;
              return (
                <Pressable
                  key={o.val}
                  onPress={() => set("gender", o.val)}
                  style={[s.genderCard, sel && s.genderCardActive]}
                >
                  <Text style={[s.genderIcon, sel && s.genderIconActive]}>{o.icon}</Text>
                  <Text style={[s.genderLabel, sel && s.genderLabelActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Step 2: Age ── */}
        {step === 2 && (
          <View style={s.numBlock}>
            <Text style={s.bigNum}>{form.age}</Text>
            <Text style={s.numUnit}>years old</Text>
            <View style={s.stepperRow}>
              <Pressable onPress={() => set("age", Math.max(10, form.age - 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>−</Text>
              </Pressable>
              <Pressable onPress={() => set("age", Math.min(99, form.age + 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>+</Text>
              </Pressable>
            </View>
            <View style={s.presetsRow}>
              {[18, 25, 30, 35, 40, 50].map((a) => (
                <Pressable key={a} onPress={() => set("age", a)} style={[s.preset, form.age === a && s.presetActive]}>
                  <Text style={[s.presetTxt, form.age === a && s.presetTxtActive]}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 3: Height ── */}
        {step === 3 && (
          <View style={s.numBlock}>
            <Text style={s.bigNum}>{form.height}</Text>
            <Text style={s.numUnit}>centimeters</Text>
            <View style={s.stepperRow}>
              <Pressable onPress={() => set("height", Math.max(100, form.height - 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>−</Text>
              </Pressable>
              <Pressable onPress={() => set("height", Math.min(250, form.height + 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>+</Text>
              </Pressable>
            </View>
            <View style={s.presetsRow}>
              {[155, 160, 165, 170, 175, 180, 185, 190].map((h) => (
                <Pressable key={h} onPress={() => set("height", h)} style={[s.preset, form.height === h && s.presetActive]}>
                  <Text style={[s.presetTxt, form.height === h && s.presetTxtActive]}>{h}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 4: Weight ── */}
        {step === 4 && (
          <View style={s.numBlock}>
            <Text style={s.bigNum}>{form.weight}</Text>
            <Text style={s.numUnit}>kilograms</Text>
            <View style={s.stepperRow}>
              <Pressable onPress={() => set("weight", Math.max(30, form.weight - 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>−</Text>
              </Pressable>
              <Pressable onPress={() => set("weight", Math.min(200, form.weight + 1))} style={s.stepper}>
                <Text style={s.stepperTxt}>+</Text>
              </Pressable>
            </View>
            <View style={s.presetsRow}>
              {[50, 60, 70, 80, 90, 100].map((w) => (
                <Pressable key={w} onPress={() => set("weight", w)} style={[s.preset, form.weight === w && s.presetActive]}>
                  <Text style={[s.presetTxt, form.weight === w && s.presetTxtActive]}>{w}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 5: Fitness Goal ── */}
        {step === 5 && (
          <View style={s.imgGrid}>
            {[
              { val: "lose fat",    label: "Lose Fat",    sub: "Calorie deficit, high protein",  img: IMG.loseFat },
              { val: "gain muscle", label: "Gain Muscle", sub: "High protein, calorie surplus",  img: IMG.gainMuscle },
              { val: "strength",    label: "Strength",    sub: "Lift heavier, get stronger",     img: IMG.strength },
            ].map((o, idx, arr) => (
              <ImgCard
                key={o.val}
                image={o.img}
                label={o.label}
                sub={o.sub}
                selected={form.fitnessGoal === o.val}
                onPress={() => set("fitnessGoal", o.val)}
                fullWidth={arr.length % 2 !== 0 && idx === arr.length - 1}
              />
            ))}
          </View>
        )}

        {/* ── Step 6: Experience ── */}
        {step === 6 && (
          <View style={s.imgGrid}>
            {[
              { val: "beginner",     label: "Beginner",     sub: "Under 1 year", img: IMG.beginner },
              { val: "intermediate", label: "Intermediate", sub: "1–3 years",    img: IMG.intermediate },
              { val: "advanced",     label: "Advanced",     sub: "3+ years",     img: IMG.advanced },
            ].map((o, idx, arr) => (
              <ImgCard
                key={o.val}
                image={o.img}
                label={o.label}
                sub={o.sub}
                selected={form.experienceLevel === o.val}
                onPress={() => set("experienceLevel", o.val)}
                fullWidth={arr.length % 2 !== 0 && idx === arr.length - 1}
              />
            ))}
          </View>
        )}

        {/* ── Step 7: Workout days ── */}
        {step === 7 && (
          <View style={s.daysWrap}>
            <View style={s.daysGrid}>
              {DAY_LABELS.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[s.dayBtn, selectedDays.includes(i) && s.dayBtnActive]}
                >
                  <Text style={[s.dayTxt, selectedDays.includes(i) && s.dayTxtActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.daysHint}>
              {selectedDays.length > 0
                ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
                : "Tap to select your training days"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed footer CTA ── */}
      <View style={s.footer}>
        <Pressable
          onPress={step === TOTAL_STEPS ? submit : next}
          disabled={!canContinue || loading}
          style={[s.cta, (!canContinue || loading) && s.ctaDisabled]}
        >
          <Text style={s.ctaTxt}>
            {step === TOTAL_STEPS
              ? loading ? "Saving…" : "Let's go →"
              : "Continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 16, gap: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center",
  },
  closeTxt: { fontSize: 14, color: INK, fontWeight: "500" },
  segs: { flex: 1, flexDirection: "row", gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 99, backgroundColor: "#e8e6e1" },
  segActive: { backgroundColor: INK },

  scroll: { paddingHorizontal: H_PAD, paddingBottom: 24 },

  titleWrap: { marginBottom: 28 },
  stepLabel: {
    fontSize: 11, fontWeight: "600", color: MUTED,
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
  },
  titleBlack:  { fontSize: 36, fontWeight: "800", color: INK, letterSpacing: -1, lineHeight: 42 },
  titleOrange: { fontSize: 36, fontWeight: "800", color: ORANGE, letterSpacing: -1, lineHeight: 44, marginBottom: 12 },
  subtitle:    { fontSize: 15, color: MUTED, lineHeight: 22 },

  // Gender
  genderGrid: { flexDirection: "row", gap: CARD_GAP },
  genderCard: {
    flex: 1, paddingVertical: 36, borderRadius: 24,
    backgroundColor: "#f7f6f2", alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: "transparent",
  },
  genderCardActive: { borderColor: ORANGE, backgroundColor: "#fff" },
  genderIcon: { fontSize: 48, color: MUTED },
  genderIconActive: { color: ORANGE },
  genderLabel: { fontSize: 16, fontWeight: "700", color: MUTED },
  genderLabelActive: { color: INK },

  // Image grid
  imgGrid:     { flexDirection: "row", flexWrap: "wrap", gap: CARD_GAP },
  imgCard:     { borderRadius: 18, overflow: "hidden", height: 200 },
  imgCardHalf: { width: HALF_W },
  imgCardFull: { width: "100%" },
  imgScrim:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.38)" },
  checkBadge: {
    position: "absolute", top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  checkMark:   { fontSize: 15, color: INK, fontWeight: "700" },
  imgTextWrap: { position: "absolute", bottom: 14, left: 14, right: 14 },
  imgLabel:    { fontSize: 17, fontWeight: "700", color: "#fff" },
  imgSub:      { fontSize: 12, color: "rgba(255,255,255,0.82)", marginTop: 3 },

  // Stepper
  numBlock:    { alignItems: "center", paddingTop: 16, gap: 6 },
  bigNum:      { fontSize: 88, fontWeight: "800", color: INK, letterSpacing: -4, lineHeight: 96 },
  numUnit:     { fontSize: 16, color: MUTED, marginBottom: 20 },
  stepperRow:  { flexDirection: "row", gap: 16, marginBottom: 36 },
  stepper:     { width: 60, height: 60, borderRadius: 30, backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center" },
  stepperTxt:  { fontSize: 30, color: INK, fontWeight: "300", lineHeight: 36 },
  presetsRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  preset:      { borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: "#e8e6e1", backgroundColor: "#f7f6f2" },
  presetActive: { backgroundColor: INK, borderColor: INK },
  presetTxt:   { fontSize: 14, color: MUTED, fontWeight: "500" },
  presetTxtActive: { color: "#fff" },

  // Days
  daysWrap:    { gap: 14 },
  daysGrid:    { flexDirection: "row", gap: 7 },
  dayBtn:      { flex: 1, height: 54, borderRadius: 12, backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center" },
  dayBtnActive: { backgroundColor: INK },
  dayTxt:      { fontSize: 14, fontWeight: "600", color: MUTED },
  dayTxtActive: { color: "#fff" },
  daysHint:    { fontSize: 13, color: "#bbb", textAlign: "center" },

  // Footer
  footer: { paddingHorizontal: H_PAD, paddingBottom: 36, paddingTop: 12, backgroundColor: "#fff" },
  cta:    { backgroundColor: INK, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  ctaDisabled: { opacity: 0.3 },
  ctaTxt: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Done
  doneScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  doneCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(232,56,13,0.1)", borderWidth: 1.5, borderColor: "rgba(232,56,13,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  doneCheck: { fontSize: 32, color: ORANGE },
  doneTitle: { fontSize: 32, fontWeight: "800", color: INK, letterSpacing: -1 },
  doneSub:   { fontSize: 15, color: MUTED },
});
