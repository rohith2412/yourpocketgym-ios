import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AD_UNITS } from "./config";

/**
 * Anchored banner. Currently shows for ALL users — the Pro-gate lands in a
 * later version once we have real subscribers to gate against. Re-wire
 * `useShowAds()` in front of this return once PAYWALL_ENABLED flips on.
 */
export function AdBanner() {
  return (
    <View style={{ alignItems: "center" }}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
