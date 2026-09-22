import Screen from "../src/features/admin/AdminScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("admin");
  return <Screen />;
}
