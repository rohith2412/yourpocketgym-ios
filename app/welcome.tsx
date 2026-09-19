import { WelcomeScreen } from "../src/features/auth/WelcomeScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("welcome");
  return <WelcomeScreen />;
}
