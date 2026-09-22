import Screen from "../src/features/profile/AboutScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("about");
  return <Screen />;
}
