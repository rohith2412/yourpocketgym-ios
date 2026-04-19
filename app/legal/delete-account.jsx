import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getToken, removeToken } from "../../src/auth/storage";

const BASE_URL = "https://yourpocketgym.com";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const CONFIRM_WORD = "DELETE";
  const isReady = confirmation.trim().toUpperCase() === CONFIRM_WORD;

  async function handleDelete() {
    if (!isReady) return;

    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data including workout logs, meal logs, and your fitness profile. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, delete my account",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getToken();
              const res = await fetch(`${BASE_URL}/api/delete-account`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();

              if (json.success) {
                await removeToken();
                await AsyncStorage.multiRemove(["token", "user"]);
                Alert.alert(
                  "Account Deleted",
                  "Your account and all associated data have been permanently deleted.",
                  [{ text: "OK", onPress: () => router.replace("/login") }]
                );
              } else {
                Alert.alert("Error", json.error || "Failed to delete account. Please try again or contact support@yourpocketgym.com");
              }
            } catch {
              Alert.alert("Error", "Something went wrong. Please try again or contact support@yourpocketgym.com");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle}>Delete Account</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning card */}
        <View style={s.warningCard}>
          <Text style={s.warningIcon}>⚠️</Text>
          <Text style={s.warningTitle}>This cannot be undone</Text>
          <Text style={s.warningBody}>
            Deleting your account will permanently remove:
          </Text>
          <View style={s.list}>
            {[
              "Your profile and fitness data",
              "All workout logs and history",
              "All meal logs and nutrition data",
              "Your AI Trainer conversation history",
              "Your subscription (no refund for remaining days)",
            ].map((item, i) => (
              <View key={i} style={s.listRow}>
                <Text style={s.listDot}>•</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Alternative */}
        <View style={s.altCard}>
          <Text style={s.altTitle}>Not ready to leave?</Text>
          <Text style={s.altBody}>
            If you have an issue with the app, we'd love to help before you go.
            Contact us at{" "}
            <Text style={s.altLink}>support@yourpocketgym.com</Text>
          </Text>
        </View>

        {/* Confirmation input */}
        <View style={s.confirmCard}>
          <Text style={s.confirmLabel}>
            Type <Text style={s.confirmWord}>DELETE</Text> to confirm
          </Text>
          <TextInput
            style={[s.input, isReady && s.inputReady]}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Type DELETE here"
            placeholderTextColor="#ccc"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Delete button */}
        <Pressable
          style={[s.deleteBtn, (!isReady || loading) && s.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!isReady || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.deleteBtnText}>Permanently Delete Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={s.cancelBtn}>
          <Text style={s.cancelBtnText}>Cancel, keep my account</Text>
        </Pressable>

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
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: "#e8e5de",
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: "#1a1a1a" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  content: { padding: 20, gap: 12 },

  warningCard: {
    backgroundColor: "rgba(239,68,68,0.05)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 20,
    padding: 20,
  },
  warningIcon: { fontSize: 28, marginBottom: 8 },
  warningTitle: { fontSize: 17, fontWeight: "800", color: "#ef4444", marginBottom: 8 },
  warningBody: { fontSize: 13, color: "#666", marginBottom: 12 },
  list: { gap: 6 },
  listRow: { flexDirection: "row", gap: 8 },
  listDot: { fontSize: 13, color: "#ef4444", marginTop: 1 },
  listText: { fontSize: 13, color: "#555", flex: 1, lineHeight: 19 },

  altCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
    borderRadius: 16,
    padding: 16,
  },
  altTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  altBody: { fontSize: 13, color: "#777", lineHeight: 19 },
  altLink: { color: "#6366f1", fontWeight: "600" },

  confirmCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e5de",
    borderRadius: 16,
    padding: 16,
  },
  confirmLabel: { fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 19 },
  confirmWord: { fontWeight: "800", color: "#ef4444" },
  input: {
    borderWidth: 1.5,
    borderColor: "#e8e5de",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 2,
  },
  inputReady: { borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.04)" },

  deleteBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  deleteBtnDisabled: { backgroundColor: "#f4f2ed" },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelBtnText: { fontSize: 14, color: "#bbb", fontWeight: "500" },
});
