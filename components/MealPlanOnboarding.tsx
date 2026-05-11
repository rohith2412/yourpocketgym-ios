import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DEFAULT_PREFERENCES, MealPreferences } from "../src/utils/mealPlanGenerator";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 52) / 2;
const TOTAL_STEPS = 5;

interface Props {
  onComplete: (prefs: MealPreferences) => void;
  onSkip: () => void;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const GOALS = [
  {
    key: "lose_weight",
    label: "Lose Weight",
    sub: "Calorie deficit, high protein",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "maintain",
    label: "Maintain",
    sub: "Balanced macros & calories",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "gain_muscle",
    label: "Gain Muscle",
    sub: "High protein, calorie surplus",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "gain_weight",
    label: "Gain Weight",
    sub: "Dense calories, frequent meals",
    image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80",
  },
] as const;

const DIETS = [
  { key: "vegetarian",  label: "Vegetarian",  sub: "No meat or fish" },
  { key: "vegan",       label: "Vegan",        sub: "No animal products" },
  { key: "gluten-free", label: "Gluten-Free",  sub: "No wheat, rye, barley" },
  { key: "dairy-free",  label: "Dairy-Free",   sub: "No milk products" },
];

const ALLERGIES_LIST = [
  { key: "nuts",      label: "Nuts" },
  { key: "shellfish", label: "Shellfish" },
  { key: "eggs",      label: "Eggs" },
  { key: "soy",       label: "Soy" },
  { key: "gluten",    label: "Gluten" },
  { key: "dairy",     label: "Dairy" },
];

const CUISINES = [
  { key: "italian",       label: "Italian",        image: "https://images.pexels.com/photos/5836438/pexels-photo-5836438.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "japanese",      label: "Japanese",       image: "https://images.pexels.com/photos/15108364/pexels-photo-15108364.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "mexican",       label: "Mexican",        image: "https://images.pexels.com/photos/17274222/pexels-photo-17274222.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "indian",        label: "Indian",         image: "https://images.pexels.com/photos/36982119/pexels-photo-36982119.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "chinese",       label: "Chinese",        image: "https://images.pexels.com/photos/34772941/pexels-photo-34772941.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "mediterranean", label: "Mediterranean",  image: "https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "thai",          label: "Thai",           image: "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "american",      label: "American",       image: "https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "korean",        label: "Korean",         image: "https://images.pexels.com/photos/37309226/pexels-photo-37309226.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "french",        label: "French",         image: "https://images.pexels.com/photos/580606/pexels-photo-580606.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "middle_eastern",label: "Middle Eastern", image: "https://images.pexels.com/photos/6275164/pexels-photo-6275164.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "greek",         label: "Greek",          image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "spanish",       label: "Spanish",        image: "https://images.pexels.com/photos/36971424/pexels-photo-36971424.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "vietnamese",    label: "Vietnamese",     image: "https://images.pexels.com/photos/7492301/pexels-photo-7492301.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "african",       label: "African",        image: "https://images.pexels.com/photos/17502263/pexels-photo-17502263.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "brazilian",     label: "Brazilian",      image: "https://images.pexels.com/photos/5639338/pexels-photo-5639338.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "turkish",       label: "Turkish",        image: "https://images.pexels.com/photos/5191842/pexels-photo-5191842.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "british",       label: "British",        image: "https://images.pexels.com/photos/10895779/pexels-photo-10895779.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "peruvian",      label: "Peruvian",       image: "https://images.pexels.com/photos/28503597/pexels-photo-28503597.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { key: "moroccan",      label: "Moroccan",       image: "https://images.pexels.com/photos/17366877/pexels-photo-17366877.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const CALORIE_PRESETS = [
  { label: "Light",    val: 1500, sub: "~1500 cal" },
  { label: "Moderate", val: 2000, sub: "~2000 cal" },
  { label: "Active",   val: 2500, sub: "~2500 cal" },
  { label: "Athlete",  val: 3000, sub: "~3000 cal" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[s.dot, i < step && s.dotActive]} />
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MealPlanOnboarding({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<MealPreferences>({ ...DEFAULT_PREFERENCES });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateNext = (fn: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(fn, 100);
  };

  const next = () => {
    if (step < TOTAL_STEPS) animateNext(() => setStep((s) => s + 1));
    else onComplete(prefs);
  };

  const back = () => animateNext(() => setStep((s) => s - 1));

  const canNext = step === 1 ? !!prefs.goal : true;

  return (
    <View style={s.root}>

      {/* Nav */}
      <View style={s.nav}>
        {step > 1 ? (
          <Pressable onPress={back} style={s.navBack}>
            <Text style={s.navBackText}>←</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onSkip} style={s.navBack}>
            <Text style={s.navCloseText}>✕</Text>
          </Pressable>
        )}
        <ProgressDots step={step} />
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* ══ STEP 1: GOAL ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <View style={s.step}>
            <View style={s.headWrap}>
              <Text style={s.eyebrow}>STEP 1 OF {TOTAL_STEPS}</Text>
              <Text style={s.bigTitle}>What's your{"\n"}<Text style={s.accent}>goal?</Text></Text>
              <Text style={s.bigSub}>Your plan adapts completely to what you're working towards.</Text>
            </View>

            <ScrollView contentContainerStyle={s.goalGrid} showsVerticalScrollIndicator={false}>
              {GOALS.map((g) => {
                const active = prefs.goal === g.key;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => setPrefs((p) => ({ ...p, goal: g.key }))}
                    style={[s.goalCard, active && s.goalCardActive]}
                  >
                    <Image
                      source={g.image}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={300}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.65)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    {active && (
                      <View style={s.goalCheck}>
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>✓</Text>
                      </View>
                    )}
                    <View style={s.goalCardContent}>
                      <Text style={s.goalLabel}>{g.label}</Text>
                      <Text style={s.goalSub}>{g.sub}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ══ STEP 2: DIET ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <ScrollView contentContainerStyle={s.scrollStep} showsVerticalScrollIndicator={false}>
            <Text style={s.eyebrow}>STEP 2 OF {TOTAL_STEPS}</Text>
            <Text style={s.bigTitle}>Dietary{"\n"}<Text style={s.accent}>preferences?</Text></Text>
            <Text style={s.bigSub}>Select all that apply, or skip.</Text>

            <View style={s.bigCardGrid}>
              {DIETS.map((d) => {
                const active = prefs.dietaryRestrictions.includes(d.key);
                return (
                  <Pressable
                    key={d.key}
                    onPress={() =>
                      setPrefs((p) => ({
                        ...p,
                        dietaryRestrictions: toggle(p.dietaryRestrictions, d.key),
                      }))
                    }
                    style={[s.bigChipCard, active && s.bigChipCardActive]}
                  >
                    <Text style={[s.bigChipLabel, active && s.bigChipLabelActive]}>{d.label}</Text>
                    <Text style={s.bigChipSub}>{d.sub}</Text>
                    {active && (
                      <View style={s.bigChipCheck}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>ALLERGIES</Text>
            <View style={s.allergyRow}>
              {ALLERGIES_LIST.map((a) => {
                const active = prefs.allergies.includes(a.key);
                return (
                  <Pressable
                    key={a.key}
                    onPress={() =>
                      setPrefs((p) => ({ ...p, allergies: toggle(p.allergies, a.key) }))
                    }
                    style={[s.allergyChip, active && s.allergyChipActive]}
                  >
                    <Text style={[s.allergyText, active && s.allergyTextActive]}>{a.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ══ STEP 3: CUISINE ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <View style={s.step}>
            <View style={s.headWrap}>
              <Text style={s.eyebrow}>STEP 3 OF {TOTAL_STEPS}</Text>
              <Text style={s.bigTitle}>Favourite{"\n"}<Text style={s.accent}>cuisines?</Text></Text>
              <Text style={s.bigSub}>Pick as many as you like.</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.cuisineGrid}
            >
              {Array.from({ length: Math.ceil(CUISINES.length / 2) }).map((_, rowIdx) => (
                <View key={rowIdx} style={s.cuisineRow}>
                  {CUISINES.slice(rowIdx * 2, rowIdx * 2 + 2).map((c) => {
                    const active = prefs.cuisinePreferences.includes(c.key);
                    return (
                      <Pressable
                        key={c.key}
                        onPress={() =>
                          setPrefs((p) => ({
                            ...p,
                            cuisinePreferences: toggle(p.cuisinePreferences, c.key),
                          }))
                        }
                        style={s.cuisineCard}
                      >
                        <Image
                          source={c.image}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={300}
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.72)"]}
                          style={StyleSheet.absoluteFill}
                        />
                        {active && <View style={s.cuisineOverlay} />}
                        <Text style={s.cuisineLabel}>{c.label}</Text>
                        {active && (
                          <View style={s.cuisineCheck}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ══ STEP 4: CALORIES ══════════════════════════════════════════════════════ */}
        {step === 4 && (
          <ScrollView
            contentContainerStyle={s.scrollStep}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.eyebrow}>STEP 4 OF {TOTAL_STEPS}</Text>
            <Text style={s.bigTitle}>Daily calorie{"\n"}<Text style={s.accent}>target?</Text></Text>
            <Text style={s.bigSub}>Choose a preset or type your own.</Text>

            <View style={s.presetRow}>
              {CALORIE_PRESETS.map((p) => {
                const active = prefs.calorieTarget === p.val;
                return (
                  <Pressable
                    key={p.val}
                    onPress={() => setPrefs((prev) => ({ ...prev, calorieTarget: p.val }))}
                    style={[s.presetCard, active && s.presetCardActive]}
                  >
                    <Text style={[s.presetLabel, active && s.presetLabelActive]}>{p.label}</Text>
                    <Text style={s.presetSub}>{p.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.customCalRow}>
              <TextInput
                style={s.calInput}
                keyboardType="numeric"
                value={prefs.calorieTarget === 0 ? "" : String(prefs.calorieTarget)}
                placeholder="Or type a custom number…"
                placeholderTextColor="#c0bdb5"
                onChangeText={(v) =>
                  setPrefs((p) => ({ ...p, calorieTarget: parseInt(v) || 0 }))
                }
              />
              <Text style={s.calUnit}>cal</Text>
            </View>

            <Text style={s.sectionLabel}>INCLUDE SNACKS?</Text>
            <View style={s.snackRow}>
              {[true, false].map((val) => (
                <Pressable
                  key={String(val)}
                  onPress={() => setPrefs((p) => ({ ...p, includeSnacks: val }))}
                  style={[s.snackBtn, prefs.includeSnacks === val && s.snackBtnActive]}
                >
                  <Text style={[s.snackBtnText, prefs.includeSnacks === val && s.snackBtnTextActive]}>
                    {val ? "Yes, include snacks" : "No snacks"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ══ STEP 5: COOKING TIME ══════════════════════════════════════════════════ */}
        {step === 5 && (
          <View style={s.step}>
            <View style={s.headWrap}>
              <Text style={s.eyebrow}>STEP 5 OF {TOTAL_STEPS}</Text>
              <Text style={s.bigTitle}>How long to{"\n"}<Text style={s.accent}>cook?</Text></Text>
              <Text style={s.bigSub}>We'll filter out recipes that take too long.</Text>
            </View>

            <View style={s.cookTimeGrid}>
              {[
                { key: "quick", label: "Quick meals",  sub: "Under 15 minutes", desc: "Salads, wraps, protein bowls — ready fast." },
                { key: "any",   label: "Any length",   sub: "No time limit",    desc: "Full variety — curries, stews, baked dishes." },
              ].map((ct) => {
                const active = prefs.cookingTime === ct.key;
                return (
                  <Pressable
                    key={ct.key}
                    onPress={() => setPrefs((p) => ({ ...p, cookingTime: ct.key as any }))}
                    style={[s.cookTimeCard, active && s.cookTimeCardActive]}
                  >
                    <Text style={[s.cookTimeLabel, active && s.cookTimeLabelActive]}>{ct.label}</Text>
                    <Text style={s.cookTimeSub}>{ct.sub}</Text>
                    <Text style={s.cookTimeDesc}>{ct.desc}</Text>
                    {active && (
                      <View style={s.cookTimeCheck}>
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

      </Animated.View>

      {/* CTA */}
      <View style={s.footer}>
        <Pressable
          onPress={next}
          disabled={!canNext}
          style={({ pressed }) => [s.nextBtn, !canNext && { opacity: 0.3 }, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.nextBtnText}>
            {step === TOTAL_STEPS ? "Generate My Plan" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },

  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  navBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navBackText: { fontSize: 22, color: "#0e0e0e" },
  navCloseText: { fontSize: 18, color: "rgba(0,0,0,0.3)" },
  navSkip: { paddingVertical: 8, paddingHorizontal: 4 },
  navSkipText: { fontSize: 14, color: "rgba(0,0,0,0.3)", fontWeight: "500" },

  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: "#e8e5de" },
  dotActive: { backgroundColor: "#0e0e0e" },

  // Typography
  eyebrow: {
    fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.3)",
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12,
  },
  bigTitle: {
    fontSize: 46, fontWeight: "900", color: "#0e0e0e",
    letterSpacing: -2, lineHeight: 50, marginBottom: 12,
  },
  accent: { color: "#e8380d" },
  bigSub:  { fontSize: 15, color: "rgba(0,0,0,0.38)", lineHeight: 22, marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.3)",
    letterSpacing: 1.5, textTransform: "uppercase", marginTop: 28, marginBottom: 12,
  },

  step:       { flex: 1, paddingHorizontal: 20 },
  headWrap:   { paddingTop: 4 },
  scrollStep: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Step 1: Goals ──
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 4, paddingBottom: 20 },
  goalCard: {
    width: CARD_W, height: 185,
    borderRadius: 20, overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: 2, borderColor: "transparent",
  },
  goalCardActive: { borderColor: "#0e0e0e" },
  goalCheck: {
    position: "absolute", top: 12, right: 12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#0e0e0e",
    alignItems: "center", justifyContent: "center",
  },
  goalCardContent: { padding: 14 },
  goalLabel: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  goalSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  // ── Step 2: Diet ──
  bigCardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  bigChipCard: {
    width: CARD_W,
    backgroundColor: "#f7f7f5", borderRadius: 18,
    padding: 18, borderWidth: 1.5, borderColor: "transparent", gap: 4,
  },
  bigChipCardActive:  { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  bigChipLabel:       { fontSize: 16, fontWeight: "700", color: "rgba(0,0,0,0.5)" },
  bigChipLabelActive: { color: "#0e0e0e" },
  bigChipSub:         { fontSize: 12, color: "rgba(0,0,0,0.3)" },
  bigChipCheck: {
    position: "absolute", top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#0e0e0e", alignItems: "center", justifyContent: "center",
  },

  allergyRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  allergyChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24,
    backgroundColor: "#f4f4f2", borderWidth: 1.5, borderColor: "transparent",
  },
  allergyChipActive: { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  allergyText:       { fontSize: 14, fontWeight: "600", color: "rgba(0,0,0,0.5)" },
  allergyTextActive: { color: "#0e0e0e" },

  // ── Step 3: Cuisine — scrollable 2-column grid ──
  cuisineGrid: { gap: 12, paddingTop: 4, paddingBottom: 16 },
  cuisineRow:  { flexDirection: "row", gap: 12 },
  cuisineCard: {
    flex: 1, height: 110,
    borderRadius: 18, overflow: "hidden",
    justifyContent: "flex-end", padding: 12,
    borderWidth: 2, borderColor: "transparent",
  },
  cuisineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(232,56,13,0.2)",
  },
  cuisineLabel: { fontSize: 15, fontWeight: "800", color: "#fff" },
  cuisineCheck: {
    position: "absolute", top: 10, right: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#e8380d", alignItems: "center", justifyContent: "center",
  },

  // ── Step 4: Calories ──
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  presetCard: {
    flex: 1, minWidth: "44%",
    backgroundColor: "#f7f7f5", borderRadius: 16, padding: 16, gap: 4,
    borderWidth: 1.5, borderColor: "transparent",
  },
  presetCardActive:  { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  presetLabel:       { fontSize: 17, fontWeight: "700", color: "rgba(0,0,0,0.4)" },
  presetLabelActive: { color: "#0e0e0e" },
  presetSub:         { fontSize: 12, color: "rgba(0,0,0,0.3)" },

  customCalRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  calInput: {
    flex: 1, backgroundColor: "#f7f7f5", borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 18,
    fontSize: 18, fontWeight: "700", color: "#0e0e0e",
    borderWidth: 1, borderColor: "#e8e5de",
  },
  calUnit: { fontSize: 14, color: "rgba(0,0,0,0.35)", fontWeight: "600" },

  snackRow: { gap: 10 },
  snackBtn: {
    paddingVertical: 18, borderRadius: 14, alignItems: "center",
    backgroundColor: "#f7f7f5", borderWidth: 1.5, borderColor: "transparent",
  },
  snackBtnActive:     { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  snackBtnText:       { fontSize: 16, fontWeight: "600", color: "rgba(0,0,0,0.4)" },
  snackBtnTextActive: { color: "#0e0e0e" },

  // ── Step 5: Cook time ──
  cookTimeGrid: { flex: 1, gap: 14, paddingTop: 4 },
  cookTimeCard: {
    flex: 1, backgroundColor: "#f7f7f5",
    borderRadius: 22, padding: 24, gap: 6,
    borderWidth: 2, borderColor: "transparent",
  },
  cookTimeCardActive:  { borderColor: "#0e0e0e", backgroundColor: "#fff" },
  cookTimeLabel:       { fontSize: 22, fontWeight: "800", color: "rgba(0,0,0,0.4)" },
  cookTimeLabelActive: { color: "#0e0e0e" },
  cookTimeSub:         { fontSize: 14, fontWeight: "600", color: "rgba(0,0,0,0.3)" },
  cookTimeDesc:        { fontSize: 13, color: "rgba(0,0,0,0.25)", lineHeight: 20, marginTop: 4 },
  cookTimeCheck: {
    position: "absolute", top: 18, right: 18,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#0e0e0e", alignItems: "center", justifyContent: "center",
  },

  // CTA
  footer: { padding: 20, paddingBottom: 44 },
  nextBtn: {
    backgroundColor: "#0e0e0e",
    borderRadius: 18, paddingVertical: 20, alignItems: "center",
  },
  nextBtnText: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
});
