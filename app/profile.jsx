import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { getToken, removeToken } from "../src/auth/storage";
import { decode as atob } from "base-64";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        // Decode JWT safely
        const base64 = token.split(".")[1];
        const payload = JSON.parse(atob(base64));

        setUser({
          name: payload.name || "User",
          email: payload.email || "No email",
        });
      } catch (err) {
        console.log("Token decode error:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await removeToken();
      router.replace("/login");
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#ff6b35" />
      </View>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.name}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
      </View>

      {/* Info card */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.rowLabel}>Name</Text>
          <Text style={s.rowValue}>{user?.name}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.row}>
          <Text style={s.rowLabel}>Email</Text>
          <Text style={s.rowValue}>{user?.email}</Text>
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        disabled={loggingOut}
        style={[s.logoutBtn, loggingOut && s.logoutBtnDisabled]}
      >
        <Text style={s.logoutText}>
          {loggingOut ? "Logging out…" : "Log out"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,229,222,0.5)",
    backgroundColor: "#fafaf8",
  },
  backBtn: { width: 60 },
  backText: { fontSize: 14, fontWeight: "700", color: "#aaa" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },

  avatarSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#aaa",
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e5de",
    overflow: "hidden",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#aaa",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    maxWidth: "65%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0ede8",
    marginHorizontal: 16,
  },

  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecdcd",
    padding: 16,
    alignItems: "center",
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f43f5e",
  },
});