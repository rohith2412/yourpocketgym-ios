import { useEffect, useRef } from "react";
import {
  AdEventType,
  InterstitialAd,
} from "react-native-google-mobile-ads";
import { AD_UNITS } from "./config";
import { useAdsDisabled } from "./devToggle";

// Don't show an interstitial more than once every 3 minutes per user session —
// this keeps the app from feeling like an ad wall and avoids AdMob throttling.
const MIN_GAP_MS = 3 * 60 * 1000;
let lastShownAt = 0;

/**
 * Preloads an interstitial and gives the caller a `show()` fn. Fires for
 * all users unless the admin toggle in Admin → Ads is flipped OFF.
 */
export function useInterstitial() {
  const { data: disabled } = useAdsDisabled();
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    if (disabled) return;
    const ad = InterstitialAd.createForAdRequest(AD_UNITS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      // Reload for the next call once the user closes the current one.
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      // Swallow — never let an ad failure surface to the user.
    });

    ad.load();

    return () => {
      unsubClosed();
      unsubError();
      adRef.current = null;
    };
  }, [disabled]);

  return {
    show: () => {
      if (disabled) return;
      const ad = adRef.current;
      if (!ad || !ad.loaded) return;
      const now = Date.now();
      if (now - lastShownAt < MIN_GAP_MS) return;
      lastShownAt = now;
      try {
        ad.show();
      } catch {
        // Ignore — ad may have expired between loaded-check and show.
      }
    },
  };
}
