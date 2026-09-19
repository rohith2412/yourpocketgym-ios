import Screen from "../src/features/profile/ProfileDetailScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("profile-detail");
  return <Screen />;
}
