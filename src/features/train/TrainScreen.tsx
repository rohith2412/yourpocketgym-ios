import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Button, FabMenu, useHideOnScroll } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useCurrentUser } from "../auth/useCurrentUser";
import { useRoutines, useTodayPlan } from "../routines/hooks";
import { WEEKDAYS, type DayPlan } from "../routines/storage";
import { useWorkoutLogs } from "./api";
import { StreakCard } from "./components/StreakCard";
import { YearHeatmap } from "./components/YearHeatmap";
import { MuscleList } from "./components/MuscleList";
import { WorkoutHistoryList } from "./components/WorkoutHistoryList";
import { LogSheet } from "./components/LogSheet";
import AvatarButton from "../../../components/AvatarButton";
import { useTabNav } from "../../nav/tabNav";
import { useEntitlement } from "../subscription/useEntitlement";
import { VoiceLogSheet } from "../voiceLog/VoiceLogSheet";
//weekly plan + br
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
  const { goToProfile } = useTabNav();

  const [showLog, setShowLog] = useState(false);
  const [presetPlan, setPresetPlan] = useState<DayPlan | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const { isPremium } = useEntitlement();


  const openLog = (plan: DayPlan | null = null) => {
    setPresetPlan(plan);
    setShowLog(true);
  };
  const closeLog = () => {
    setShowLog(false);
    setPresetPlan(null);
  };
  const { hidden: fabHidden, onScroll } = useHideOnScroll();
  const { data: currentUser } = useCurrentUser();
  const firstName = currentUser?.name?.split(" ")[0] ?? "";

  const { data: logs = [] } = useWorkoutLogs();
  const { data: routines = [] } = useRoutines();
  const { plan: todayPlan } = useTodayPlan();
  const todayName = WEEKDAYS.find((d) => d.key === (new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6))!.long;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: 140,
            gap: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: theme.spacing.lg,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text variant="caption" color="textMuted">
                Good {getGreeting()}
                {firstName ? `, ${firstName}` : ""}
              </Text>
              <Text variant="title">Train</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AvatarButton size={40} onPress={goToProfile} />
            </View>
          </View>

          {/* Streak card */}
          <StreakCard logs={logs} />

          {/* Yearly activity heatmap */}
          {/* <YearHeatmap logs={logs} /> */}


          {/* Empty state or weekly plan preview */}
          {routines.length === 0 ? (
            <Pressable onPress={() => router.push("/routines/new")}>
              <Card padding="md">
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={c.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold" style={{ fontSize: 14 }}>
                      Create weekly plan
                    </Text>
                    <Text
                      variant="caption"
                      color="textMuted"
                      style={{ fontSize: 11, lineHeight: 14 }}
                      numberOfLines={1}
                    >
                      Pick training days and add exercises
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={c.textFaint}
                  />
                </View>
              </Card>
            </Pressable>
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

          {/* Progress: body parts + history — matches Nutrition's shape */}
          {logs.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: theme.spacing["3xl"], gap: theme.spacing.md }}>
              <Text variant="heading">No workouts yet</Text>
              <Text variant="body" color="textMuted" center>
                Log your first session to start tracking progress
              </Text>
            </View>
          ) : (
            <>
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="label" color="textMuted">
                  BODY PARTS
                </Text>
                <MuscleList logs={logs} />
              </View>

              <View style={{ gap: theme.spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text variant="label" color="textMuted">
                    HISTORY
                  </Text>
                  <Pressable
                    onPress={() => router.push("/workout-history" as never)}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: c.surfaceAlt,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      variant="caption"
                      weight="bold"
                      style={{ fontSize: 11, color: c.text }}
                    >
                      See all
                    </Text>
                    <Text
                      variant="caption"
                      style={{ fontSize: 10, color: c.textMuted, fontWeight: "700" }}
                    >
                      {logs.length}
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color={c.textFaint} />
                  </Pressable>
                </View>
                <WorkoutHistoryList logs={logs} limit={3} />
              </View>
            </>
          )}

        </ScrollView>
      </Screen>

      {!showLog ? (
        <FabMenu
          hidden={fabHidden}
          items={[
            ...(isPremium
              ? [
                  {
                    icon: "mic" as const,
                    label: "Voice log",
                    sublabel: "AI transcribes your sets",
                    onPress: () => setShowVoice(true),
                  },
                ]
              : []),
            {
              icon: "create-outline" as const,
              label: "Write it",
              sublabel: "Log a workout manually",
              onPress: () => openLog(todayPlan ?? null),
            },
          ]}
        />
      ) : null}

      <LogSheet
        visible={showLog}
        onClose={closeLog}
        initialExercises={presetPlan?.exercises}
        routineName={presetPlan?.name}
      />

      {isPremium ? (
        <VoiceLogSheet visible={showVoice} onClose={() => setShowVoice(false)} />
      ) : null}
    </View>
  );
}
