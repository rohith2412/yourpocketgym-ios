import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen, Text, SegmentedControl } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loadUser } from "../auth/session";
import { useWorkoutLogs } from "./api";
import { StreakCard } from "./components/StreakCard";
import { buildMuscleStats, MuscleAccordionRow } from "./components/MuscleAccordion";
import { HistoryList } from "./components/HistoryList";
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

  const [tab, setTab] = useState<"progress" | "history">("progress");
  const [showLog, setShowLog] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    loadUser().then((u) => u?.name && setFirstName(u.name.split(" ")[0] ?? ""));
  }, []);

  const { data: logs = [], isLoading } = useWorkoutLogs();
  const muscleStats = buildMuscleStats(logs);

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

          {/* Tab switcher */}
          <SegmentedControl
            value={tab}
            onChange={setTab}
            segments={[
              { value: "progress", label: "Progress" },
              { value: "history", label: "History" },
            ]}
          />

          {/* Content */}
          {tab === "progress" ? (
            logs.length === 0 ? (
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
            )
          ) : (
            <HistoryList logs={logs} loading={isLoading} />
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
