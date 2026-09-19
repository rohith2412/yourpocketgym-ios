import Screen from "../src/features/progressPhotos/ProgressPhotosScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("progress-photos");
  return <Screen />;
}
