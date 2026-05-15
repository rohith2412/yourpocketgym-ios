import { useEffect, useState, useCallback } from "react";
import { getCustomerInfo, isPremiumCustomer } from "../services/iapService";

export function useSubscription() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      const customerInfo = await getCustomerInfo();
      setIsPremium(isPremiumCustomer(customerInfo));
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to check subscription");
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  return {
    isPremium:                 isPremium === true,
    loading,
    error,
    subscriptionStatus:        null,
    refreshSubscriptionStatus: checkSubscriptionStatus,
    shouldShowPaywall:         isPremium === false,
  };
}
