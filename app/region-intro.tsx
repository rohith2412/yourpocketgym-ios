import Screen from "../src/features/onboarding/RegionIntroScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("region-intro");
  return <Screen />;
}
