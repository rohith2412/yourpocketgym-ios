import { RestaurantsScreen } from "../src/features/restaurants/RestaurantsScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("restaurants");
  return <RestaurantsScreen />;
}
