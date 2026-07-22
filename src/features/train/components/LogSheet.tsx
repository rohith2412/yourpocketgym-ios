import { useEffect, useMemo, useState } from "react";
import { View, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Text, Button, Card, Badge, Separator } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from "../data";
import { useSaveWorkout, useWorkoutLogs, lastLiftFor, type TrackedExercise } from "../api";
import type { RoutineExercise } from "../../routines/storage";

type DraftSet = { reps: string; weight: string };
type DraftExercise = { name: string; mg: MuscleGroup; sets: DraftSet[] };
type Step = "muscles" | "exercises" | "sets";

export function LogSheet({
  visible,
  onClose,
  initialExercises,
  routineName,
}: {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill from a routine (skips picking exercises). */
  initialExercises?: RoutineExercise[];
  routineName?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const save = useSaveWorkout();
  const { data: logs = [] } = useWorkoutLogs();

  const [step, setStep] = useState<Step>("muscles");
  const [activeMg, setActiveMg] = useState<MuscleGroup | null>(null);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [activeEx, setActiveEx] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Seed from a routine when opened. Blank sets ready to fill with real reps/weight.
  useEffect(() => {
    if (visible && initialExercises && initialExercises.length > 0) {
      setExercises(
        initialExercises.map((e) => ({
          name: e.name,
          mg: e.muscleGroup,
          sets: [{ reps: "", weight: "" }],
        })),
      );
      setStep("muscles");
      setActiveEx(null);
    }
  }, [visible, initialExercises]);

  // Last lift info for the currently-active exercise (progressive overload hint).
  const lastLift = useMemo(() => {
    if (activeEx === null) return null;
    return lastLiftFor(logs, exercises[activeEx]?.name ?? "");
  }, [logs, exercises, activeEx]);

  const reset = () => {
    setStep("muscles");
    setActiveMg(null);
    setActiveEx(null);
    setExercises([]);
    setNotes("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const stepIndex = step === "muscles" ? 0 : step === "exercises" ? 1 : 2;
  const currentEx = activeEx !== null ? exercises[activeEx] : null;
  const alreadyAdded = new Set(exercises.map((e) => e.name));

  const pickMuscle = (mg: MuscleGroup) => {
    setActiveMg(mg);
    setStep("exercises");
  };

  const pickExercise = (name: string) => {
    const existing = exercises.findIndex((e) => e.name === name);
    if (existing >= 0) {
      setActiveEx(existing);
    } else {
      const next = [...exercises, { name, mg: activeMg!, sets: [{ reps: "", weight: "" }] }];
      setExercises(next);
      setActiveEx(next.length - 1);
    }
    setStep("sets");
  };

  const updateSet = (si: number, field: "reps" | "weight", val: string) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== activeEx ? ex : { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, [field]: val } : s)) },
      ),
    );

  const addSet = () =>
    setExercises((prev) =>
      prev.map((ex, i) => (i !== activeEx ? ex : { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] })),
    );

  const removeSet = (si: number) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i !== activeEx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== si) })),
    );

  const removeExercise = (ei: number) => setExercises((prev) => prev.filter((_, i) => i !== ei));

  const submit = async () => {
    if (!exercises.length) {
      Alert.alert("Add at least one exercise.");
      return;
    }
    const cleaned: TrackedExercise[] = exercises.map((ex) => ({
      name: ex.name,
      muscleGroup: ex.mg,
      sets: ex.sets.map((s, i) => ({
        setNumber: i + 1,
        reps: Number(s.reps) || 0,
        weight: Number(s.weight) || 0,
      })),
    }));
    if (cleaned.some((ex) => ex.sets.some((s) => s.reps === 0 || s.weight === 0))) {
      Alert.alert("Fill in all reps and weights.");
      return;
    }
    try {
      await save.mutateAsync({ date: new Date().toISOString(), exercises: cleaned, notes });
      close();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Try again.");
    }
  };

  // ── Step indicator ───────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.lg }}>
      {["Muscle", "Exercise", "Sets"].map((label, i) => (
        <View key={label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: i <= stepIndex ? c.text : c.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: i <= stepIndex ? c.inverseText : c.textFaint }}>
              {i + 1}
            </Text>
          </View>
          <Text variant="caption" color={i <= stepIndex ? "text" : "textFaint"} weight="semibold">
            {label}
          </Text>
          {i < 2 ? (
            <View
              style={{
                flex: 1,
                height: 2,
                marginHorizontal: 6,
                borderRadius: 99,
                backgroundColor: i < stepIndex ? c.text : c.surfaceAlt,
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={close}>
      <StepIndicator />

      <ScrollView
        style={{ maxHeight: 500 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: MUSCLES ───────────────────────────────────────────────── */}
        {step === "muscles" ? (
          <>
            <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
              {exercises.length === 0
                ? "Pick a muscle group"
                : `${exercises.length} exercise${exercises.length !== 1 ? "s" : ""} added`}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
              {MUSCLE_GROUPS.map((mg) => {
                const count = exercises.filter((e) => e.mg === mg).length;
                return (
                  <Pressable
                    key={mg}
                    onPress={() => pickMuscle(mg)}
                    style={{
                      width: "48%",
                      paddingVertical: 18,
                      paddingHorizontal: theme.spacing.lg,
                      borderRadius: theme.radius.lg,
                      borderWidth: 1,
                      borderColor: count > 0 ? c.text : c.border,
                      backgroundColor: count > 0 ? c.text : c.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text variant="body" weight="bold" style={{ color: count > 0 ? c.inverseText : c.text }}>
                      {mg}
                    </Text>
                    {count > 0 ? (
                      <View
                        style={{
                          minWidth: 22,
                          height: 22,
                          borderRadius: 99,
                          backgroundColor: c.inverseText,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 6,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "800", color: c.text }}>{count}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {exercises.length > 0 ? (
              <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
                <Text variant="label" color="textMuted">
                  ADDED
                </Text>
                {exercises.map((ex, ei) => (
                  <Card key={ei} padding="md">
                    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="caption" color="textMuted" weight="bold">
                          {ex.mg.toUpperCase()}
                        </Text>
                        <Text variant="body" weight="bold">
                          {ex.name}
                        </Text>
                      </View>
                      <Badge label={`${ex.sets.length}×`} variant="muted" />
                      <Pressable
                        onPress={() => {
                          setActiveMg(ex.mg);
                          setActiveEx(ei);
                          setStep("sets");
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="create-outline" size={20} color={c.textMuted} />
                      </Pressable>
                      <Pressable onPress={() => removeExercise(ei)} hitSlop={8}>
                        <Ionicons name="close" size={20} color={c.danger} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}

            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="label" color="textMuted">
                NOTES
              </Text>
              <TextInput
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  fontSize: theme.fontSize.md,
                  color: c.text,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
                placeholder="How did it feel? Any PRs?"
                placeholderTextColor={c.textFaint}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </>
        ) : null}

        {/* ── STEP 2: EXERCISES ─────────────────────────────────────────────── */}
        {step === "exercises" && activeMg ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
              <Pressable onPress={() => setStep("muscles")} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="textMuted" weight="bold">
                  {activeMg.toUpperCase()}
                </Text>
                <Text variant="heading">Select exercise</Text>
              </View>
            </View>

            <View style={{ gap: theme.spacing.sm }}>
              {EXERCISE_LIBRARY[activeMg].map((name) => {
                const added = alreadyAdded.has(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => pickExercise(name)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: c.surface,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: added ? c.text : c.border,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                    }}
                  >
                    <Text variant="body" weight={added ? "bold" : "regular"} style={{ flex: 1 }}>
                      {name}
                    </Text>
                    {added ? (
                      <Badge label="Edit" variant="default" />
                    ) : (
                      <Ionicons name="add" size={20} color={c.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* ── STEP 3: SETS ──────────────────────────────────────────────────── */}
        {step === "sets" && currentEx ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
              <Pressable
                onPress={() => {
                  setActiveEx(null);
                  setStep("muscles");
                }}
                hitSlop={12}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="textMuted" weight="bold">
                  {currentEx.mg.toUpperCase()}
                </Text>
                <Text variant="heading" numberOfLines={1}>
                  {currentEx.name}
                </Text>
              </View>
            </View>

            {/* Last time hint — progressive overload */}
            {lastLift ? (
              <View
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  gap: 4,
                }}
              >
                <Text variant="caption" color="textMuted" weight="bold">
                  LAST TIME
                </Text>
                <Text variant="body" weight="semibold">
                  {lastLift.sets.map((s) => `${s.weight}×${s.reps}`).join("  ·  ")}
                </Text>
              </View>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text variant="caption" color="textFaint" weight="bold" style={{ width: 40 }}>
                #
              </Text>
              <Text variant="caption" color="textFaint" weight="bold" style={{ flex: 1, textAlign: "center" }}>
                REPS
              </Text>
              <Text variant="caption" color="textFaint" weight="bold" style={{ flex: 1, textAlign: "center" }}>
                LBS
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {currentEx.sets.map((set, si) => (
              <View
                key={si}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <Text style={{ width: 40, textAlign: "center", fontWeight: "700", color: c.textFaint }}>
                  {si + 1}
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: c.surface,
                    borderWidth: 1.5,
                    borderColor: c.border,
                    borderRadius: theme.radius.md,
                    fontSize: 20,
                    fontWeight: "700",
                    textAlign: "center",
                    color: c.text,
                  }}
                  value={set.reps}
                  placeholder="0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  onChangeText={(v) => updateSet(si, "reps", v.replace(/[^0-9]/g, ""))}
                />
                <TextInput
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: c.surface,
                    borderWidth: 1.5,
                    borderColor: c.border,
                    borderRadius: theme.radius.md,
                    fontSize: 20,
                    fontWeight: "700",
                    textAlign: "center",
                    color: c.text,
                  }}
                  value={set.weight}
                  placeholder="0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  onChangeText={(v) => updateSet(si, "weight", v.replace(/[^0-9.]/g, ""))}
                />
                <Pressable
                  onPress={() => removeSet(si)}
                  disabled={currentEx.sets.length <= 1}
                  hitSlop={8}
                  style={{ width: 36, alignItems: "center", opacity: currentEx.sets.length <= 1 ? 0.2 : 1 }}
                >
                  <Ionicons name="remove-circle-outline" size={22} color={c.danger} />
                </Pressable>
              </View>
            ))}

            {currentEx.sets.length < 10 ? (
              <Pressable
                onPress={addSet}
                style={{
                  marginTop: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: c.border,
                  alignItems: "center",
                }}
              >
                <Text variant="label" weight="bold">
                  + Add set
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {/* Footer button */}
      <View style={{ marginTop: theme.spacing.lg }}>
        {step === "sets" ? (
          <Button
            title="Done — back to exercises"
            variant="secondary"
            radius="lg"
            size="lg"
            onPress={() => {
              setActiveEx(null);
              setStep("muscles");
            }}
          />
        ) : (
          <Button
            title={
              save.isPending
                ? "Saving…"
                : `Save workout${exercises.length ? ` · ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}` : ""}`
            }
            variant="primary"
            radius="lg"
            size="lg"
            glow
            haptic="medium"
            loading={save.isPending}
            disabled={!exercises.length}
            onPress={submit}
          />
        )}
      </View>
    </BottomSheet>
  );
}
