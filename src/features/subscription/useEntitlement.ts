import { useCallback, useEffect, useState } from "react";
import {
  getCustomerInfo,
  isPremium as customerIsPremium,
  addPremiumStatusListener,
} from "../../services/iapService";
import { useDevPremium } from "./devOverride";
import { isReviewAccount } from "./reviewAccounts";
import { useCurrentUser } from "../auth/useCurrentUser";

export type Plan = "free" | "premium";

export type Entitlement = {
  plan: Plan;
  isPremium: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * The single source of truth for what the user can access.
 *
 * A user is premium if EITHER:
 *   - their own RevenueCat subscription is active, OR
 *   - they're a Duo partner on someone's active sub (backend-granted).
 *
 * The Duo half comes from the backend (a `duoActive` flag on the profile) and
 * is OR'd in here — so when we ship the couples flow, nothing else changes.
 */
export function useEntitlement(): Entitlement {
  const [ownPremium, setOwnPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO(duo): populate from backend profile (email listed as a Duo partner
  // on an active subscription). OR'd into `isPremium` below.
  const duoActive = false;

  // DEV: local override toggle from Profile page (persisted in AsyncStorage).
  const { data: devForcePremium = false } = useDevPremium();

  // App Review: the demo account we hand Apple gets Pro without purchasing, so
  // the reviewer can exercise every gated surface.
  const { data: user } = useCurrentUser();
  const reviewAccount = isReviewAccount(user?.email);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getCustomerInfo();
      setOwnPremium(customerIsPremium(info));
    } catch {
      setOwnPremium(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time updates from RevenueCat (purchase, restore, expiry).
  useEffect(
    () => addPremiumStatusListener((info) => setOwnPremium(customerIsPremium(info))),
    [],
  );

  const isPremium =
    devForcePremium || reviewAccount || ownPremium === true || duoActive;

  return {
    plan: isPremium ? "premium" : "free",
    isPremium,
    loading,
    refresh,
  };
}
