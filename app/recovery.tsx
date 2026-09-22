import Screen from "../src/features/recovery/RecoveryScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("recovery");
  return <Screen />;
}
