import { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Button, Badge, BottomSheet, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useRoutines, useSchedule, useSetSchedule } from "./hooks";
import { WEEKDAYS, type Routine, type Weekday } from "./storage";

export function RoutinesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const { data: routines = [] } = useRoutines();
  const { data: schedule } = useSchedule();
  const setSchedule = useSetSchedule();

  const [pickerDay, setPickerDay] = useState<Weekday | null>(null);

  const today = new Date().getDay() as Weekday;

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
          Build you routines
        </Text>
        {routines.length === 0 ? (
          <Pressable onPress={() => router.push("/routines/new")} hitSlop={12}>
            <Ionicons name="add" size={24} color={c.text} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: theme.spacing["3xl"],
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly schedule */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            WEEKLY SCHEDULE
          </Text>
          <Card padding="sm">
            {WEEKDAYS.map((d, i) => {
              const rid = schedule?.[d.key] ?? null;
              const r = rid ? routines.find((x) => x.id === rid) : null;
              const isToday = d.key === today;
              return (
                <View key={d.key}>
                  {i > 0 ? <Separator inset={theme.spacing.lg} /> : null}
                  <Pressable
                    onPress={() => setPickerDay(d.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                      gap: theme.spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: isToday ? c.text : c.surfaceAlt,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text
                        variant="label"
                        weight="bold"
                        style={{ color: isToday ? c.inverseText : c.text }}
                      >
                        {d.short}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight="semibold">
                        {d.long}
                        {isToday ? (
                          <Text variant="caption" color="textMuted">
                            {"  ·  Today"}
                          </Text>
                        ) : null}
                      </Text>
                      <Text variant="caption" color={r ? "textMuted" : "textFaint"}>
                        {r ? r.name : "Rest day"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Your routines */}
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="label" color="textMuted">
              YOUR ROUTINES
            </Text>
            <Text variant="label" color="textFaint">
              {routines.length}
            </Text>
          </View>

          {routines.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.lg }}>
                <Ionicons name="barbell-outline" size={28} color={c.textMuted} />
                <Text variant="body" color="textMuted" center>
                  No routines yet. Create one to save your favorite workouts.
                </Text>
                <Button
                  title="Create your first routine"
                  variant="primary"
                  radius="full"
                  haptic="medium"
                  onPress={() => router.push("/routines/new")}
                />
              </View>
            </Card>
          ) : (
            routines.map((r) => <RoutineRow key={r.id} routine={r} />)
          )}
        </View>
      </ScrollView>

      {/* Day picker — choose routine for a day */}
      <BottomSheet visible={pickerDay !== null} onClose={() => setPickerDay(null)}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          {pickerDay !== null ? WEEKDAYS[pickerDay].long : ""}
        </Text>

        <Pressable
          onPress={async () => {
            if (pickerDay !== null) await setSchedule.mutateAsync({ day: pickerDay, routineId: null });
            setPickerDay(null);
          }}
          style={{ paddingVertical: theme.spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text variant="body">Rest day</Text>
          {pickerDay !== null && schedule?.[pickerDay] === null ? (
            <Ionicons name="checkmark" size={20} color={c.text} />
          ) : null}
        </Pressable>

        <Separator inset={0} />

        {routines.length === 0 ? (
          <Text variant="body" color="textMuted" center style={{ paddingVertical: theme.spacing.lg }}>
            Create a routine first
          </Text>
        ) : (
          routines.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Separator inset={0} /> : null}
              <Pressable
                onPress={async () => {
                  if (pickerDay !== null) await setSchedule.mutateAsync({ day: pickerDay, routineId: r.id });
                  setPickerDay(null);
                }}
                style={{ paddingVertical: theme.spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View>
                  <Text variant="body" weight="semibold">
                    {r.name}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {r.exercises.length} exercise{r.exercises.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                {pickerDay !== null && schedule?.[pickerDay] === r.id ? (
                  <Ionicons name="checkmark" size={20} color={c.text} />
                ) : null}
              </Pressable>
            </View>
          ))
        )}
      </BottomSheet>
    </Screen>
  );
}

function RoutineRow({ routine }: { routine: Routine }) {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Card onPress={() => router.push({ pathname: "/routines/[id]", params: { id: routine.id } })} padding="lg">
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body" weight="bold">
            {routine.name}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {routine.exercises.map((e) => e.name).join(" · ")}
          </Text>
        </View>
        <Badge label={`${routine.exercises.length} ex`} variant="muted" />
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
      </View>
    </Card>
  );
}
