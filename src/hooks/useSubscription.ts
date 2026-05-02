import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserSubscriptionStatus } from "../types/subscription";

/**
 * Hook to check if user is premium subscriber
 * Caches subscription status to avoid flickering on navigation
 */
export function useSubscription() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<UserSubscriptionStatus | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      // Try to get cached status first (5 minute cache)
      const cachedData = await AsyncStorage.getItem("subscriptionStatus");
      const cacheTime = await AsyncStorage.getItem("subscriptionStatusTime");
      const now = Date.now();

      if (cachedData && cacheTime) {
        const cacheAge = now - parseInt(cacheTime);
        if (cacheAge < 5 * 60 * 1000) {
          // Cache is fresh (less than 5 minutes old)
          const data: UserSubscriptionStatus = JSON.parse(cachedData);
          setSubscriptionStatus(data);
          setIsPremium(data.isPremium);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data from backend
      setLoading(true);
      const response = await fetch(
        "https://yourpocketgym.com/api/subscription/status",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data: UserSubscriptionStatus = await response.json();
      setSubscriptionStatus(data);
      setIsPremium(data.isPremium);
      setError(null);

      // Cache the response
      await AsyncStorage.setItem("subscriptionStatus", JSON.stringify(data));
      await AsyncStorage.setItem("subscriptionStatusTime", now.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setIsPremium(false);
      console.error("Subscription check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh subscription status (call after purchase)
  const refreshSubscriptionStatus = async () => {
    // Clear cache before refreshing
    await AsyncStorage.removeItem("subscriptionStatus");
    await AsyncStorage.removeItem("subscriptionStatusTime");
    await checkSubscriptionStatus();
  };

  // Don't show paywall while checking (isPremium is null)
  // Only show paywall if isPremium is explicitly false
  const shouldShowPaywall = isPremium === false;

  return {
    isPremium: isPremium === true, // Only true if explicitly confirmed by server
    loading,
    error,
    subscriptionStatus,
    refreshSubscriptionStatus,
    shouldShowPaywall,
  };
}
