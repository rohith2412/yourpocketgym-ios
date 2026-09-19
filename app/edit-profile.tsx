import Screen from "../src/features/profile/EditProfileScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("edit-profile");
  return <Screen />;
}
