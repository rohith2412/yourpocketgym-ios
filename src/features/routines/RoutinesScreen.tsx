import { View, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card, Button, Separator } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useRoutines } from "./hooks";
import { WEEKDAYS, type Routine, type Weekday } from "./storage";

export function RoutinesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const { data: routines = [] } = useRoutines();
  const today = new Date().getDay() as Weekday;

  return (
    <Screen padded={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text variant="heading" style={{ flex: 1 }}>
          Weekly plan
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
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing["3xl"],
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {routines.length === 0 ? (
          <Card padding="xl">
            <View style={{ alignItems: "center", gap: theme.spacing.md }}>
              <Ionicons name="calendar-outline" size={30} color={c.textMuted} />
              <Text variant="body" color="textMuted" center>
                No plan yet. Build your weekly routine — pick days, name each one, add exercises.
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
          routines.map((r) => <RoutineCard key={r.id} routine={r} today={today} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function RoutineCard({ routine, today }: { routine: Routine; today: Weekday }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  return (
    <Card padding="lg">
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.md }}>
        <Text variant="label" color="textMuted" style={{ flex: 1 }}>
          WEEKLY SCHEDULE
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/routines/[id]", params: { id: routine.id } })}
          hitSlop={10}
        >
          <Ionicons name="create-outline" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      {WEEKDAYS.map((d, i) => {
        const plan = routine.days[d.key];
        const isToday = d.key === today;
        return (
          <View key={d.key}>
            {i > 0 ? <Separator inset={0} /> : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: theme.spacing.md,
                gap: theme.spacing.md,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isToday ? c.text : c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
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
                <Text variant="body" weight="semibold" color={plan ? "text" : "textFaint"}>
                  {plan?.name ?? "Rest day"}
                </Text>
                {plan ? (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {plan.exercises.length} exercise{plan.exercises.length !== 1 ? "s" : ""}
                    {plan.exercises.length > 0 ? " · " + plan.exercises.map((e) => e.name).slice(0, 3).join(", ") + (plan.exercises.length > 3 ? "…" : "") : ""}
                  </Text>
                ) : null}
              </View>
              {isToday ? (
                <View
                  style={{
                    backgroundColor: c.text,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: theme.radius.full,
                  }}
                >
                  <Text
                    variant="caption"
                    weight="bold"
                    style={{ color: c.inverseText, fontSize: 10 }}
                  >
                    TODAY
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}
