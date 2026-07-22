import { useEffect, useState } from "react";
import { View, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen, Text, Card, Button, BottomSheet, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from "../train/data";
import { useRoutines, useUpsertRoutine, useDeleteRoutine } from "./hooks";
import {
  WEEKDAYS,
  newRoutineId,
  emptyDayPlan,
  type Routine,
  type DayPlan,
  type Weekday,
  type RoutineExercise,
} from "./storage";

const DEFAULT_NAMES: Record<number, string> = {
  0: "Push day",
  1: "Pull day",
  2: "Leg day",
  3: "Upper body",
  4: "Lower body",
  5: "Full body",
  6: "Core & cardio",
};

export function RoutineEditor() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: routines = [] } = useRoutines();
  const existing = id ? routines.find((r) => r.id === id) : undefined;

  const [step, setStep] = useState<"days" | "configure">("days");
  const [days, setDays] = useState<Partial<Record<Weekday, DayPlan>>>({});
  const [pickerDay, setPickerDay] = useState<Weekday | null>(null);
  const [pickerMg, setPickerMg] = useState<MuscleGroup>(MUSCLE_GROUPS[0]);

  const upsert = useUpsertRoutine();
  const del = useDeleteRoutine();

  useEffect(() => {
    if (existing) {
      setDays(existing.days);
      setStep("configure");
    }
  }, [existing]);

  const selectedDayKeys = WEEKDAYS.map((d) => d.key).filter((k) => days[k]);

  const toggleDay = (k: Weekday) => {
    setDays((prev) => {
      if (prev[k]) {
        const next = { ...prev };
        delete next[k];
        return next;
      }
      // Autofill a default name
      const usedNames = Object.values(prev).map((p) => p?.name);
      let defaultName = "";
      for (let i = 0; i < 7; i++) {
        const cand = DEFAULT_NAMES[i];
        if (!usedNames.includes(cand)) { defaultName = cand; break; }
      }
      return { ...prev, [k]: { ...emptyDayPlan(), name: defaultName || "Workout" } };
    });
  };

  const renameDay = (k: Weekday, name: string) =>
    setDays((prev) => (prev[k] ? { ...prev, [k]: { ...prev[k]!, name } } : prev));

  const addExercise = (k: Weekday, ex: RoutineExercise) =>
    setDays((prev) => {
      const p = prev[k];
      if (!p) return prev;
      if (p.exercises.some((e) => e.name === ex.name)) return prev;
      return { ...prev, [k]: { ...p, exercises: [...p.exercises, ex] } };
    });

  const removeExercise = (k: Weekday, name: string) =>
    setDays((prev) => {
      const p = prev[k];
      if (!p) return prev;
      return { ...prev, [k]: { ...p, exercises: p.exercises.filter((e) => e.name !== name) } };
    });

  const save = async () => {
    if (selectedDayKeys.length === 0) {
      Alert.alert("Pick at least one day.");
      return;
    }
    for (const k of selectedDayKeys) {
      const p = days[k]!;
      if (!p.name.trim()) { Alert.alert(`Name ${WEEKDAYS.find((d) => d.key === k)!.long} (e.g. Push day).`); return; }
      if (p.exercises.length === 0) { Alert.alert(`Add at least one exercise to ${p.name}.`); return; }
    }
    const now = new Date().toISOString();
    const routine: Routine = {
      id: existing?.id ?? newRoutineId(),
      days,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsert.mutateAsync(routine);
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert("Delete routine?", "Your weekly plan will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await del.mutateAsync(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen padded={false}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        }}
      >
        <Pressable
          onPress={() => (step === "configure" && !existing ? setStep("days") : router.back())}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text variant="heading" style={{ flex: 1 }}>
          {step === "days" ? "Pick your training days" : "Set up each day"}
        </Text>
        {existing ? (
          <Pressable onPress={remove} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={c.danger} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: 140,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: PICK DAYS */}
        {step === "days" ? (
          <>
            <Text variant="body" color="textMuted">
              Which days do you train? You can name each one (Push day, Pull day…) on the next step.
            </Text>

            <View style={{ gap: theme.spacing.sm }}>
              {WEEKDAYS.map((d) => {
                const on = !!days[d.key];
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => toggleDay(d.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: on ? c.inverseBg : c.surfaceAlt,
                      borderRadius: theme.radius.xl,
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                      gap: theme.spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: on ? c.inverseText : "transparent",
                        borderWidth: on ? 0 : 1.5,
                        borderColor: c.border,
                      }}
                    >
                      {on ? <Ionicons name="checkmark" size={14} color={c.inverseBg} /> : null}
                    </View>
                    <Text
                      variant="body"
                      weight="semibold"
                      style={{ flex: 1, color: on ? c.inverseText : c.text }}
                    >
                      {d.long}
                    </Text>
                    {on ? (
                      <Text variant="caption" style={{ color: c.inverseText, opacity: 0.7 }}>
                        {days[d.key]!.name || "Untitled"}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          /* STEP 2: CONFIGURE EACH SELECTED DAY */
          <>
            {selectedDayKeys.length === 0 ? (
              <Card padding="lg">
                <Text variant="body" color="textMuted" center>
                  Pick training days first.
                </Text>
              </Card>
            ) : (
              selectedDayKeys.map((k) => {
                const d = WEEKDAYS.find((w) => w.key === k)!;
                const plan = days[k]!;
                return (
                  <Card key={k} padding="lg">
                    <Text variant="caption" color="textMuted" weight="bold">
                      {d.long.toUpperCase()}
                    </Text>
                    <TextInput
                      value={plan.name}
                      onChangeText={(v) => renameDay(k, v)}
                      placeholder="Push day"
                      placeholderTextColor={c.textFaint}
                      style={{
                        fontSize: theme.fontSize.xl,
                        fontWeight: theme.fontWeight.bold,
                        color: c.text,
                        paddingVertical: theme.spacing.xs,
                      }}
                      maxLength={30}
                    />
                    <Separator inset={0} />

                    <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                      {plan.exercises.length === 0 ? (
                        <Text variant="caption" color="textFaint">
                          No exercises yet
                        </Text>
                      ) : (
                        plan.exercises.map((ex) => (
                          <View
                            key={ex.name}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: theme.spacing.xs,
                              gap: theme.spacing.sm,
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text variant="body">{ex.name}</Text>
                              <Text variant="caption" color="textMuted">
                                {ex.muscleGroup}
                              </Text>
                            </View>
                            <Pressable onPress={() => removeExercise(k, ex.name)} hitSlop={8}>
                              <Ionicons name="close" size={20} color={c.textMuted} />
                            </Pressable>
                          </View>
                        ))
                      )}
                    </View>

                    <Pressable
                      onPress={() => {
                        setPickerMg(MUSCLE_GROUPS[0]);
                        setPickerDay(k);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: theme.spacing.md,
                        marginTop: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: c.border,
                      }}
                    >
                      <Ionicons name="add" size={16} color={c.text} />
                      <Text variant="label" weight="semibold">
                        Add exercise
                      </Text>
                    </Pressable>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: theme.spacing.xl,
          paddingBottom: theme.spacing["2xl"],
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        {step === "days" ? (
          <Button
            title={`Continue${selectedDayKeys.length ? ` (${selectedDayKeys.length} day${selectedDayKeys.length !== 1 ? "s" : ""})` : ""}`}
            variant="primary"
            radius="full"
            size="lg"
            glow
            haptic="medium"
            disabled={selectedDayKeys.length === 0}
            onPress={() => setStep("configure")}
          />
        ) : (
          <Button
            title={upsert.isPending ? "Saving…" : existing ? "Save changes" : "Save routine"}
            variant="primary"
            radius="full"
            size="lg"
            glow
            haptic="medium"
            loading={upsert.isPending}
            onPress={save}
          />
        )}
      </View>

      {/* Exercise picker sheet */}
      <BottomSheet visible={pickerDay !== null} onClose={() => setPickerDay(null)}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          Add exercise
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {MUSCLE_GROUPS.map((mg) => (
            <Pressable
              key={mg}
              onPress={() => setPickerMg(mg)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.full,
                backgroundColor: pickerMg === mg ? c.text : c.surfaceAlt,
                borderWidth: 1,
                borderColor: pickerMg === mg ? c.text : c.border,
              }}
            >
              <Text
                variant="label"
                weight="semibold"
                style={{ color: pickerMg === mg ? c.inverseText : c.text }}
              >
                {mg}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {EXERCISE_LIBRARY[pickerMg].map((exName) => {
            const already = pickerDay !== null && days[pickerDay]?.exercises.some((e) => e.name === exName);
            return (
              <Pressable
                key={exName}
                onPress={() => {
                  if (pickerDay === null || already) return;
                  addExercise(pickerDay, { name: exName, muscleGroup: pickerMg });
                }}
                style={{
                  paddingVertical: theme.spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text variant="body" style={{ flex: 1, opacity: already ? 0.4 : 1 }}>
                  {exName}
                </Text>
                <Ionicons
                  name={already ? "checkmark" : "add"}
                  size={20}
                  color={already ? c.textMuted : c.text}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
