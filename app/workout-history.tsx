import Screen from "../src/features/train/WorkoutHistoryScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("workout-history");
  return <Screen />;
}
