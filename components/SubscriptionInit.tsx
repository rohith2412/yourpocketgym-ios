import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useSubscription } from "@/src/hooks/useSubscription";

interface SubscriptionInitProps {
  children: React.ReactNode;
}

/**
 * Wrapper that checks subscription status BEFORE rendering child pages.
 * This prevents page flicker by ensuring subscription status is loaded first.
 */
export default function SubscriptionInit({ children }: SubscriptionInitProps) {
  const { loading } = useSubscription();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fafaf8" }}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  return <>{children}</>;
}
