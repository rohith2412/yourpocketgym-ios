import { EmailAuthScreen } from "../src/features/auth/EmailAuthScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("email-auth");
  return <EmailAuthScreen />;
}
