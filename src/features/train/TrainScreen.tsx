import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Button } from "../../ui";
import type { Routine } from "../routines/storage";
import { useTheme } from "../../theme/ThemeProvider";
import { loadUser } from "../auth/session";
import { useRoutines } from "../routines/hooks";
import { useWorkoutLogs } from "./api";
import { StreakCard } from "./components/StreakCard";
import { buildMuscleStats, MuscleAccordionRow } from "./components/MuscleAccordion";
import { LogSheet } from "./components/LogSheet";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function TrainScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [showLog, setShowLog] = useState(false);
  const [presetRoutine, setPresetRoutine] = useState<Routine | null>(null);

  const openLog = (routine: Routine | null = null) => {
    setPresetRoutine(routine);
    setShowLog(true);
  };
  const closeLog = () => {
    setShowLog(false);
    setPresetRoutine(null);
  };
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    loadUser().then((u) => u?.name && setFirstName(u.name.split(" ")[0] ?? ""));
  }, []);

  const { data: logs = [] } = useWorkoutLogs();
  const muscleStats = buildMuscleStats(logs);
  const { data: routines = [] } = useRoutines();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: 140,
            gap: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: theme.spacing.lg }}>
            <Text variant="caption" color="textMuted">
              Good {getGreeting()}
              {firstName ? `, ${firstName}` : ""}
            </Text>
            <Text variant="title">Train</Text>
          </View>

          {/* Streak card */}
          <StreakCard logs={logs} />

          {/* Your routines — the primary way to log; tap opens LogSheet pre-filled */}
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text variant="label" color="textMuted">
                YOUR ROUTINES
              </Text>
            </View>

            {routines.length === 0 ? (
              <Card padding="xl">
                <View style={{ alignItems: "center", gap: theme.spacing.md }}>
                  <Ionicons name="calendar-outline" size={30} color={c.textMuted} />
                  <Text variant="body" color="textMuted" center>
                    Build a routine once, log it every session.{"\n"}You'll see last time's weight so you know what to lift.
                  </Text>
                  <Button
                    title="Create a routine"
                    variant="primary"
                    radius="full"
                    haptic="medium"
                    onPress={() => router.push("/routines/new")}
                  />
                </View>
              </Card>
            ) : null}
            {/* Only one routine allowed — tap card body to log, pencil to edit/delete. */}
            {routines[0] ? (
              <Card padding="lg">
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                  <Pressable
                    onPress={() => openLog(routines[0])}
                    style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, flex: 1 }}
                  >
                    <View
                      style={{
                        width: 48, height: 48, borderRadius: theme.radius.xl,
                        backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Ionicons name="flash" size={22} color={c.text} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="body" weight="bold">
                        {routines[0].name}
                      </Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {routines[0].exercises.length} exercise{routines[0].exercises.length !== 1 ? "s" : ""} · tap to start
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/routines/[id]", params: { id: routines[0].id } })
                    }
                    hitSlop={10}
                    style={{
                      width: 40, height: 40, borderRadius: theme.radius.lg,
                      backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color={c.text} />
                  </Pressable>
                </View>
              </Card>
            ) : null}
          </View>

          {/* Progress: body parts */}
          {logs.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: theme.spacing["3xl"], gap: theme.spacing.md }}>
              <Text variant="heading">No workouts yet</Text>
              <Text variant="body" color="textMuted" center>
                Log your first session to start tracking progress
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="label" color="textMuted">
                BODY PARTS
              </Text>
              {muscleStats.map((stat) => (
                <MuscleAccordionRow key={stat.mg} stat={stat} logs={logs} />
              ))}
            </View>
          )}

        </ScrollView>
      </Screen>

      {/* FAB */}
      {!showLog ? (
        <View style={{ position: "absolute", bottom: theme.spacing.xl, right: theme.spacing.xl }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              openLog(null);
            }}
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.radius.xl,
              backgroundColor: c.inverseBg,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: c.inverseBg,
              shadowOpacity: 0.28,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Ionicons name="add" size={30} color={c.inverseText} />
          </Pressable>
        </View>
      ) : null}

      <LogSheet
        visible={showLog}
        onClose={closeLog}
        initialExercises={presetRoutine?.exercises}
        routineName={presetRoutine?.name}
      />
    </View>
  );
}
