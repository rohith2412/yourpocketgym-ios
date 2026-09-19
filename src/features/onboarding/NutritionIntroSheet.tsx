import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text as RNText,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useAddWeight } from "../progress/hooks";
import { useSaveIntroPartial } from "./introApi";

/**
 * Cal AI–style onboarding: one big question per screen, progress dots at
 * the top, tap Continue to advance. Collects the four fields the Nutrition
 * page needs to calibrate goals — weight, height, age, fitness goal —
 * and nothing more. The full profile can be filled in later from the
 * Profile page.
 *
 * On finish:
 *   - the weight becomes the first entry in the weight log
 *   - all four fields land in `/user-intro` (mirrored locally)
 */

type Goal = "lose fat" | "gain muscle" | "maintain";

const STEPS = ["weight", "height", "age", "goal"] as const;
type Step = (typeof STEPS)[number];

export function NutritionIntroSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const saveIntro = useSaveIntroPartial();
  const addWeight = useAddWeight();

  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(""); // kg
  const [height, setHeight] = useState(""); // cm
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);

  const current: Step = STEPS[step];

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void finish();
  };

  const back = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const canContinue = (() => {
    if (current === "weight") return !!weight && Number(weight) > 0;
    if (current === "height") return !!height && Number(height) > 0;
    if (current === "age") return !!age && Number(age) >= 10 && Number(age) < 120;
    if (current === "goal") return !!goal;
    return false;
  })();

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    try {
      // Weight → weight log so the Progress trend has a real starting point.
      // The value the user just entered is treated as "today".
      await addWeight.mutateAsync({ lb: kgToLb(w) });
      // All four values → user-intro (mirrored locally).
      await saveIntro.mutateAsync({
        weight: w,
        height: h,
        age: a,
        fitnessGoal: goal ?? "maintain",
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Please try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 16 }]}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          <Pressable onPress={back} hitSlop={12} disabled={step === 0}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={step === 0 ? "transparent" : c.text}
            />
          </Pressable>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i <= step ? c.text : c.border,
                }}
              />
            ))}
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 40,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {current === "weight" ? (
            <QuestionCard
              title="What's your current weight?"
              caption="We'll set your starting point on the weight chart."
            >
              <UnitInput
                value={weight}
                onChangeText={setWeight}
                unit="kg"
                placeholder="72"
              />
            </QuestionCard>
          ) : current === "height" ? (
            <QuestionCard
              title="How tall are you?"
              caption="Height is used with your weight to calibrate calorie targets."
            >
              <UnitInput
                value={height}
                onChangeText={setHeight}
                unit="cm"
                placeholder="178"
              />
            </QuestionCard>
          ) : current === "age" ? (
            <QuestionCard
              title="How old are you?"
              caption="Age affects your daily calorie burn."
            >
              <UnitInput
                value={age}
                onChangeText={setAge}
                unit="years"
                placeholder="24"
              />
            </QuestionCard>
          ) : (
            <QuestionCard
              title="What's your goal?"
              caption="We'll set your macro split around this."
            >
              <View style={{ gap: 12, marginTop: 8 }}>
                {(["lose fat", "gain muscle", "maintain"] as Goal[]).map((g) => (
                  <GoalPill
                    key={g}
                    label={goalLabel(g)}
                    sub={goalSub(g)}
                    active={goal === g}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setGoal(g);
                    }}
                  />
                ))}
              </View>
            </QuestionCard>
          )}
        </ScrollView>

        {/* Continue */}
        <View style={{ padding: 24, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
          <Pressable
            onPress={next}
            disabled={!canContinue || saveIntro.isPending || addWeight.isPending}
            style={({ pressed }) => ({
              height: 58,
              borderRadius: 29,
              backgroundColor: c.inverseBg,
              alignItems: "center",
              justifyContent: "center",
              opacity:
                !canContinue || saveIntro.isPending || addWeight.isPending
                  ? 0.35
                  : pressed
                  ? 0.85
                  : 1,
            })}
          >
            <RNText
              style={{
                color: c.inverseText,
                fontSize: 17,
                fontWeight: "700",
                letterSpacing: -0.2,
              }}
            >
              {step === STEPS.length - 1
                ? saveIntro.isPending || addWeight.isPending
                  ? "Saving…"
                  : "Get started"
                : "Continue"}
            </RNText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function QuestionCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 12 }}>
      <RNText
        style={{
          fontSize: 30,
          fontWeight: "800",
          letterSpacing: -0.8,
          color: c.text,
          lineHeight: 36,
        }}
      >
        {title}
      </RNText>
      <RNText style={{ fontSize: 15, color: c.textMuted, lineHeight: 20, marginBottom: 24 }}>
        {caption}
      </RNText>
      {children}
    </View>
  );
}

function UnitInput({
  value,
  onChangeText,
  unit,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  placeholder: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        borderBottomWidth: 2,
        borderBottomColor: c.border,
        paddingBottom: 12,
        gap: 8,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        keyboardType="numeric"
        autoFocus
        maxLength={5}
        style={{
          flex: 1,
          fontSize: 64,
          fontWeight: "800",
          letterSpacing: -2,
          color: c.text,
          padding: 0,
        }}
      />
      <RNText style={{ fontSize: 22, fontWeight: "600", color: c.textMuted }}>
        {unit}
      </RNText>
    </View>
  );
}

function GoalPill({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 18,
        borderRadius: 16,
        backgroundColor: active ? c.inverseBg : c.surface,
        borderWidth: 1,
        borderColor: active ? c.inverseBg : c.border,
        opacity: pressed ? 0.9 : 1,
        gap: 4,
      })}
    >
      <RNText
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: active ? c.inverseText : c.text,
        }}
      >
        {label}
      </RNText>
      <RNText
        style={{
          fontSize: 13,
          color: active ? "rgba(255,255,255,0.7)" : c.textMuted,
        }}
      >
        {sub}
      </RNText>
    </Pressable>
  );
}

function goalLabel(g: Goal) {
  return g === "lose fat" ? "Lose fat" : g === "gain muscle" ? "Gain muscle" : "Maintain";
}
function goalSub(g: Goal) {
  return g === "lose fat"
    ? "Calorie deficit, higher protein"
    : g === "gain muscle"
    ? "Slight surplus, high protein"
    : "Stay where you are";
}

const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
});
