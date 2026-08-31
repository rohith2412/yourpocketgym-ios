/**
 * AvatarButton — the small round profile control shown in screen headers.
 *
 * If the signed-in user has a photo (Google sign-in), we render that photo.
 * Otherwise we fall back to a simple initials-in-a-circle avatar (no SVG
 * cartoon).
 */

import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, TouchableOpacity, View, Text as RNText } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { resolveProfilePhoto } from "../src/features/profile/photoStorage";

type StoredUser = { name?: string; photo?: string | null };

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function AvatarButton({
  size = 44,
  onPress: onPressProp,
}: {
  size?: number;
  onPress?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (!raw) return;
        const u = JSON.parse(raw) as StoredUser;
        if (active) setUser(u);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.9, duration: 90, useNativeDriver: false }),
      Animated.timing(pressAnim, { toValue: 1, duration: 140, useNativeDriver: false }),
    ]).start(() => {
      if (onPressProp) onPressProp();
      else router.push("/profile");
    });
  };

  const photo = resolveProfilePhoto(user?.photo) ?? null;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={st.touch}>
      <Animated.View
        style={[
          st.container,
          { width: size, height: size, borderRadius: size / 2, transform: [{ scale: pressAnim }] },
        ]}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: "#e4e4e7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RNText style={{ fontSize: size * 0.4, fontWeight: "700", color: "#374151" }}>
              {initials(user?.name)}
            </RNText>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  touch: { alignSelf: "auto" },
  container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
