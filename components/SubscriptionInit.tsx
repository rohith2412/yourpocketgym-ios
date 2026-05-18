import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { configureRevenueCat } from "@/src/services/iapService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SubscriptionInitProps {
  children: React.ReactNode;
}

/**
 * Configures RevenueCat BEFORE rendering any children.
 * Children call useSubscription() themselves — RC is guaranteed to be
 * configured by the time they mount.
 */
export default function SubscriptionInit({ children }: SubscriptionInitProps) {
  const [rcReady, setRcReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const userId  = userStr ? JSON.parse(userStr)?.id ?? undefined : undefined;
        configureRevenueCat(userId);
      } catch {}
      setRcReady(true);
    })();
  }, []);

  if (!rcReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fafaf8" }}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  return <>{children}</>;
}
