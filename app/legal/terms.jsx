import { useRouter } from "expo-router";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: `By downloading or using Your Pocket Gym, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.`,
  },
  {
    title: "Description of Service",
    body: `Your Pocket Gym provides:
• Workout logging and progress tracking
• AI-generated workout plans
• Nutrition scanning via camera
• AI-generated recipes based on your ingredients
• An AI personal trainer chat assistant`,
  },
  {
    title: "AI Disclaimer",
    body: `The AI trainer, recipe suggestions, workout plans, and food analysis are for informational purposes only. They are not a substitute for professional medical, nutritional, or fitness advice.

Always consult a qualified professional before starting a new exercise program or making significant dietary changes. Results vary and are not guaranteed.`,
  },
  {
    title: "Health & Safety",
    body: `Exercise involves risk of injury. You assume full responsibility for your use of this app and any physical activity you undertake as a result. Your Pocket Gym is not liable for any injury, illness, or health complication arising from use of the app.`,
  },
  {
    title: "Camera & Photos",
    body: `The nutrition scanner uses your device camera and photo library solely to analyze food for calorie and macro estimation. Images are processed to generate nutritional data and are not stored on our servers.`,
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
• Attempt to disrupt or compromise our servers or services`,
  },
  {
    title: "Data & Account Deletion",
    body: `You may delete your account at any time from Profile → Delete Account. This permanently removes all your data from our servers including workout logs, meal logs, recipes, and profile information.`,
  },
  {
    title: "Subscriptions & Billing",
    body: `Some features may require a paid subscription. Subscriptions are billed through the Apple App Store. You can manage or cancel your subscription at any time through your App Store account settings. No refunds are provided for partial subscription periods unless required by law.`,
  },
  {
    title: "Intellectual Property",
    body: `All content, design, and code within Your Pocket Gym is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: "Limitation of Liability",
    body: `To the fullest extent permitted by law, Your Pocket Gym and its developers are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app.`,
  },
  {
    title: "Changes to Terms",
    body: `We may update these terms from time to time. Continued use of the app after changes are posted constitutes your acceptance of the updated terms.`,
  },
  {
    title: "Contact",
    body: `If you have questions about these terms, contact us at support@yourpocketgym.com`,
  },
];

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={st.screen} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.back}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.updated}>Last updated: April 2025</Text>
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

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafaf8" },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  back: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: "#ff6b35" },
  title: { fontSize: 26, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  updated: { fontSize: 12, color: "#bbb", marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  sectionBody: { fontSize: 14, color: "#555", lineHeight: 22 },
});
