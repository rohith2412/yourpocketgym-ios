import { InviteScreen } from "../src/features/referrals/InviteScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("invite");
  return <InviteScreen />;
}
