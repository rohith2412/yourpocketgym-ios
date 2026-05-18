import { useCallback, useEffect, useState } from "react";
import { getCustomerInfo, isPremium } from "../services/iapService";

export function useSubscription() {
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      const info = await getCustomerInfo();
      setIsPremiumUser(isPremium(info));
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Could not verify subscription.");
      setIsPremiumUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, []);

  return {
    isPremium:                 isPremiumUser === true,
    loading,
    error,
    subscriptionStatus:        null,
    refreshSubscriptionStatus: check,
    shouldShowPaywall:         isPremiumUser === false,
  };
}
