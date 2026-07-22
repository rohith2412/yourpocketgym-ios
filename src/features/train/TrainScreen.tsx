import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Badge } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loadUser } from "../auth/session";
import { useTodayRoutine, useRoutines } from "../routines/hooks";
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
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    loadUser().then((u) => u?.name && setFirstName(u.name.split(" ")[0] ?? ""));
  }, []);

  const { data: logs = [] } = useWorkoutLogs();
  const muscleStats = buildMuscleStats(logs);
  const { routine, isRest } = useTodayRoutine();
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

          {/* Today's workout */}
          <Card
            onPress={() =>
              routine ? setShowLog(true) : router.push("/routines")
            }
            padding="lg"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
              <View
                style={{
                  width: 44, height: 44, borderRadius: theme.radius.lg,
                  backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons
                  name={routine ? "flash" : isRest ? "bed-outline" : "calendar-outline"}
                  size={20}
                  color={c.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="textMuted" weight="bold">
                  TODAY
                </Text>
                <Text variant="body" weight="bold">
                  {routine ? routine.name : "Rest day"}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {routine
                    ? `${routine.exercises.length} exercises · tap to start`
                    : routines.length === 0
                    ? "Set up a routine to see today's workout"
                    : "Schedule a routine for today"}
                </Text>
              </View>
              <Ionicons
                name={routine ? "play" : "chevron-forward"}
                size={20}
                color={c.textFaint}
              />
            </View>
          </Card>

          {/* Routines shortcut */}
          <Pressable
            onPress={() => router.push("/routines")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: theme.spacing.sm,
              gap: theme.spacing.sm,
            }}
          >
            <Text variant="label" color="text" weight="semibold">
              Routines
            </Text>
            <Badge label={String(routines.length)} variant="muted" />
            <View style={{ flex: 1 }} />
            <Text variant="label" color="textMuted">
              Manage
            </Text>
            <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
          </Pressable>

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
              setShowLog(true);
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

      <LogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </View>
  );
}
