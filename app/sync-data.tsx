import Screen from "../src/features/sync/SyncScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("sync-data");
  return <Screen />;
}
