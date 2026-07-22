import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Badge, BottomSheet } from "../../ui";
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
  const [showChooser, setShowChooser] = useState(false);
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

          {/* Routines UI temporarily hidden — will re-enable once the "Log from routine" flow lands.
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
          */}

          {/* Your routines — shown every day (Cal AI-style large cards) */}
          {routines.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text variant="label" color="textMuted">
                  YOUR ROUTINES
                </Text>
                <Pressable onPress={() => router.push("/routines")} hitSlop={8}>
                  <Text variant="label" color="textMuted">
                    Manage
                  </Text>
                </Pressable>
              </View>
              {routines.map((r) => (
                <Card key={r.id} onPress={() => setShowLog(true)} padding="lg">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
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
                        {r.name}
                      </Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {r.exercises.length} exercise{r.exercises.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Ionicons name="play" size={18} color={c.textFaint} />
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

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
              setShowChooser(true);
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

      {/* + FAB chooser — Cal AI-style two big options */}
      <BottomSheet visible={showChooser} onClose={() => setShowChooser(false)}>
        <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.xl }}>
          <Text variant="title">What next?</Text>
          <Text variant="body" color="textMuted">
            Save a routine to reuse, or just log this workout.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <ChooserOption
            icon="calendar-outline"
            title="Create a routine"
            sub="Build a reusable workout"
            onPress={() => {
              setShowChooser(false);
              router.push("/routines/new");
            }}
          />
          <ChooserOption
            icon="add-circle-outline"
            title="Log manually"
            sub="Track today's workout only"
            onPress={() => {
              setShowChooser(false);
              setShowLog(true);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

function ChooserOption({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: c.surfaceAlt,
        borderRadius: theme.radius["2xl"],
        padding: theme.spacing.xl,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.lg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.xl,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={26} color={c.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="bold">
          {title}
        </Text>
        <Text variant="caption" color="textMuted">
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </Pressable>
  );
}
