import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Information We Collect",
    body: `We collect the following when you use PocketGym:

Account Information
• Name and email address when you register
• Password (stored as a secure hash — we never store plain-text passwords)
• If you use Google Sign-In: your name and email from Google

Fitness Profile (collected during onboarding, editable in settings)
• Age, height, weight, biological sex
• Fitness goal (e.g. lose fat, gain muscle, strength)
• Experience level and workout days per week

Workout & Activity Data
• Exercises, sets, reps, weights, and session dates
• Weekly routines you create
• Body weight entries and progress photos (progress photos stay on your device unless you enable Sync Data)

Nutrition Data
• Manual food entries, water intake, macro & calorie goals
• Food photos submitted to the AI scanner (Pro)

Recovery Data
• Sleep hours and quality, mindset check-ins
• The derived recovery score

AI Coach & Voice
• Chat messages you send to the AI Coach (Pro)
• Short voice clips submitted for workout, meal and water transcription (Pro)

Cloud Sync (Pro)
• If you enable Sync Data, a snapshot of the above local state is uploaded to your account so it can be restored on another device.

Subscription
• We receive an anonymised subscription status from Apple / RevenueCat (active / cancelled / expired). We never see your card, Apple ID password, or payment details.`,
  },
  {
    title: "How We Use Your Information",
    body: `We use your data to:

• Provide and personalise the app experience
• Compute stats — workout volume, macros, recovery score, weight trends
• Power AI features (coach, food scan, voice logging, meal plans, workout planning)
• Restore your data on new devices via cloud sync (Pro)
• Confirm your subscription entitlement
• Investigate bugs and abuse

We do not use your data for advertising or profiling.`,
  },
  {
    title: "AI Features & Data Processing",
    body: `Pro AI features send limited data to our AI providers to generate responses:

AI Coach (Chat) — the messages you type are transmitted to generate coaching replies. Recent chat context may be included with each request.

Food Photo Scanner — the photo you take is transmitted to estimate calories and macros. Photos are not retained after analysis.

Voice Logging — short audio clips are transmitted for transcription and structured into a workout, meal, or water entry. Clips are not retained after transcription.

Meal & Workout Plans — your goals and preferences are transmitted to generate plans.

All AI outputs may contain errors; they are for informational purposes only.`,
  },
  {
    title: "Google Sign-In",
    body: `If you choose to sign in with Google, we receive your name and email address from Google. We do not receive or store your Google password. Your use of Google Sign-In is also governed by Google's Privacy Policy at policies.google.com/privacy.`,
  },
  {
    title: "Camera, Photos & Microphone",
    body: `• Camera & photo library — used only for the food scanner and progress photos. We access nothing else.
• Microphone — used only when you tap the voice-log button. We are not recording in the background.
• Progress photos stay on your device by default and are only uploaded if you enable Sync Data.`,
  },
  {
    title: "Data Sharing",
    body: `We do not sell your personal information. We share data only with:

• AI service providers — to power AI Coach, food scanner, voice transcription, and plan generation
• Apple & RevenueCat — for subscription verification
• Google — for authentication if you use Google Sign-In
• Hosting providers — to run the servers this app depends on

Providers are bound by data-processing agreements and may not use your data for their own purposes.`,
  },
  {
    title: "Data Storage & Security",
    body: `Your data is stored on secure servers. We use:

• HTTPS encryption for all traffic between the app and our servers
• JWT-based authentication with tokens stored in the device's secure enclave
• Hashed password storage
• Snapshot uploads (Sync Data) are private to your account and never publicly indexed

We retain your data for as long as your account is active.`,
  },
  {
    title: "Your Rights & Account Deletion",
    body: `You have the right to:

• Access the data we hold about you
• Correct inaccurate data via the profile edit screen
• Delete your account and every associated record (including workouts, meal logs, chats, and cloud snapshots)

To delete your account, tap "Delete Account" on the Profile screen or email rayandteamsupport@gmail.com. Deletion is processed within 30 days.`,
  },
  {
    title: "Children's Privacy",
    body: `PocketGym is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us information, contact us immediately.`,
  },
  {
    title: "Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Material changes will be flagged in the app when practical. Continued use after changes take effect constitutes your acceptance.`,
  },
  {
    title: "Contact",
    body: `Privacy questions or requests: rayandteamsupport@gmail.com`,
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const s = makeS(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle={colors.statusBar} />

      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.updated}>Last updated: July 2026</Text>
        <Text style={s.intro}>
          PocketGym ("we", "us", or "our") is committed to protecting your
          privacy. This policy explains what data we collect across every
          feature of the app, how we use it, and your rights over it.
        </Text>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeS = (c) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: c.bg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: c.text },
  headerTitle: { fontSize: 16, fontWeight: "800", color: c.text },
  content: { padding: 20 },
  updated: { fontSize: 11, color: c.textFaint, fontWeight: "500", marginBottom: 12 },
  intro: {
    fontSize: 14,
    color: c.textMuted,
    lineHeight: 22,
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 16,
  },
  section: {
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: c.text,
    marginBottom: 8,
  },
  sectionBody: { fontSize: 13, color: c.textMuted, lineHeight: 21 },
});
