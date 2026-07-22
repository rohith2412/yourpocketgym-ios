import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";

const SUGGESTIONS = [
  "Build me a 4-day muscle gain plan",
  "How do I fix my squat form?",
  "What should I eat post-workout?",
];

export function CoachScreen() {
  const { theme } = useTheme();
  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.xl }}>
      <View style={{ paddingTop: theme.spacing.lg }}>
        <Text variant="caption" color="textMuted">
          Your AI trainer
        </Text>
        <Text variant="title">Coach</Text>
      </View>

      <Card style={{ gap: theme.spacing.md, alignItems: "center", paddingVertical: theme.spacing["2xl"] }}>
        <Ionicons name="sparkles" size={32} color={theme.colors.text} />
        <Text variant="heading" center>
          Ask me anything
        </Text>
        <Text variant="body" color="textMuted" center>
          Workouts, form, nutrition, recovery — I adapt to your goals.
        </Text>
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          TRY ASKING
        </Text>
        {SUGGESTIONS.map((s) => (
          <Card key={s} onPress={() => {}} padding="lg">
            <Text variant="body">{s}</Text>
          </Card>
        ))}
      </View>

      <Button title="Analyze my form (video)" variant="secondary" radius="lg" left={<Ionicons name="videocam-outline" size={18} color={theme.colors.text} />} onPress={() => {}} />
    </Screen>
  );
}
