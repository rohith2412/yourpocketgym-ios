import Screen from "../src/features/mealPlans/MealPlansScreen";
import { useScreenTracking } from "../src/features/analytics/useScreenTracking";

export default function Route() {
  useScreenTracking("meal-plans");
  return <Screen />;
}
