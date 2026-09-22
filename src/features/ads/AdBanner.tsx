import React from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AD_UNITS } from "./config";
import { useAdsDisabled } from "./devToggle";

/**
 * Anchored banner. Shows for all users unless the admin toggle in Admin →
 * Ads is flipped OFF. The Pro-gate lands in a later version once we have
 * real subscribers.
 */
export function AdBanner() {
  const { data: disabled } = useAdsDisabled();
  if (disabled) return null;

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
