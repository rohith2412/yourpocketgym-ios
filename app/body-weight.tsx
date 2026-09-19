import Screen from "../src/features/progress/BodyWeightScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("body-weight");
  return <Screen />;
}
