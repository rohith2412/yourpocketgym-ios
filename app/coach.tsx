import { CoachScreen } from "../src/features/coach/CoachScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("coach");
  return <CoachScreen />;
}
