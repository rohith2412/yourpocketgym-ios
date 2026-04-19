import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Information We Collect",
    body: `We collect the following information when you use Your Pocket Gym:

Account Information
• Name and email address when you register
• Password (stored as a secure hash - we never store plain-text passwords)
• If you use Google Sign-In: your name and email from Google

Fitness Profile (collected during onboarding and editable in settings)
• Age, height, weight, biological sex
• Fitness goal (e.g. lose fat, gain muscle, strength)
• Experience level and workout days per week

Workout Data
• Exercises logged, sets, reps, and weights
• Workout dates and session history

Nutrition Data
• Meal logs including calorie and macro estimates
• Food photos you take or select for AI analysis
• Daily nutrition goals you set

AI Trainer Conversations
• Messages you send to the AI Trainer are transmitted to our AI service to generate responses
• Conversation history may be stored to maintain context within a session

Recipe Requests
• Ingredients and meal preferences you select when generating recipes are sent to our AI service`,
  },
  {
    title: "How We Use Your Information",
    body: `We use your data to:

• Provide and personalise the app experience
• Generate AI workout plans based on your fitness profile, equipment, and goals
• Analyse food photos to estimate calories and macros
• Generate recipe suggestions based on your selected ingredients and dietary goals
• Display your workout history, volume tracking, and progress stats
• Calculate BMI and personalised nutrition goals from your profile
• Process your subscription via Stripe
• Respond to your messages in the AI Trainer feature`,
  },
  {
    title: "AI Features & Data Processing",
    body: `Your Pocket Gym uses artificial intelligence in several features:

AI Trainer (Chat)
Messages you type are sent to our AI service to generate fitness coaching responses. Chat history may be retained temporarily to maintain conversation context.

Food Photo Analysis
Photos you take or select are transmitted securely to our AI service to estimate the nutritional content of your meal. Photos are processed and are not permanently stored on our servers after analysis.

Recipe Generation
Ingredients and meal preferences you select are sent to our AI service to generate recipe suggestions. No photos are involved in this feature.

Workout Plan Generation
Your fitness profile (goal, experience level, equipment, focus area) is sent to our AI service to generate personalised workout plans.

All AI-generated content is for informational purposes only and may not be 100% accurate.`,
  },
  {
    title: "Google Sign-In",
    body: `If you choose to sign in with Google, we receive your name and email address from Google. We do not receive or store your Google password. Your use of Google Sign-In is also governed by Google's Privacy Policy at policies.google.com/privacy.`,
  },
  {
    title: "Camera & Photo Library Access",
    body: `The App requests camera and photo library access solely for the food photo analysis feature in Nutrition Tracking. We do not access your camera or photos for any other purpose. Photos are transmitted securely and are not stored after AI analysis is complete.`,
  },
  {
    title: "Data Sharing",
    body: `We do not sell your personal information. We share data only with:

• AI service providers - to power the AI Trainer, food analysis, recipe generation, and workout plan features
• Stripe - for secure payment processing (we never store your card details)
• Google - for authentication if you use Google Sign-In

All third-party providers are bound by data processing agreements and may not use your data for their own purposes.`,
  },
  {
    title: "Data Storage & Security",
    body: `Your data is stored on secure servers. We use:

• HTTPS encryption for all data transmitted between the app and our servers
• Secure token-based authentication (JWT)
• Hashed password storage

We retain your data for as long as your account is active. Workout logs, meal logs, and fitness profile data are deleted when you delete your account.`,
  },
  {
    title: "Your Rights & Account Deletion",
    body: `You have the right to:

• Access the data we hold about you
• Correct inaccurate data via the profile edit screen
• Delete your account and all associated data

To delete your account, tap "Delete Account" on the Profile screen or email us at privacy@yourpocketgym.com. Account deletion is processed within 30 days.`,
  },
  {
    title: "Children's Privacy",
    body: `Your Pocket Gym is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: "Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use of the app after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: "Contact",
    body: `For privacy-related questions or requests:\n\nprivacy@yourpocketgym.com`,
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

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
        <Text style={s.updated}>Last updated: April 18, 2025</Text>
        <Text style={s.intro}>
          Your Pocket Gym ("we", "us", or "our") is committed to protecting your
          privacy. This policy explains what data we collect across all features
          of the app, how we use it, and your rights over it.
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(250,250,248,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e5de",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#1a1a1a" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  content: { padding: 20 },
  updated: { fontSize: 11, color: "#bbb", fontWeight: "500", marginBottom: 12 },
  intro: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e5de",
    marginBottom: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e5de",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  sectionBody: { fontSize: 13, color: "#555", lineHeight: 21 },
});
