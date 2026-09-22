import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// In __DEV__ we always show Google's test ads so we never risk an "invalid
// traffic" strike on the real account. Prod uses the real IDs baked in below
// (kept in source, not env, so a debug build still uses test IDs).
const isDev = __DEV__;

const PROD = {
  ios: {
    banner: "ca-app-pub-7656656037446061/6354127065",
    // TODO: real interstitial ID once created in AdMob — falls back to test.
    interstitial: TestIds.INTERSTITIAL,
  },
  android: {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
  },
};

function pick(unit: "banner" | "interstitial"): string {
  if (isDev) {
    return unit === "banner" ? TestIds.BANNER : TestIds.INTERSTITIAL;
  }
  const p = Platform.OS === "ios" ? PROD.ios : PROD.android;
  return p[unit];
}

export const AD_UNITS = {
  get banner() {
    return pick("banner");
  },
  get interstitial() {
    return pick("interstitial");
  },
};
