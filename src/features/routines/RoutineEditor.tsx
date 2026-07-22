import { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen, Text, Card, Button, Input, Badge, Separator, BottomSheet } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from "../train/data";
import { useRoutines, useUpsertRoutine, useDeleteRoutine } from "./hooks";
import { newRoutineId, type Routine, type RoutineExercise } from "./storage";

export function RoutineEditor() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: routines = [] } = useRoutines();
  const existing = id ? routines.find((r) => r.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [exercises, setExercises] = useState<RoutineExercise[]>(existing?.exercises ?? []);
  const [picker, setPicker] = useState<null | MuscleGroup>(null);

  const upsert = useUpsertRoutine();
  const del = useDeleteRoutine();

  const addExercise = (mg: MuscleGroup, exName: string) => {
    setExercises((prev) => [
      ...prev,
      { name: exName, muscleGroup: mg, targetSets: 3, targetReps: 10 },
    ]);
    setPicker(null);
  };

  const removeAt = (i: number) => setExercises((prev) => prev.filter((_, j) => j !== i));

  const bumpSets = (i: number, delta: number) =>
    setExercises((prev) =>
      prev.map((ex, j) => (j !== i ? ex : { ...ex, targetSets: Math.max(1, Math.min(10, ex.targetSets + delta)) })),
    );

  const bumpReps = (i: number, delta: number) =>
    setExercises((prev) =>
      prev.map((ex, j) => (j !== i ? ex : { ...ex, targetReps: Math.max(1, Math.min(30, ex.targetReps + delta)) })),
    );

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Give this routine a name.");
      return;
    }
    if (exercises.length === 0) {
      Alert.alert("Add at least one exercise.");
      return;
    }
    const now = new Date().toISOString();
    const routine: Routine = {
      id: existing?.id ?? newRoutineId(),
      name: name.trim(),
      exercises,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsert.mutateAsync(routine);
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert("Delete routine?", `"${existing.name}" will be removed.`, [
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
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text variant="heading" style={{ flex: 1 }}>
          {existing ? "Edit routine" : "New routine"}
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
          paddingBottom: 120,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Name"
          placeholder="e.g. Push Day"
          value={name}
          onChangeText={setName}
          maxLength={40}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="label" color="textMuted">
              EXERCISES
            </Text>
            <Text variant="label" color="textFaint">
              {exercises.length}
            </Text>
          </View>

          {exercises.length === 0 ? (
            <Card>
              <Text variant="body" color="textMuted" center>
                Add exercises to build this routine.
              </Text>
            </Card>
          ) : (
            exercises.map((ex, i) => (
              <Card key={`${ex.name}-${i}`} padding="lg">
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption" color="textMuted" weight="bold">
                      {ex.muscleGroup.toUpperCase()}
                    </Text>
                    <Text variant="body" weight="bold">
                      {ex.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeAt(i)} hitSlop={8}>
                    <Ionicons name="close" size={20} color={c.textMuted} />
                  </Pressable>
                </View>

                <Separator inset={0} />

                <View style={{ flexDirection: "row", gap: theme.spacing.lg, marginTop: theme.spacing.sm }}>
                  <Counter label="Sets" value={ex.targetSets} onMinus={() => bumpSets(i, -1)} onPlus={() => bumpSets(i, 1)} />
                  <Counter label="Reps" value={ex.targetReps} onMinus={() => bumpReps(i, -1)} onPlus={() => bumpReps(i, 1)} />
                </View>
              </Card>
            ))
          )}

          <Button
            title="+ Add exercise"
            variant="secondary"
            radius="md"
            haptic="light"
            onPress={() => setPicker(MUSCLE_GROUPS[0])}
          />
        </View>
      </ScrollView>

      {/* Save button */}
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
        <Button
          title={upsert.isPending ? "Saving…" : existing ? "Save changes" : "Create routine"}
          variant="primary"
          radius="full"
          size="lg"
          glow
          haptic="medium"
          loading={upsert.isPending}
          onPress={save}
        />
      </View>

      {/* Exercise picker sheet */}
      <BottomSheet visible={picker !== null} onClose={() => setPicker(null)}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          Add an exercise
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {MUSCLE_GROUPS.map((mg) => (
            <Pressable
              key={mg}
              onPress={() => setPicker(mg)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.full,
                backgroundColor: picker === mg ? c.text : c.surfaceAlt,
                borderWidth: 1,
                borderColor: picker === mg ? c.text : c.border,
              }}
            >
              <Text
                variant="label"
                weight="semibold"
                style={{ color: picker === mg ? c.inverseText : c.text }}
              >
                {mg}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {picker
            ? EXERCISE_LIBRARY[picker].map((exName) => (
                <Pressable
                  key={exName}
                  onPress={() => addExercise(picker, exName)}
                  style={{
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text variant="body" style={{ flex: 1 }}>
                    {exName}
                  </Text>
                  <Ionicons name="add" size={20} color={c.textMuted} />
                </Pressable>
              ))
            : null}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}

// Small +/- counter — used for target sets/reps
function Counter({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text variant="caption" color="textMuted" weight="bold">
        {label.toUpperCase()}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <Pressable
          onPress={onMinus}
          hitSlop={8}
          style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="remove" size={16} color={c.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: theme.fontWeight.heavy, color: c.text, minWidth: 24, textAlign: "center" }}>
          {value}
        </Text>
        <Pressable
          onPress={onPlus}
          hitSlop={8}
          style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={16} color={c.text} />
        </Pressable>
      </View>
    </View>
  );
}
