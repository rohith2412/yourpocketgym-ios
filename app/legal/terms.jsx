import { useRouter } from "expo-router";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: `By downloading or using PocketGym, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.`,
  },
  {
    title: "Description of Service",
    body: `PocketGym provides:
• Workout logging, routines, and progress tracking
• Body-weight and progress-photo tracking
• Manual food logging and macro/water goals
• Recovery tracking (sleep, mindset, readiness score)
• Optional Pro features: AI coach chat, AI food scanner, voice logging (workouts, meals and water), AI meal plans, and cloud data sync`,
  },
  {
    title: "Subscription & Billing",
    body: `Pro is offered as an auto-renewing subscription (monthly or yearly) billed through your Apple ID. Payment is charged at confirmation of purchase and again at each renewal unless you cancel at least 24 hours before the current period ends.

You can manage or cancel your subscription at any time from Settings → Your Name → Subscriptions on your device. Deleting the app does not cancel a subscription.

Prices are shown on the paywall in your local currency and may change over time; any change takes effect at the start of the next billing period.`,
  },
  {
    title: "AI Disclaimer",
    body: `The AI coach, recipe suggestions, workout plans, food analysis, voice-log transcripts, and recovery guidance are for informational purposes only. They are not a substitute for professional medical, nutritional, or fitness advice.

AI outputs may contain errors. Always consult a qualified professional before starting a new exercise program, making significant dietary changes, or acting on any health-related recommendation. Results vary and are not guaranteed.`,
  },
  {
    title: "Health & Safety",
    body: `Exercise involves risk of injury. You assume full responsibility for your use of this app and any physical activity you undertake as a result. PocketGym is not liable for any injury, illness, or health complication arising from use of the app.`,
  },
  {
    title: "Recovery & Mindset Data",
    body: `Sleep, mindset check-ins, and the derived recovery score are self-reported wellness indicators only. They are not a diagnostic tool. If you are concerned about your sleep, mood, or physical recovery, please consult a qualified professional.`,
  },
  {
    title: "Camera, Photos & Voice",
    body: `• The food scanner uses your camera and photo library solely to analyze food for calorie and macro estimation. Images are processed to generate nutritional data.
• Progress photos stay on your device and are only backed up if you enable Sync Data.
• Voice logging (Pro) sends short audio clips to our server for transcription so they can be turned into a workout, meal, or water entry. Clips are not retained after transcription.`,
  },
  {
    title: "Cloud Data Sync (Pro)",
    body: `If you enable Sync Data, PocketGym uploads a snapshot of your local app state (routines, food, water, weight, coach chats, preferences, and similar) to your account so it can be restored when you sign in on another device or after reinstalling. Snapshots are private to your account. You can stop syncing at any time by cancelling Pro; existing snapshots are removed when you delete your account.`,
  },
  {
    title: "User Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to notify us immediately of any unauthorized use of your account.`,
  },
  {
    title: "Prohibited Conduct",
    body: `You agree not to:
• Reverse engineer or attempt to extract source code
• Use the app for any unlawful purpose
• Share your account with others
• Attempt to disrupt or compromise our servers or services
• Abuse the AI features (spam, automated scripts, or attempts to bypass usage limits)`,
  },
  {
    title: "Data & Account Deletion",
    body: `You may delete your account at any time from Profile → Delete Account. This permanently removes all your data from our servers, including workout logs, meal logs, chat history, cloud sync snapshots, and profile information. Deletion is irreversible.`,
  },
  {
    title: "Intellectual Property",
    body: `All content, design, and code within PocketGym is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: "Limitation of Liability",
    body: `To the fullest extent permitted by law, PocketGym and its developers are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app.`,
  },
  {
    title: "Changes to Terms",
    body: `We may update these terms from time to time. Continued use of the app after changes are posted constitutes your acceptance of the updated terms. Material changes will be highlighted in-app when practical.`,
  },
  {
    title: "Contact",
    body: `Questions about these terms? Reach us at rayandteamsupport@gmail.com.`,
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const st = makeSt(colors);
  const router = useRouter();
  return (
    <SafeAreaView style={st.screen} edges={["top"]}>
      <StatusBar barStyle={colors.statusBar} />
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.updated}>Last updated: July 2026</Text>
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={st.section}>
            <Text style={st.sectionTitle}>{sec.title}</Text>
            <Text style={st.sectionBody}>{sec.body}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeSt = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  back: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: c.text },
  title: { fontSize: 26, fontWeight: "800", color: c.text, letterSpacing: -1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  updated: { fontSize: 12, color: c.textFaint, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: c.text, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: c.textMuted, lineHeight: 22 },
});
