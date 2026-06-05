import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
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
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log("[SubscriptionInit] Starting RevenueCat init...");
        const userStr = await AsyncStorage.getItem("user");
        let userId: string | undefined;

        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user?.id ?? user?.sub ?? user?.uid ?? undefined;
            console.log("[SubscriptionInit] User found:", userId ?? "no id field");
          } catch (parseErr) {
            console.error("[SubscriptionInit] Failed to parse user:", parseErr);
          }
        } else {
          console.log("[SubscriptionInit] No user in storage, using anonymous");
        }

        configureRevenueCat(userId);
        console.log("[SubscriptionInit] RevenueCat init complete");
      } catch (err: any) {
        const msg = err?.message ?? "Unknown error";
        console.error("[SubscriptionInit] Init error:", msg);
        setInitError(msg);
      }
      setRcReady(true);
    })();
  }, []);

  if (!rcReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  // Even if there's an init error, still render children — paywall will handle gracefully
  if (initError) {
    console.warn("[SubscriptionInit] Rendering children despite init error:", initError);
  }

  return <>{children}</>;
}
