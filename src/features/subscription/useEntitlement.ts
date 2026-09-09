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

const ADMIN_EMAIL = "rohithra75@gmail.com";

/**
 * Build-time paywall switch.
 *
 * false — paywall is *off*: everyone gets Pro. Handy for launch weeks and
 *         while we sort out billing wiring. The admin can still flip to Free
 *         via the dev tools to test the free-tier experience.
 * true  — paywall is *on*: the real RevenueCat entitlement decides.
 *
 * The whole real-entitlement expression stays wired below regardless, so
 * flipping this back is a one-line change with nothing else to touch.
 */
export const PAYWALL_ENABLED = false;

/**
 * The single source of truth for what the user can access.
 */
export function useEntitlement(): Entitlement {
  const [ownPremium, setOwnPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO(duo): populate from backend profile (email listed as a Duo partner
  // on an active subscription). OR'd into `isPremium` below.
  const duoActive = false;

  // DEV toggle. Meaning depends on the regime:
  //   PAYWALL_ENABLED = true  → "force premium ON"  (admin sees Pro without
  //                              a real subscription)
  //   PAYWALL_ENABLED = false → "view as Free"      (admin opts *out* of Pro
  //                              even though everyone else has it, to QA the
  //                              free experience)
  // Same storage key, opposite polarity — the segmented control in
  // ProfileDetail (Free / Premium) still reads correctly either way.
  const { data: devToggle = false } = useDevPremium();

  // App Review: the demo account we hand Apple gets Pro without purchasing, so
  // the reviewer can exercise every gated surface.
  const { data: user } = useCurrentUser();
  const reviewAccount = isReviewAccount(user?.email);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

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

  // The real entitlement expression — always computed so RevenueCat's
  // side-effects (fetches, cache updates, listeners) still run whichever
  // regime we're in.
  const realIsPremium =
    devToggle || reviewAccount || ownPremium === true || duoActive;

  // While the paywall is off, admin's toggle means "view as free"; everyone
  // else is Pro by definition. When the paywall's back on, the real check
  // drives the whole app again.
  const isPremium = PAYWALL_ENABLED
    ? realIsPremium
    : isAdmin
    ? !devToggle // admin: Premium segment → devToggle=true → view as Free
    : true;

  return {
    plan: isPremium ? "premium" : "free",
    isPremium,
    loading,
    refresh,
  };
}
