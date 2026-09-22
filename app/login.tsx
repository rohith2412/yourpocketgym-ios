import { LoginScreen } from "../src/features/auth/LoginScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("login");
  return <LoginScreen />;
}
