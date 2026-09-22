import { useEntitlement } from "../subscription/useEntitlement";

/**
 * Single source of truth for "should this user see ads?"
 *
 * Currently: everyone who isn't Pro sees ads. When we add the 7-day trial
 * or referral-ad-free reward, expand this to check those states too.
 */
export function useShowAds(): boolean {
  const { isPremium } = useEntitlement();
  return !isPremium;
}
