import { useCallback, useEffect, useState } from "react";
import { getCustomerInfo, isPremium, addPremiumStatusListener } from "../services/iapService";

export function useSubscription() {
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[useSubscription] Checking subscription status...");
      const info = await getCustomerInfo();
      const premium = isPremium(info);
      console.log("[useSubscription] Premium status:", premium);
      setIsPremiumUser(premium);
      setError(null);
    } catch (err: any) {
      const msg = err?.message ?? "Could not verify subscription.";
      console.error("[useSubscription] Error checking subscription:", msg);
      console.error("[useSubscription] Error code:", err?.code);

      if (msg.includes("API Key") || msg.includes("credentials") || msg.includes("Invalid")) {
        console.error("[useSubscription] API KEY ISSUE - Check RevenueCat dashboard and iapService.ts");
      }

      setError(msg);
      setIsPremiumUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, []);

  useEffect(() => {
    const unsub = addPremiumStatusListener((info) => {
      const premium = isPremium(info);
      console.log("[useSubscription] Real-time update — premium:", premium);
      setIsPremiumUser(premium);
    });
    return unsub;
  }, []);

  return {
    isPremium:                 isPremiumUser === true,
    loading,
    error,
    subscriptionStatus:        null,
    refreshSubscriptionStatus: check,
    shouldShowPaywall:         isPremiumUser === false,
  };
}
