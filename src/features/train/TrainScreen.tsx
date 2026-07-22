import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loadUser } from "../auth/session";
import { useRoutines, useTodayPlan } from "../routines/hooks";
import { WEEKDAYS, type DayPlan } from "../routines/storage";
import { useWorkoutLogs } from "./api";
import { StreakCard } from "./components/StreakCard";
import { YearHeatmap } from "./components/YearHeatmap";
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
  const [presetPlan, setPresetPlan] = useState<DayPlan | null>(null);

  const openLog = (plan: DayPlan | null = null) => {
    setPresetPlan(plan);
    setShowLog(true);
  };
  const closeLog = () => {
    setShowLog(false);
    setPresetPlan(null);
  };
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    loadUser().then((u) => u?.name && setFirstName(u.name.split(" ")[0] ?? ""));
  }, []);

  const { data: logs = [] } = useWorkoutLogs();
  const muscleStats = buildMuscleStats(logs);
  const { data: routines = [] } = useRoutines();
  const { plan: todayPlan } = useTodayPlan();
  const todayName = WEEKDAYS.find((d) => d.key === (new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6))!.long;

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

          {/* Yearly activity heatmap */}
          <YearHeatmap logs={logs} />


          {/* Empty state or weekly plan preview */}
          {routines.length === 0 ? (
            <Card padding="xl">
              <View style={{ alignItems: "center", gap: theme.spacing.md }}>
                <Ionicons name="calendar-outline" size={30} color={c.textMuted} />
                <Text variant="body" color="textMuted" center>
                  Build your weekly plan.{"\n"}Pick the days you train, name each one (Push day, Pull day…), and add exercises.
                </Text>
                <Button
                  title="Create weekly plan"
                  variant="primary"
                  radius="full"
                  haptic="medium"
                  onPress={() => router.push("/routines/new")}
                />
              </View>
            </Card>
          ) : (
            <Pressable
              onPress={() => router.push("/routines")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.sm,
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={c.text} />
              <Text variant="label" weight="semibold">
                Weekly plan
              </Text>
              <View style={{ flex: 1 }} />
              <Text variant="label" color="textMuted">
                Manage
              </Text>
              <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
            </Pressable>
          )}

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
              openLog(todayPlan ?? null);
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
        initialExercises={presetPlan?.exercises}
        routineName={presetPlan?.name}
      />
    </View>
  );
}
