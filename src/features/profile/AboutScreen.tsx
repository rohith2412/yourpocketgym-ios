import { View, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Screen, Text, Card } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { PAYWALL_ENABLED } from "../subscription/useEntitlement";

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  pro?: boolean;
};

const CORE: Feature[] = [
  { icon: "barbell-outline",  title: "Workout logging",   body: "Sets, reps, weights, notes — plus a weekly routine you build once and reuse." },
  { icon: "flame-outline",    title: "Streaks & volume",  body: "Session streak, total tonnage, and a year-long activity heatmap." },
  { icon: "restaurant-outline", title: "Nutrition & water", body: "Manual food entries, macro & calorie goals, water intake tracking." },
  { icon: "scale-outline",    title: "Body weight",       body: "One-tap daily weight with a rolling trend chart." },
];

const PRO: Feature[] = [
  { icon: "sparkles",         title: "Coach AI",           body: "A trainer in your pocket. Ask anything — programming, form, cutting, bulking.", pro: true },
  { icon: "camera-outline",   title: "Photo food scanner", body: "Snap a plate; get calories and macros instantly.", pro: true },
  { icon: "mic-outline",      title: "Voice workout log",  body: "Speak your sets between rounds — we transcribe and structure the log.", pro: true },
  { icon: "restaurant-outline", title: "Voice food & water", body: "Say what you ate and drank; we estimate the macros and log the water.", pro: true },
  { icon: "leaf-outline",     title: "Recovery",           body: "Log sleep and mindset; get a readiness score that guides today's training.", pro: true },
  { icon: "image-outline",    title: "Progress photos",    body: "Weekly physique check-ins, side-by-side comparisons.", pro: true },
  { icon: "cloud-outline",    title: "Cloud sync",         body: "Back up everything to your account and restore on any device.", pro: true },
];

export default function AboutScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? "2.0";

  return (
    <Screen
      scroll
      contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.lg }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            About
          </Text>
          <Text variant="title">PocketGym</Text>
        </View>
      </View>

      {/* Hero */}
      <Card padding="xl" style={{ alignItems: "center", gap: theme.spacing.sm }}>
        <Image
          source={require("../../../assets/images/icon.png")}
          style={{ width: 88, height: 88, borderRadius: 20 }}
          resizeMode="contain"
        />
        <Text
          weight="bold"
          style={{ fontFamily: "Didot", fontSize: 28, letterSpacing: -0.5, marginTop: 4, color: c.text }}
        >
          PocketGym
        </Text>
        <Text variant="body" color="textMuted" center style={{ maxWidth: 300, lineHeight: 20 }}>
          One app for the training, the food, the sleep, and the coaching —
          designed to keep you consistent, not overwhelmed.
        </Text>
        <Text variant="caption" color="textFaint" style={{ marginTop: 4 }}>
          Version {appVersion}
        </Text>
      </Card>

      {/* Features. While the paywall is off, everything is one list — showing
          "PRO" badges next to features the user can already use just reads as
          upsell theatre. When PAYWALL_ENABLED flips back the split returns. */}
      {PAYWALL_ENABLED ? (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
              FOR EVERYONE
            </Text>
            <Card padding="lg" style={{ gap: theme.spacing.lg }}>
              {CORE.map((f, i) => (
                <FeatureRow key={i} feature={f} c={c} theme={theme} />
              ))}
            </Card>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
              PRO FEATURES
            </Text>
            <Card padding="lg" style={{ gap: theme.spacing.lg }}>
              {PRO.map((f, i) => (
                <FeatureRow key={i} feature={f} c={c} theme={theme} />
              ))}
            </Card>
          </View>
        </>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
            WHAT'S INSIDE
          </Text>
          <Card padding="lg" style={{ gap: theme.spacing.lg }}>
            {[...CORE, ...PRO.map((f) => ({ ...f, pro: false }))].map((f, i) => (
              <FeatureRow key={i} feature={f} c={c} theme={theme} />
            ))}
          </Card>
        </View>
      )}

      {/* Fair use — client-side caps that keep AI costs sane. Users find out
          about these when they hit them; better to say up front. */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
          FAIR USE
        </Text>
        <Card padding="lg" style={{ gap: theme.spacing.sm }}>
          <Text variant="body" style={{ lineHeight: 20 }}>
            AI features are metered so a hot mic or a runaway upload can't burn
            through the day for everyone else:
          </Text>
          <View style={{ gap: 4, marginTop: 2 }}>
            <Text variant="body" color="textMuted" style={{ lineHeight: 20 }}>
              • Photo food scan — 5 per day
            </Text>
            <Text variant="body" color="textMuted" style={{ lineHeight: 20 }}>
              • Voice logging — capped at 1 minute per take
            </Text>
          </View>
        </Card>
      </View>

      {/* Contact */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
          MADE WITH
        </Text>
        <Card padding="lg" style={{ gap: theme.spacing.sm }}>
          <Text variant="body" style={{ lineHeight: 20 }}>
            Built by a small team of people who train, eat, and sleep like
            everyone else — and got tired of stitching together five apps to
            keep track of it. If something's broken or missing, tell us. Every
            email lands in a real inbox.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:rayandteamsupport@gmail.com").catch(() => {})}
            hitSlop={6}
            style={{ marginTop: theme.spacing.xs }}
          >
            <Text variant="body" weight="bold" style={{ color: c.text }}>
              rayandteamsupport@gmail.com  →
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* Legal */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
          LEGAL
        </Text>
        <Card padding="sm">
          <LinkRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push("/legal/terms")} c={c} theme={theme} />
          <View style={{ height: 1, backgroundColor: c.border, marginLeft: 44 }} />
          <LinkRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push("/legal/privacy")} c={c} theme={theme} />
        </Card>
      </View>

      <Text variant="caption" color="textFaint" center>
        © {new Date().getFullYear()} PocketGym
      </Text>
    </Screen>
  );
}

function FeatureRow({ feature, c, theme }: { feature: Feature; c: any; theme: any }) {
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.md, alignItems: "flex-start" }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <Ionicons name={feature.icon} size={17} color={c.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="body" weight="bold" style={{ fontSize: 15 }}>
            {feature.title}
          </Text>
          {feature.pro ? (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 6,
                backgroundColor: c.surfaceAlt,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "800", color: c.textMuted, letterSpacing: 0.5 }}>
                PRO
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" color="textMuted" style={{ fontSize: 13, lineHeight: 18 }}>
          {feature.body}
        </Text>
      </View>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  c,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  c: any;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={c.text} />
      <Text variant="body" weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
    </Pressable>
  );
}
